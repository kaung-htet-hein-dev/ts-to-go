// Hand-authored traces for the Playground. Each step is written as a patch
// on top of the previous one, so a new preset is just a list of small diffs.

export type GState = 'none' | 'runnable' | 'running' | 'blocked' | 'done' | 'deadlock'

export interface ChanState {
  name: string
  cap: number
  buf: number[]
  sendq: string[]
  recvq: string[]
  closed: boolean
}

export interface Step {
  msg: string
  /** goroutine id -> state */
  gs: Record<string, GState>
  /** goroutine id -> 0-based code line it is on */
  lines: Record<string, number>
  chans: ChanState[]
  counters: { name: string; value: number; note: string }[]
  out: string[]
  status: 'idle' | 'run' | 'done' | 'deadlock'
}

export interface Goroutine { id: string; name: string }

export interface Preset {
  id: string
  name: string
  intro: string
  code: string
  goroutines: Goroutine[]
  steps: Step[]
  /** Explanation shown when the trace ends in a deadlock. */
  deadlock?: { why: string; stuck: { id: string; why: string; where: string }[] }
}

type Patch = Partial<Omit<Step, 'gs' | 'lines' | 'chans'>> & {
  msg: string
  gs?: Record<string, GState>
  lines?: Record<string, number>
  chans?: Record<string, Partial<ChanState>>
}

function build(goroutines: Goroutine[], intro: string, patches: Patch[]): Step[] {
  const idle: Step = {
    msg: intro,
    gs: Object.fromEntries(goroutines.map(g => [g.id, 'none' as GState])),
    lines: {}, chans: [], counters: [], out: [], status: 'idle',
  }
  const steps = [idle]
  for (const p of patches) {
    const prev = steps[steps.length - 1]
    const chans = prev.chans.map(c => ({ ...c, ...(p.chans?.[c.name] ?? {}) }))
    for (const [name, c] of Object.entries(p.chans ?? {})) {
      if (!chans.some(x => x.name === name)) {
        chans.push({ name, cap: 0, buf: [], sendq: [], recvq: [], closed: false, ...c })
      }
    }
    steps.push({
      msg: p.msg,
      gs: { ...prev.gs, ...p.gs },
      lines: { ...prev.lines, ...p.lines },
      chans,
      counters: p.counters ?? prev.counters,
      out: p.out ?? prev.out,
      status: p.status ?? 'run',
    })
  }
  return steps
}

const HANDOFF_G: Goroutine[] = [{ id: 'g1', name: 'main' }, { id: 'g2', name: 'printer' }]
const handoffIntro = 'main sends two values to a printer goroutine over an unbuffered channel. Press Run to watch every send meet a receive.'
const handoff: Preset = {
  id: 'handoff',
  name: 'Unbuffered handoff',
  intro: handoffIntro,
  goroutines: HANDOFF_G,
  code: `func printer(ch <-chan int, done chan<- bool) {
    for v := range ch {
        fmt.Println(v)
    }
    done <- true
}

func main() {
    ch := make(chan int)
    done := make(chan bool)
    go printer(ch, done)
    ch <- 1
    ch <- 2
    close(ch)
    <-done
}`,
  steps: build(HANDOFF_G, handoffIntro, [
    { msg: 'main creates ch and done. Neither has a buffer, so every send has to meet a receive.', gs: { g1: 'running' }, lines: { g1: 8 }, chans: { ch: {}, done: {} } },
    { msg: 'main starts printer as g2. A new goroutine is runnable, but it has not run yet.', gs: { g2: 'runnable' }, lines: { g1: 10, g2: 1 } },
    { msg: 'main sends 1. Nobody is receiving yet, so main blocks on the send.', gs: { g1: 'blocked' }, lines: { g1: 11 }, chans: { ch: { sendq: ['g1'] } } },
    { msg: 'printer reaches range ch and finds main waiting. It takes 1 straight from main, and main wakes up.', gs: { g1: 'runnable', g2: 'running' }, chans: { ch: { sendq: [] } } },
    { msg: 'printer prints 1, loops back, and blocks waiting for the next value.', gs: { g2: 'blocked' }, lines: { g2: 1 }, chans: { ch: { recvq: ['g2'] } }, out: ['1'] },
    { msg: 'main sends 2. printer is already waiting, so the handoff is immediate.', gs: { g1: 'running', g2: 'runnable' }, lines: { g1: 12 }, chans: { ch: { recvq: [] } } },
    { msg: 'printer prints 2 and goes back to waiting on ch.', gs: { g1: 'runnable', g2: 'blocked' }, lines: { g2: 1 }, chans: { ch: { recvq: ['g2'] } }, out: ['1', '2'] },
    { msg: 'main closes ch. The waiting printer wakes up to find it closed.', gs: { g1: 'running', g2: 'runnable' }, lines: { g1: 13 }, chans: { ch: { recvq: [], closed: true } } },
    { msg: 'main now waits on done for printer to finish.', gs: { g1: 'blocked' }, lines: { g1: 14 }, chans: { done: { recvq: ['g1'] } } },
    { msg: 'ch is closed and empty, so the range loop ends. printer sends true on done, straight into main’s hands.', gs: { g1: 'runnable', g2: 'done' }, lines: { g2: 4 }, chans: { done: { recvq: [] } } },
    { msg: 'main receives from done and returns. The program exits cleanly.', gs: { g1: 'done' }, lines: { g1: 15 }, status: 'done' },
  ]),
}

const FORGOT_G: Goroutine[] = [{ id: 'g1', name: 'main' }, { id: 'g2', name: 'producer' }]
const DEADLOCK_OUT = ['1', '2', 'fatal error: all goroutines are asleep - deadlock!', '', 'goroutine 1 [chan receive]:', '  main.main() main.go:11']
const forgotCloseIntro = 'A producer sends two values and returns. main ranges over the channel. Press Run and find the line that never finishes.'
const forgotClose: Preset = {
  id: 'forgot-close',
  name: 'Deadlock: forgot close(ch)',
  intro: forgotCloseIntro,
  goroutines: FORGOT_G,
  code: `func producer(ch chan<- int) {
    for i := 1; i <= 2; i++ {
        ch <- i
    }
    // close(ch)  missing
}

func main() {
    ch := make(chan int, 2)
    go producer(ch)
    for v := range ch {
        fmt.Println(v)
    }
}`,
  deadlock: {
    why: 'main is parked on range ch, which only ends when ch is closed. producer has already returned, so nobody will ever send again or call close(ch).',
    stuck: [{ id: 'g1', why: 'chan receive', where: 'main.go:11  for v := range ch' }],
  },
  steps: build(FORGOT_G, forgotCloseIntro, [
    { msg: 'main creates ch with room for two values.', gs: { g1: 'running' }, lines: { g1: 8 }, chans: { ch: { cap: 2 } } },
    { msg: 'main starts producer as g2. It waits in the run queue for now.', gs: { g2: 'runnable' }, lines: { g1: 9, g2: 1 } },
    { msg: 'ch is empty, so main blocks at the top of the range loop.', gs: { g1: 'blocked' }, lines: { g1: 10 }, chans: { ch: { recvq: ['g1'] } } },
    { msg: 'producer sends 1. main is waiting, so 1 goes straight to it.', gs: { g1: 'runnable', g2: 'running' }, lines: { g2: 2 }, chans: { ch: { recvq: [] } } },
    { msg: 'producer sends 2. main hasn’t come back for it yet, so it lands in the buffer.', lines: { g2: 2 }, chans: { ch: { buf: [2] } } },
    { msg: 'producer’s loop is over and it returns. It never called close(ch).', gs: { g2: 'done' }, lines: { g2: 5 } },
    { msg: 'main prints 1.', gs: { g1: 'running' }, lines: { g1: 11 }, out: ['1'] },
    { msg: 'main takes 2 from the buffer and prints it.', lines: { g1: 11 }, chans: { ch: { buf: [] } }, out: ['1', '2'] },
    { msg: 'ch is empty and not closed, so range waits for another value.', gs: { g1: 'blocked' }, lines: { g1: 10 }, chans: { ch: { recvq: ['g1'] } } },
    { msg: 'No other goroutine is left to send or close ch. The runtime reports a deadlock.', gs: { g1: 'deadlock' }, out: DEADLOCK_OUT, status: 'deadlock' },
  ]),
}

const WG_G: Goroutine[] = [{ id: 'g1', name: 'main' }, { id: 'g2', name: 'worker' }, { id: 'g3', name: 'worker' }]
const wg = (value: number, note: string) => [{ name: 'wg', value, note }]
const waitGroupIntro = 'main starts two workers and waits for both with a sync.WaitGroup. Press Run to watch the counter.'
const waitGroup: Preset = {
  id: 'waitgroup',
  name: 'WaitGroup',
  intro: waitGroupIntro,
  goroutines: WG_G,
  code: `func worker(id int, wg *sync.WaitGroup) {
    defer wg.Done()
    fmt.Println("worker", id, "done")
}

func main() {
    var wg sync.WaitGroup
    for id := 1; id <= 2; id++ {
        wg.Add(1)
        go worker(id, &wg)
    }
    wg.Wait()
    fmt.Println("all done")
}`,
  steps: build(WG_G, waitGroupIntro, [
    { msg: 'main adds 1 to the WaitGroup counter.', gs: { g1: 'running' }, lines: { g1: 8 }, counters: wg(1, 'workers still running') },
    { msg: 'main starts worker 1 as g2.', gs: { g2: 'runnable' }, lines: { g1: 9, g2: 1 } },
    { msg: 'main adds 1 again and starts worker 2 as g3. The counter is 2.', gs: { g3: 'runnable' }, lines: { g1: 9, g3: 1 }, counters: wg(2, 'workers still running') },
    { msg: 'main blocks in wg.Wait() until the counter reaches 0.', gs: { g1: 'blocked' }, lines: { g1: 11 }, counters: wg(2, 'main is waiting for 0') },
    { msg: 'worker 1 runs and prints.', gs: { g2: 'running' }, lines: { g2: 2 }, out: ['worker 1 done'] },
    { msg: 'worker 1 returns, and its deferred wg.Done() drops the counter to 1. worker 2 runs and prints.', gs: { g2: 'done', g3: 'running' }, lines: { g2: 1, g3: 2 }, counters: wg(1, 'main is waiting for 0'), out: ['worker 1 done', 'worker 2 done'] },
    { msg: 'worker 2 returns too. The counter hits 0, so main wakes up.', gs: { g3: 'done', g1: 'runnable' }, lines: { g3: 1 }, counters: wg(0, 'nobody waiting') },
    { msg: 'main prints and returns. The order of the two worker lines can differ between runs; "all done" is always last.', gs: { g1: 'done' }, lines: { g1: 12 }, out: ['worker 1 done', 'worker 2 done', 'all done'], status: 'done' },
  ]),
}

export const PRESETS: Preset[] = [handoff, forgotClose, waitGroup]
