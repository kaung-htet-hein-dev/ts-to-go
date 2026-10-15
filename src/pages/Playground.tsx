import { useState } from 'react'
import { CloseIcon, PlayIcon } from '../components/icons'
import { CodeLines, PlayerBar, type LineTag } from '../components/ui'
import { C, tone } from '../lib/colors'
import { usePlayer } from '../lib/usePlayer'
import { PRESETS, type ChanState, type GState, type Preset } from '../sims/playgroundTraces'

const FILL: Record<GState, string> = {
  none: 'transparent', runnable: C.runnable, running: C.runningFill, blocked: C.wait, done: C.done, deadlock: C.err,
}
const TEXT: Record<GState, string> = {
  none: C.dim, runnable: '#7FB6CC', running: C.running, blocked: C.wait, done: C.doneText, deadlock: C.errText,
}
const LABEL: Record<GState, string> = {
  none: 'not created', runnable: 'runnable', running: 'running', blocked: 'blocked', done: 'done', deadlock: 'deadlocked',
}
const LEGEND: [string, string][] = [['running', C.runningFill], ['runnable', C.runnable], ['blocked', C.wait], ['done', C.done], ['deadlocked', C.err]]

export function Playground() {
  const [presetId, setPresetId] = useState(PRESETS[0].id)
  const preset = PRESETS.find(p => p.id === presetId) ?? PRESETS[0]
  return <PlaygroundView key={preset.id} preset={preset} onPreset={setPresetId} />
}

function PlaygroundView({ preset, onPreset }: { preset: Preset; onPreset: (id: string) => void }) {
  const player = usePlayer(preset.steps.length, 1000)
  const [hideDeadlock, setHideDeadlock] = useState(false)
  const S = preset.steps[player.f]

  const decor = (i: number) => {
    const tags: LineTag[] = preset.goroutines
      .filter(g => S.lines[g.id] === i && S.gs[g.id] !== 'none' && !(S.gs[g.id] === 'done' && S.status !== 'done'))
      .map(g => ({ label: g.id, color: TEXT[S.gs[g.id]] }))
    tags.sort((a, b) => (a.color === C.running ? -1 : b.color === C.running ? 1 : 0))
    return { tags }
  }

  const showDeadlock = S.status === 'deadlock' && !hideDeadlock
  const capTone = S.status === 'deadlock' ? C.err : S.status === 'done' ? C.done : S.status === 'idle' ? 'transparent' : C.running

  return (
    <div className="pg">
      <section className="pg-code" aria-label="Program">
        <div className="pg-bar">
          <label className="pg-preset">
            <span>Preset</span>
            <select value={preset.id} onChange={e => onPreset(e.target.value)}>
              {PRESETS.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
          <a href="/" className="pg-back" onClick={e => { if (window.history.length > 1) { e.preventDefault(); window.history.back() } }}>‹ Back</a>
        </div>
        <div className="pg-code-body"><CodeLines code={preset.code} decor={decor} /></div>
        <div className="pg-out">
          <div className="pg-out-head">Program output<span>{S.out.length ? `${S.out.length} lines` : ''}</span></div>
          <div className="pg-out-body">
            {S.out.length
              ? S.out.map((o, k) => <div key={k} className={o.startsWith('fatal') ? 'out-err' : o.startsWith('goroutine') || o.startsWith('  ') ? 'out-dim' : undefined}>{o || ' '}</div>)
              : <div className="out-empty">{player.f ? '(nothing printed yet)' : '$ go run main.go'}</div>}
          </div>
        </div>
      </section>

      <section className="pg-stage" aria-label="Runtime">
        <div className="pg-caption" style={tone(capTone)} aria-live="polite">
          <span className="step-chip">{player.f === 0 ? 'Idle' : S.status === 'deadlock' ? 'Deadlock' : S.status === 'done' ? 'Done' : `Step ${player.f}`}</span>
          <p>{S.msg}</p>
        </div>

        <div className="pg-panels">
          <div>
            <div className="pg-label">
              <span>Goroutines</span>
              <span className="legend">{LEGEND.map(([l, c]) => <span key={l}><i style={tone(c)} />{l}</span>)}</span>
            </div>
            <div className="pg-lanes">
              {preset.goroutines.map(g => (
                <div key={g.id} className="pg-lane">
                  <div className="pg-lane-name">
                    <span><b>{g.id}</b> {g.name}</span>
                    <span style={{ color: TEXT[S.gs[g.id]] }}>{LABEL[S.gs[g.id]]}</span>
                  </div>
                  <div className="pg-cells" aria-hidden="true">
                    {preset.steps.slice(1).map((x, k) => (
                      <span key={k} className={k + 1 === player.f ? 'now' : undefined}
                        style={{ background: k + 1 <= player.f ? FILL[x.gs[g.id]] : C.empty }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {S.chans.length > 0 && (
            <div>
              <div className="pg-label"><span>Channels</span></div>
              <div className="pg-chans">{S.chans.map(c => <Chan key={c.name} c={c} />)}</div>
            </div>
          )}

          {S.counters.length > 0 && (
            <div>
              <div className="pg-label"><span>Sync</span></div>
              <div className="pg-counters">
                {S.counters.map(c => (
                  <div key={c.name} className="pg-counter">
                    <span className="num">{c.name}  WaitGroup</span>
                    <strong>{c.value}</strong>
                    <span style={{ color: c.note.startsWith('main') ? C.wait : C.idle }}>{c.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {player.f === 0 && !player.playing && (
          <div className="pg-overlay">
            <div className="pg-ready">
              <h2>Ready when you are</h2>
              <p>{preset.intro}</p>
              <button type="button" className="btn btn-primary btn-md" onClick={player.play}><PlayIcon />Run</button>
            </div>
          </div>
        )}

        {showDeadlock && (
          <div className="pg-overlay">
            <div className="pg-deadlock" role="alert">
              <div className="pg-deadlock-head">
                <span className="x"><CloseIcon /></span>
                <h2>Deadlock</h2>
                <span className="num" style={{ color: C.errText, marginLeft: 'auto' }}>exit status 2</span>
              </div>
              <div className="pg-fatal">fatal error: all goroutines are asleep - deadlock!</div>
              <p>Every goroutine is waiting on something only another waiting goroutine could provide. {preset.deadlock?.why}</p>
              {preset.deadlock && (
                <div className="pg-stuck">
                  <span>Where each goroutine is stuck</span>
                  {preset.deadlock.stuck.map(s => (
                    <div key={s.id}><b>{s.id}</b><em>[{s.why}]</em><span>{s.where}</span></div>
                  ))}
                </div>
              )}
              <div className="row">
                <button type="button" className="btn btn-secondary" onClick={() => { setHideDeadlock(true); player.back() }}>Step back to inspect</button>
                <button type="button" className="btn btn-secondary" onClick={() => { setHideDeadlock(true) }}>Dismiss</button>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="pg-player">
        <PlayerBar player={{ ...player, play: () => { setHideDeadlock(false); player.play() }, reset: () => { setHideDeadlock(false); player.reset() }, playLabel: player.f === 0 ? 'Run' : player.playLabel }} showCount />
      </div>
    </div>
  )
}

function Chan({ c }: { c: ChanState }) {
  const waiting = c.sendq.length > 0 || c.recvq.length > 0
  const bd = c.closed ? C.done : waiting ? C.wait : C.dim
  return (
    <div className="pg-chan">
      <div className="pg-q">
        <span>blocked senders</span>
        <div>{c.sendq.map(g => <span key={g} className="qchip">{g}</span>)}</div>
      </div>
      <div className="pg-chan-mid">
        <div className="pg-chan-meta"><span>{c.name}</span><span>cap {c.cap} · len {c.buf.length}{c.closed ? ' · closed' : ''}</span></div>
        <div className="pg-pipe" style={{ borderColor: bd }}>
          {c.cap === 0 && <span className="pipe-note">unbuffered: hand to hand</span>}
          {Array.from({ length: c.cap }, (_, k) => c.buf[k] != null
            ? <span key={k} className="ball filled sm">{c.buf[k]}</span>
            : <span key={k} className="ball slot sm" />)}
        </div>
      </div>
      <div className="pg-q right">
        <span>blocked receivers</span>
        <div>{c.recvq.map(g => <span key={g} className="qchip">{g}</span>)}</div>
      </div>
    </div>
  )
}
