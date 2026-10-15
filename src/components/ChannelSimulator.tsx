import { C, LANE_LEGEND, tone } from '../lib/colors'
import type { Player } from '../lib/usePlayer'
import { simCode, type ReceiverState, type SenderState, type SimFrame } from '../sims/channelSim'
import { CodeLines, Lanes, Pill, PlayerBar, Segmented, type LineTag } from './ui'

type AnyState = SenderState | ReceiverState

function look(state: AnyState, who: 'sender' | 'main') {
  switch (state) {
    case 'idle': return { color: C.idle, label: 'Not started' }
    case 'running': return { color: C.running, label: 'Sending' }
    case 'ready': return { color: C.running, label: 'Ready to receive' }
    case 'working': return { color: C.running, label: 'Working' }
    case 'blocked': return { color: C.wait, label: who === 'sender' ? 'Blocked on send' : 'Waiting to receive' }
    case 'done': return { color: C.done, label: who === 'sender' ? 'Returned' : 'Done' }
    case 'error': return { color: C.errText, label: 'Asleep forever' }
  }
}

function laneColor(state: AnyState) {
  if (state === 'blocked') return C.wait
  if (state === 'done') return C.done
  if (state === 'error') return C.err
  if (state === 'idle') return '#2B303A'
  return C.runningFill
}

export interface SimProps {
  frames: SimFrame[]
  player: Player
  cap: number
  close: boolean
  onCap: (n: number) => void
  onClose: (keep: boolean) => void
}

function statusPill(F: SimFrame, player: Player) {
  if (F.status === 'error') return <Pill color={C.errText}>Deadlock</Pill>
  if (F.status === 'done') return <Pill color={C.done}>Complete</Pill>
  if (player.f === 0 && !player.playing) return <Pill color={C.idle}>Idle</Pill>
  if (player.playing) return <Pill color={C.running}>Running</Pill>
  return <Pill color={C.paused}>Paused</Pill>
}

function Goroutine({ label, name, state, who, holding, ring }: {
  label: string; name: string; state: AnyState; who: 'sender' | 'main'; holding: number | null; ring: string
}) {
  const l = look(state, who)
  return (
    <div className="gcard" style={tone(l.color)} data-idle={state === 'idle'}>
      <span className="gcard-id">{label}</span>
      <span className="gcard-name">{name}</span>
      <span className="gcard-state">{l.label}</span>
      <div className="gcard-hold">
        {holding != null && <span className="ball ring" style={{ borderColor: ring }}>{holding}</span>}
      </div>
    </div>
  )
}

export function ChannelSimulator({ frames, player, cap, close, onCap, onClose }: SimProps) {
  const F = frames[player.f]
  const blocked = F.s === 'blocked' || F.r === 'blocked'

  return (
    <div className="sim">
      <div className="sim-head">
        <span className="sim-title">Channel simulator</span>
        {statusPill(F, player)}
        {blocked && <Pill color={C.wait}>A goroutine is blocked</Pill>}
        <a href="#/playground" className="sim-link">Open in Playground</a>
      </div>

      <div className="sim-controls">
        <div className="ctl">
          <span>Buffer size</span>
          <Segmented label="Buffer size" mono options={[0, 1, 2, 3] as const} value={cap} onChange={onCap} />
        </div>
        <div className="ctl">
          <code>close(ch)</code>
          <Segmented label="close(ch)" options={['Keep', 'Forget'] as const} value={close ? 'Keep' : 'Forget'} onChange={v => onClose(v === 'Keep')} />
        </div>
        <span className="sim-steps">{frames.length - 1} recorded steps</span>
      </div>

      <div className="sim-stage">
        <Goroutine label="goroutine 2" name="sender" state={F.s} who="sender" holding={F.sv} ring={C.wait} />
        <div className="pipe-wrap">
          <div className="pipe-meta"><span>ch</span><span>cap {cap}</span></div>
          <div className="pipe">
            <div className="pipe-line" />
            {cap === 0 && <span className="pipe-note">no buffer: values pass hand to hand</span>}
            {Array.from({ length: cap }, (_, k) => F.buf[k] != null
              ? <span key={k} className="ball filled">{F.buf[k]}</span>
              : <span key={k} className="ball slot" />)}
          </div>
          <div className="pipe-foot">{cap ? `${F.buf.length} of ${cap} slots used` : 'sender and receiver must meet'}</div>
        </div>
        <Goroutine label="goroutine 1" name="main" state={F.r} who="main" holding={F.rv} ring={C.running} />
      </div>

      <div className="sim-lanes">
        <Lanes
          current={player.f}
          legend={LANE_LEGEND}
          rows={[
            { name: 'sender', cells: frames.slice(1).map((x, k) => (k + 1 <= player.f ? laneColor(x.s) : C.empty)) },
            { name: 'main', cells: frames.slice(1).map((x, k) => (k + 1 <= player.f ? laneColor(x.r) : C.empty)) },
          ]}
        />
      </div>

      <div className="sim-foot">
        <div className="sim-caption" aria-live="polite">
          <span className="step-chip">Step {player.f} / {frames.length - 1}</span>
          <p>{F.msg}</p>
        </div>
        <div className="sim-out">
          <div className="sim-out-head">Output</div>
          {F.out.length
            ? F.out.map((o, k) => <div key={k} className={o.startsWith('fatal') ? 'out-err' : undefined}>{o}</div>)
            : <div className="out-empty">(nothing yet)</div>}
        </div>
      </div>

      <PlayerBar player={player} />
    </div>
  )
}

const NOTES: Record<number, number> = { 0: 1, 4: 2, 6: 3, 9: 4 }

/** The simulator's program, with each goroutine's current line marked. */
export function SyncedCode({ frames, player, cap, close }: Omit<SimProps, 'onCap' | 'onClose'>) {
  const F = frames[player.f]
  const decor = (i: number) => {
    const tags: LineTag[] = []
    if (i === F.sl && F.s !== 'idle') tags.push({ label: 'sender', color: look(F.s, 'sender').color })
    if (i === F.rl && F.r !== 'idle') tags.push({ label: 'main', color: look(F.r, 'main').color })
    return { tags, note: NOTES[i] }
  }
  return (
    <div className="code">
      <div className="code-head">
        <span className="file" style={{ marginLeft: 0 }}>main.go</span>
        <span className="grow" />
        <span className="num" style={{ fontFamily: 'var(--sans)' }}>Step {player.f} / {frames.length - 1}</span>
        <button type="button" className="btn btn-secondary btn-icon sm" onClick={player.back} aria-label="Step back">‹</button>
        <button type="button" className="btn btn-secondary btn-icon sm" onClick={player.fwd} aria-label="Step forward">›</button>
      </div>
      <CodeLines code={simCode(cap, close)} decor={decor} notes />
      <ol className="code-notes">
        <li><span className="code-note">1</span><span>The second argument to <code className="ic-bare">make</code> is the buffer size. Leave it out and you get 0, an unbuffered channel.</span></li>
        <li><span className="code-note">2</span><span>The send. It blocks while the buffer is full, or until a receiver shows up when there's no buffer.</span></li>
        <li><span className="code-note">3</span><span>Only the sender closes. It tells every receiver that nothing else is coming.</span></li>
        <li><span className="code-note">4</span><span><code className="ic-bare">range ch</code> keeps receiving until the channel is closed and drained.</span></li>
      </ol>
    </div>
  )
}
