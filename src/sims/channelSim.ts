// Recorded trace for the lesson's channel simulator: a fast sender pushes
// 1..4 into ch, a slow main receives. Each frame is one tick of the model.

export type SenderState = 'idle' | 'running' | 'blocked' | 'done'
export type ReceiverState = 'idle' | 'ready' | 'working' | 'blocked' | 'done' | 'error'
export type SimStatus = 'idle' | 'run' | 'done' | 'error'

export interface SimFrame {
  buf: number[]
  s: SenderState
  r: ReceiverState
  /** Value the sender is holding while blocked. */
  sv: number | null
  /** Value main is working on. */
  rv: number | null
  out: string[]
  msg: string
  /** Line index (0-based) in simCode() for each goroutine; -1 = none. */
  sl: number
  rl: number
  status: SimStatus
}

export const DEADLOCK_MSG = 'fatal error: all goroutines are asleep - deadlock!'

export function simCode(cap: number, doClose: boolean) {
  return [
    cap ? `ch := make(chan int, ${cap})` : 'ch := make(chan int)',
    '',
    'go func() {',
    '    for i := 1; i <= 4; i++ {',
    '        ch <- i',
    '    }',
    doClose ? '    close(ch)' : '    // close(ch)  forgotten',
    '}()',
    '',
    'for v := range ch {',
    '    work(v) // takes a moment',
    '    fmt.Println(v)',
    '}',
  ].join('\n')
}

export function simulate(cap: number, doClose: boolean): SimFrame[] {
  const N = 4
  const WORK = 2
  let i = 1
  let buf: number[] = []
  let s: SenderState = 'running'
  let sv: number | null = null
  let r: ReceiverState = 'ready'
  let rv: number | null = null
  let work = 0
  let closed = false
  const out: string[] = []

  const frames: SimFrame[] = [{
    buf: [], s: 'idle', r: 'idle', sv: null, rv: null, out: [], sl: -1, rl: -1, status: 'idle',
    msg: 'Press play. The sender on the left pushes 1, 2, 3, 4 into ch. main, on the right, receives them but needs a moment for each one.',
  }]
  const recvReady = () => r === 'ready' || r === 'blocked'

  for (let t = 0; t < 60; t++) {
    let msg = ''
    let sl = 4
    let rl = 9
    let end: SimStatus | null = null

    // Sender
    if (s === 'blocked' && sv != null) {
      if (cap > 0 && buf.length < cap) {
        buf = [...buf, sv]
        msg = `A slot opened, so ${sv} goes into the buffer and the sender moves on.`
        sv = null; s = 'running'; i++
      } else if (cap === 0 && recvReady()) {
        rv = sv; sv = null; s = 'running'; i++; r = 'working'; work = WORK
        msg = `main is ready now, so ${rv} passes straight from the sender to main.`
      }
    } else if (s === 'running') {
      if (i > N) {
        if (doClose) { closed = true; msg = 'The sender has sent all four values, so it closes ch and returns.'; sl = 6 }
        else { msg = 'The sender returns without calling close(ch). Nothing tells main to stop waiting.'; sl = 7 }
        s = 'done'
      } else if (cap === 0) {
        if (recvReady()) {
          rv = i; i++; r = 'working'; work = WORK
          msg = `main is already waiting, so ${rv} is handed over directly. No buffer needed.`
        } else {
          sv = i; s = 'blocked'
          msg = `The sender wants to send ${i}, but main is busy. With no buffer, the sender blocks right here.`
        }
      } else if (buf.length < cap) {
        buf = [...buf, i]
        msg = `The sender drops ${i} into the buffer (${buf.length} of ${cap}) and keeps going without waiting.`
        i++
      } else {
        sv = i; s = 'blocked'
        msg = `The buffer is full, so the sender blocks holding ${i} until main takes something out.`
      }
    } else sl = 7

    // Receiver
    if (r === 'working') {
      work--
      if (work === 0) {
        out.push(String(rv))
        if (!msg) msg = `main prints ${rv}.`
        rv = null; r = 'ready'; rl = 11
      } else rl = 10
    } else if (recvReady()) {
      if (buf.length) {
        rv = buf[0]; buf = buf.slice(1); r = 'working'; work = WORK
        let x = `main takes ${rv} out of the buffer.`
        if (s === 'blocked' && sv != null) {
          buf = [...buf, sv]
          x = `main takes ${rv} out, which frees a slot, so the waiting ${sv} goes in and the sender unblocks.`
          sv = null; s = 'running'; i++
        }
        if (!msg || s === 'running') msg = x
      } else if (s === 'blocked' && cap === 0 && sv != null) {
        rv = sv; sv = null; s = 'running'; i++; r = 'working'; work = WORK
        msg = `main arrives and takes ${rv} straight from the sender's hand. Both continue.`
      } else if (closed) {
        r = 'done'; rl = 12; end = 'done'
        msg = 'ch is closed and empty, so the range loop ends. Every value arrived, in order.'
      } else if (s === 'done') {
        r = 'error'; end = 'error'
        msg = 'main waits for a value that will never come, and no other goroutine is left to send or close. That is a deadlock.'
        out.push(DEADLOCK_MSG)
      } else {
        r = 'blocked'
        if (!msg) msg = 'main is waiting at the top of the range loop for the next value.'
      }
    }
    if (!msg) msg = 'main is still working on its value. The sender stays blocked.'

    frames.push({ buf, s, r, sv, rv, out: out.slice(), msg, sl, rl, status: end ?? 'run' })
    if (end) break
  }
  return frames
}
