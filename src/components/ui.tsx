import { useState, type ReactNode } from 'react'
import { tone } from '../lib/colors'
import { highlightLine, type Lang } from '../lib/highlight'
import type { Player } from '../lib/usePlayer'
import { CubeIcon, InfoIcon, PauseIcon, PlayIcon, WarnIcon } from './icons'

export interface LineTag { label: string; color: string }
export interface LineDecor { tags?: LineTag[]; note?: number }

export function CodeLines({ code, lang = 'go', decor, notes }: {
  code: string
  lang?: Lang
  decor?: (i: number) => LineDecor | undefined
  /** Reserve a gutter for numbered notes. */
  notes?: boolean
}) {
  return (
    <div className="code-body">
      {code.split('\n').map((line, i) => {
        const d = decor?.(i)
        const lead = d?.tags?.[0]
        return (
          <div key={i} className={lead ? 'code-line hl' : 'code-line'} style={lead ? tone(lead.color) : undefined}>
            <span className="ln">{i + 1}</span>
            {notes && (d?.note != null ? <span className="code-note">{d.note}</span> : <span className="code-note-gap" />)}
            <span className="src">
              {line ? highlightLine(line, lang).map((tk, k) => <span key={k} className={`tk-${tk.k}`}>{tk.t}</span>) : ' '}
            </span>
            {d?.tags?.map(tg => <span key={tg.label} className="tag" style={tone(tg.color)}>{tg.label}</span>)}
          </div>
        )
      })}
    </div>
  )
}

export function CodeBlock({ code, lang = 'go', title, file, swatch }: {
  code: string; lang?: Lang; title?: string; file?: string; swatch?: string
}) {
  return (
    <div className="code">
      {(title || file) && (
        <div className="code-head">
          {swatch && <span className="swatch" style={tone(swatch)} />}
          {title}
          {file && <span className="file">{file}</span>}
        </div>
      )}
      <CodeLines code={code} lang={lang} />
    </div>
  )
}

export function Segmented<T extends string | number>({ options, value, onChange, label, mono, neutral, format }: {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  label: string
  mono?: boolean
  neutral?: boolean
  format?: (v: T) => string
}) {
  return (
    <div className={`seg${mono ? ' mono' : ''}${neutral ? ' neutral' : ''}`} role="group" aria-label={label}>
      {options.map(o => (
        <button key={String(o)} type="button" aria-pressed={o === value} onClick={() => onChange(o)}>
          {format ? format(o) : String(o)}
        </button>
      ))}
    </div>
  )
}

export function Pill({ color, children, dot = true }: { color: string; children: ReactNode; dot?: boolean }) {
  return <span className={dot ? 'pill' : 'pill no-dot'} style={tone(color)}>{children}</span>
}

export function Callout({ kind, title, children }: {
  kind: 'pitfall' | 'note'
  title?: string
  children: ReactNode
}) {
  return (
    <div className={`callout callout-${kind}`}>
      <div className="callout-head">{kind === 'pitfall' ? <WarnIcon /> : <InfoIcon />}{kind === 'pitfall' ? 'Pitfall' : 'Note'}</div>
      {title && <div className="callout-title">{title}</div>}
      {children}
    </div>
  )
}

export function DeepDive({ question, children }: { question: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="callout callout-deep deep">
      <button type="button" className="deep-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="callout-head"><CubeIcon />Deep dive</span>
        <span className="deep-q">{question}</span>
        <span className="deep-btn">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && <div className="deep-body">{children}</div>}
    </div>
  )
}

export function PlayerBar({ player, children, showCount }: { player: Player; children?: ReactNode; showCount?: boolean }) {
  const { f, last, playing } = player
  return (
    <div className="player">
      <button type="button" className="btn btn-secondary" onClick={player.reset}>↺ Reset</button>
      <button type="button" className="btn btn-secondary btn-icon" onClick={player.back} disabled={f === 0} aria-label="Step back">‹</button>
      {playing
        ? <button type="button" className="btn btn-primary" onClick={player.pause}><PauseIcon />Pause</button>
        : <button type="button" className="btn btn-primary" onClick={player.play}><PlayIcon />{player.playLabel}</button>}
      <button type="button" className="btn btn-secondary btn-icon" onClick={player.fwd} disabled={f === last} aria-label="Step forward">›</button>
      <div className="progress" role="progressbar" aria-label="Trace progress" aria-valuemin={0} aria-valuemax={last} aria-valuenow={f}>
        <div style={{ width: `${last ? (f / last) * 100 : 0}%` }} />
      </div>
      {showCount && <span className="count">{f} / {last}</span>}
      {children}
    </div>
  )
}

export function Lanes({ rows, current, legend }: {
  rows: { name: string; cells: string[] }[]
  /** 1-based index of the current cell, 0 for none. */
  current: number
  legend: { label: string; color: string }[]
}) {
  return (
    <div className="lanes">
      {rows.map(r => (
        <div className="lane" key={r.name}>
          <span className="lane-name">{r.name}</span>
          <div className="lane-cells" aria-hidden="true">
            {r.cells.map((c, k) => <span key={k} className={k + 1 === current ? 'now' : undefined} style={{ background: c }} />)}
          </div>
        </div>
      ))}
      <div className="legend" style={{ paddingLeft: 76, marginTop: 4 }}>
        {legend.map(l => <span key={l.label}><i style={tone(l.color)} />{l.label}</span>)}
      </div>
    </div>
  )
}

export type OptionState = 'idle' | 'picked' | 'right' | 'wrong' | 'faded'

export function Options({ options, stateOf, onPick, locked }: {
  options: string[]
  stateOf: (k: number) => OptionState
  onPick: (k: number) => void
  locked?: boolean
}) {
  return (
    <div className="options">
      {options.map((label, k) => (
        <button key={k} type="button" className="option" data-state={stateOf(k)} disabled={locked} onClick={() => onPick(k)}>
          <span className="key">{'ABCD'[k]}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
