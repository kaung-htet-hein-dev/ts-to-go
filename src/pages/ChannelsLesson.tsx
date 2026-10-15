import { useState } from 'react'
import { ChannelSimulator, SyncedCode } from '../components/ChannelSimulator'
import { LessonShell, Section } from '../components/LessonShell'
import { Callout, CodeBlock, CodeLines, DeepDive, Options, type OptionState } from '../components/ui'
import { PlayIcon } from '../components/icons'
import { C } from '../lib/colors'
import { usePlayer } from '../lib/usePlayer'
import { simulate } from '../sims/channelSim'

const SECTIONS = [
  { id: 's-ts', title: 'Coming from JS and TS' },
  { id: 's-concept', title: 'A pipe with a size' },
  { id: 's-code', title: 'Read the code' },
  { id: 's-pitfalls', title: 'Pitfalls' },
  { id: 's-predict', title: 'Predict the output' },
  { id: 's-challenge', title: 'Challenge' },
]

const TS = `const queue = new AsyncQueue<number>();

async function producer() {
  for (let i = 1; i <= 4; i++) {
    await queue.push(i);
  }
  queue.close();
}
producer();

for await (const v of queue) {
  console.log(v);
}`

const GO = `ch := make(chan int)

go func() {
    for i := 1; i <= 4; i++ {
        ch <- i
    }
    close(ch)
}()


for v := range ch {
    fmt.Println(v)
}`

const PRED = `ch := make(chan int, 2)
ch <- 1
ch <- 2
ch <- 3
fmt.Println(<-ch)`
const PRED_OPTS = ['1', '1 2 3', 'fatal error: all goroutines are asleep - deadlock!', 'It does not compile']
const PRED_ANSWER = 2
const TRACE: [string, string, string][] = [
  ['line 1', 'ch created with room for 2 values', C.idle],
  ['line 2', 'ch <- 1   buffer 1/2', C.running],
  ['line 3', 'ch <- 2   buffer 2/2, full', C.running],
  ['line 4', 'ch <- 3   main blocks: no room, no receiver', C.wait],
  ['runtime', 'no goroutine can run', C.runtime],
  ['exit 2', 'fatal error: all goroutines are asleep - deadlock!', C.errText],
]

export function ChannelsLesson() {
  // Simulator state is shared by sections 2 and 3 so the code view follows the diagram.
  const [cap, setCap] = useState(2)
  const [keepClose, setKeepClose] = useState(true)
  const frames = simulate(cap, keepClose)
  const player = usePlayer(frames.length, 1200)

  const sim = { frames, player, cap, close: keepClose }

  return (
    <LessonShell
      id="channels"
      minutes={15}
      sections={SECTIONS}
      lead="In JavaScript, two pieces of async code hand data to each other through a promise or a shared queue. In Go, goroutines (Go's lightweight threads) pass values through a channel. A channel is a pipe that carries one type of value. This lesson is mostly about what happens when one side of the pipe isn't ready yet."
    >
      <Section id="s-ts" n={1} eyebrow="Coming from JS and TS" title="You've built this queue before">
        <p className="lp">You may have written a small async queue: one function pushes values, another reads them in a <code className="ic">for await</code> loop. Go has that queue built into the language. Here is the same program in both.</p>
        <div className="compare">
          <CodeBlock code={TS} lang="ts" title="TypeScript" file="queue.ts" swatch={C.runningFill} />
          <CodeBlock code={GO} title="Go" file="main.go" swatch={C.running} />
        </div>
        <div className="facts">
          <div><strong>Built into the language</strong><span>No queue class to write. <code className="ic-bare">chan int</code> is a type like any other.</span></div>
          <div><strong>Blocking is the default</strong><span>A send waits until there's room. You don't await anything. The goroutine pauses on that line, and other goroutines keep running.</span></div>
          <div><strong>Closing ends the loop</strong><span><code className="ic-bare">close(ch)</code> is how the sender says "that's all". <code className="ic-bare">range</code> stops after it.</span></div>
        </div>
      </Section>

      <Section id="s-concept" n={2} eyebrow="The concept" title="A channel is a pipe with a size">
        <p className="lp tight">The size of the pipe decides who waits for whom. With no buffer, a send and a receive have to meet: the sender holds the value until a receiver takes it. With a buffer (a few slots of storage inside the channel), the sender can drop values in and keep going until every slot is full.</p>
        <p className="lp">Below, a fast sender pushes four numbers to a slow receiver. Change the buffer size and press play. Watch for the moment the sender turns yellow.</p>
        <ChannelSimulator
          {...sim}
          onCap={n => { setCap(n); player.reset() }}
          onClose={k => { setKeepClose(k); player.reset() }}
        />
      </Section>

      <Section id="s-code" n={3} eyebrow="Read the code" title="Four lines do all the work">
        <p className="lp">This is the program the simulator runs. The highlighted lines show where each goroutine is right now. Step through and watch the sender's line turn yellow when it blocks on <code className="ic">ch &lt;- i</code>.</p>
        <SyncedCode {...sim} />
      </Section>

      <Section id="s-pitfalls" n={4} eyebrow="Pitfalls" title="Where people get stuck">
        <div className="stack">
          <Callout kind="pitfall" title="Forgetting close(ch) with a range loop">
            <p>A <code className="ic-bare">range</code> over a channel only ends when the channel is closed. If the sender returns without closing it, the receiver waits forever and the runtime reports a deadlock. Set <code className="ic-bare">close(ch)</code> to Forget in the simulator to see it.</p>
          </Callout>
          <Callout kind="pitfall" title="Sending on a closed channel panics">
            <p>Receiving from a closed channel is fine: once its buffer is empty, you get the zero value and <code className="ic-bare">ok == false</code>. Sending to one crashes the program. So the rule is that only the sending side closes a channel, because only it knows when it is done sending.</p>
          </Callout>
          <Callout kind="note">
            <p>Don't pick a buffer size to be "big enough" the way you might size an array. Use a buffer to absorb bursts when a fast producer feeds a slow consumer. If adding a buffer is what stops a deadlock, the design usually has a bug that the buffer is hiding.</p>
          </Callout>
          <DeepDive question="What is a channel, inside the runtime?">
            <p>A channel value is a pointer (a reference, like a JS object variable) to a runtime struct called <code className="ic-bare">hchan</code>. It holds a ring buffer, its length and capacity, a lock, and two queues of paused goroutines: <code className="ic-bare">sendq</code> and <code className="ic-bare">recvq</code>.</p>
            <p>When a send can't proceed, the runtime puts the goroutine on <code className="ic-bare">sendq</code> and the scheduler runs something else on that thread. A blocked goroutine costs a few kilobytes of memory and no CPU. That's why Go code is happy to wait on a line where JavaScript would use a callback or <code className="ic-bare">await</code>. We open <code className="ic-bare">hchan</code> up properly in <a href="#/lesson/internals" style={{ color: C.runtime }}>Inside a slice, a map, a channel</a>.</p>
          </DeepDive>
        </div>
      </Section>

      <Section id="s-predict" n={5} eyebrow="Predict the output" title="What does this program print?">
        <p className="lp">Pick an answer, then run the trace to check it.</p>
        <Predict />
      </Section>

      <Section id="s-challenge" n={6} eyebrow="Challenge" title="Fill the blank so it prints true">
        <p className="lp">Right now this deadlocks (every goroutine is stuck waiting, so the runtime stops the program). There's one goroutine, and it sends before it receives. Change one number.</p>
        <Challenge />
      </Section>
    </LessonShell>
  )
}

function Predict() {
  const [pick, setPick] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const right = revealed && pick === PRED_ANSWER

  const stateOf = (k: number): OptionState => {
    if (!revealed) return pick === k ? 'picked' : 'idle'
    if (k === PRED_ANSWER) return 'right'
    if (k === pick) return 'wrong'
    return 'faded'
  }

  const run = () => {
    if (pick == null) return
    setRevealed(true)
  }

  return (
    <>
      <div className="code">
        <CodeLines code={PRED} />
        <div className="code-section"><Options options={PRED_OPTS} stateOf={stateOf} onPick={setPick} locked={revealed} /></div>
        <div className="player">
          {!revealed && (
            <button type="button" className="btn btn-primary" disabled={pick == null} onClick={run}>
              <PlayIcon />{pick == null ? 'Pick an answer first' : 'Run the trace'}
            </button>
          )}
          {revealed && <button type="button" className="btn btn-secondary" onClick={() => { setPick(null); setRevealed(false) }}>Try again</button>}
        </div>
        {revealed && (
          <div className="trace">
            {TRACE.map(([at, t, c], k) => (
              <div key={k} style={{ animationDelay: `${k * 0.35}s` }}>
                <span className="trace-at">{at}</span><span style={{ color: c }}>{t}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {revealed && (
        <div className={right ? 'callout callout-ok callout-sm result' : 'callout callout-err callout-sm result'} role="status">
          <div className="callout-head">{right ? 'Correct' : 'Not quite'}</div>
          <p>{right
            ? 'The buffer holds two values. The third send has no room and no receiver, and main is the only goroutine, so nothing can ever make room. The runtime notices that every goroutine is blocked and stops the program.'
            : 'Line 4 never finishes. The buffer is full after two sends, and the only goroutine that could receive is main itself, which is stuck on the send. The Println on line 5 never runs. The runtime reports a deadlock instead.'}</p>
        </div>
      )}
    </>
  )
}

type Check = null | 'right' | 'zero' | 'bad'
const WHY: Record<'zero' | 'bad', [string, string]> = {
  zero: ['Still deadlocks', 'With a size of 0 the channel has no buffer. The send on line 3 waits for a receiver, but the only receiver is line 4 of the same goroutine, which never gets to run.'],
  bad: ['That isn’t a valid size', 'The buffer size has to be a whole number of 0 or more.'],
}

function Challenge() {
  const [blank, setBlank] = useState('')
  const [chk, setChk] = useState<Check>(null)

  const check = () => {
    const v = blank.trim()
    const r: Check = /^\d+$/.test(v) && +v >= 1 ? 'right' : v === '0' || v === '' ? 'zero' : 'bad'
    setChk(r)
  }

  const bd = chk === 'right' ? C.done : chk ? C.err : C.running

  return (
    <>
      <div className="code">
        <div className="code-body challenge">
          <div className="code-line"><span className="ln">1</span><span className="src"><span className="tk-kw">func</span> <span className="tk-fn">main</span>() {'{'}</span></div>
          <div className="code-line">
            <span className="ln">2</span>
            <span className="src">    done := <span className="tk-fn">make</span>(<span className="tk-kw">chan</span> <span className="tk-type">bool</span>, </span>
            <input
              className="blank" value={blank} placeholder="?" aria-label="Buffer size" inputMode="numeric"
              style={{ borderColor: bd }}
              onChange={e => { setBlank(e.target.value); setChk(null) }}
              onKeyDown={e => { if (e.key === 'Enter') check() }}
            />
            <span className="src">)</span>
          </div>
          <div className="code-line"><span className="ln">3</span><span className="src">    done &lt;- <span className="tk-kw">true</span></span></div>
          <div className="code-line"><span className="ln">4</span><span className="src">    fmt.<span className="tk-fn">Println</span>(&lt;-done)</span></div>
          <div className="code-line"><span className="ln">5</span><span className="src">{'}'}</span></div>
        </div>
        <div className="player">
          <button type="button" className="btn btn-primary" onClick={check}>Check answer</button>
          <span className="hint">Checked against fixed answers. Nothing runs.</span>
        </div>
      </div>
      {chk === 'right' && (
        <div className="callout callout-ok callout-sm result" role="status">
          <div className="callout-head">That works.</div>
          <p>With room for one value, the send on line 3 drops <code className="ic-bare">true</code> into the buffer and returns right away. Line 4 takes it back out. Any size of 1 or more works. Use 1, since that is how many values you send.</p>
        </div>
      )}
      {chk && chk !== 'right' && (
        <div className="callout callout-err callout-sm result" role="status">
          <div className="callout-head">{WHY[chk][0]}</div>
          <p>{WHY[chk][1]}</p>
        </div>
      )}
    </>
  )
}
