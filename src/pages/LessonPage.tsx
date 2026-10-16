import { useState } from 'react'
import { LessonShell, Section } from '../components/LessonShell'
import { Rich } from '../components/Rich'
import { Callout, CodeBlock, CodeLines, DeepDive, Options, type OptionState } from '../components/ui'
import { PlayIcon } from '../components/icons'
import type { Block, Challenge as ChallengeDef, LessonContent, Predict as PredictDef, TraceKind } from '../data/lessons/types'
import { C } from '../lib/colors'
import { highlightLine } from '../lib/highlight'

const TRACE_COLOR: Record<TraceKind, string> = {
  idle: C.idle, run: C.running, wait: C.wait, runtime: C.runtime, out: C.doneText, err: C.errText,
}

/** Renders any lesson written as LessonContent data. */
export function LessonPage({ lesson: L }: { lesson: LessonContent }) {
  const sections = [
    { id: 's-ts', title: 'Coming from JS and TS' },
    ...L.sections.map((s, k) => ({ id: `s-${k}`, title: s.eyebrow })),
    { id: 's-pitfalls', title: 'Pitfalls' },
    { id: 's-predict', title: 'Predict the output' },
    { id: 's-challenge', title: 'Challenge' },
    { id: 's-recap', title: 'Remember this' },
  ]
  let n = 1

  return (
    <LessonShell id={L.id} minutes={L.minutes} sections={sections} lead={<Rich text={L.lead} />}>
      <Section id="s-ts" n={n++} eyebrow="Coming from JS and TS" title={L.fromTs.title}>
        <p className="lp"><Rich text={L.fromTs.intro} /></p>
        <div className="compare">
          <CodeBlock code={L.fromTs.ts} lang="ts" title="TypeScript" file={L.fromTs.tsFile ?? 'index.ts'} swatch={C.runningFill} />
          <CodeBlock code={L.fromTs.go} title="Go" file={L.fromTs.goFile ?? 'main.go'} swatch={C.running} />
        </div>
        <div className="facts">
          {L.fromTs.facts.map(([t, b], k) => (
            <div key={k}><strong><Rich text={t} /></strong><span><Rich text={b} /></span></div>
          ))}
        </div>
      </Section>

      {L.sections.map((s, k) => (
        <Section key={k} id={`s-${k}`} n={n++} eyebrow={s.eyebrow} title={s.title}>
          <div className="blocks">{s.blocks.map((b, i) => <BlockView key={i} b={b} />)}</div>
        </Section>
      ))}

      <Section id="s-pitfalls" n={n++} eyebrow="Pitfalls" title="Where people get stuck">
        <div className="stack">
          {L.pitfalls.map((p, k) => (
            <Callout key={k} kind="pitfall" title={p.title}><p><Rich text={p.body} /></p></Callout>
          ))}
          {L.note && <Callout kind="note"><p><Rich text={L.note} /></p></Callout>}
          {L.deepDive && (
            <DeepDive question={L.deepDive.q}>
              {L.deepDive.body.map((t, k) => <p key={k}><Rich text={t} /></p>)}
            </DeepDive>
          )}
        </div>
      </Section>

      <Section id="s-predict" n={n++} eyebrow="Predict the output" title={L.predict.q ?? 'What does this program print?'}>
        <p className="lp">Pick an answer, then run the trace to check it.</p>
        <Predict p={L.predict} />
      </Section>

      <Section id="s-challenge" n={n++} eyebrow="Challenge" title={L.challenge.title}>
        <p className="lp"><Rich text={L.challenge.prompt} /></p>
        <Challenge c={L.challenge} />
      </Section>

      <Section id="s-recap" n={n++} eyebrow="Remember this" title="Key takeaways">
        <ul className="recap">
          {L.recap.map((r, k) => <li key={k}><Rich text={r} /></li>)}
        </ul>
      </Section>
    </LessonShell>
  )
}

function BlockView({ b }: { b: Block }) {
  if (typeof b === 'string') return <p className="lp"><Rich text={b} /></p>
  if ('code' in b) return <div className="block-code"><CodeBlock code={b.code} lang={b.lang} title={b.title} file={b.file} /></div>
  if ('compare' in b) {
    return (
      <div className="compare block-code">
        <CodeBlock code={b.compare.ts} lang="ts" title="TypeScript" file={b.compare.tsFile ?? 'index.ts'} swatch={C.runningFill} />
        <CodeBlock code={b.compare.go} title="Go" file={b.compare.goFile ?? 'main.go'} swatch={C.running} />
      </div>
    )
  }
  if ('list' in b) {
    const items = b.list.map((t, k) => <li key={k}><Rich text={t} /></li>)
    return b.ordered ? <ol className="bullets">{items}</ol> : <ul className="bullets">{items}</ul>
  }
  if ('note' in b) return <div className="block-callout"><Callout kind="note" title={b.title}><p><Rich text={b.note} /></p></Callout></div>
  if ('pitfall' in b) return <div className="block-callout"><Callout kind="pitfall" title={b.title}><p><Rich text={b.pitfall} /></p></Callout></div>
  return (
    <div className="ltable-wrap">
      <table className="ltable">
        <thead><tr>{b.table.head.map((h, k) => <th key={k}><Rich text={h} /></th>)}</tr></thead>
        <tbody>{b.table.rows.map((r, k) => <tr key={k}>{r.map((c, i) => <td key={i}><Rich text={c} /></td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}

function Predict({ p }: { p: PredictDef }) {
  const [pick, setPick] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const right = revealed && pick === p.answer

  const stateOf = (k: number): OptionState => {
    if (!revealed) return pick === k ? 'picked' : 'idle'
    if (k === p.answer) return 'right'
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
        <CodeLines code={p.code} />
        <div className="code-section"><Options options={p.options} stateOf={stateOf} onPick={setPick} locked={revealed} /></div>
        <div className="player">
          {!revealed && (
            <button type="button" className="btn btn-primary" disabled={pick == null} onClick={run}>
              <PlayIcon />{pick == null ? 'Pick an answer first' : 'Run the trace'}
            </button>
          )}
          {revealed && <button type="button" className="btn btn-secondary" onClick={() => { setPick(null); setRevealed(false) }}>Try again</button>}
        </div>
        {revealed && p.trace && (
          <div className="trace">
            {p.trace.map(([at, t, kind], k) => (
              <div key={k} style={{ animationDelay: `${k * 0.35}s` }}>
                <span className="trace-at">{at}</span><span style={{ color: TRACE_COLOR[kind] }}>{t}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {revealed && (
        <div className={right ? 'callout callout-ok callout-sm result' : 'callout callout-err callout-sm result'} role="status">
          <div className="callout-head">{right ? 'Correct' : 'Not quite'}</div>
          <p><Rich text={p.why} /></p>
        </div>
      )}
    </>
  )
}

const norm = (s: string) => s.replace(/\s+/g, '')

function Challenge({ c }: { c: ChallengeDef }) {
  const [blank, setBlank] = useState('')
  const [chk, setChk] = useState<null | 'right' | number | 'other'>(null)

  const check = () => {
    const v = norm(blank)
    if (c.answers.some(a => norm(a) === v)) {
      setChk('right')
      return
    }
    const k = c.wrong?.findIndex(w => w.answers.some(a => norm(a) === v)) ?? -1
    setChk(k >= 0 ? k : 'other')
  }

  const bd = chk === 'right' ? C.done : chk != null ? C.err : C.running
  const width = Math.max(4, ...c.answers.map(a => a.length)) + 2
  const lines = c.code.split('\n')

  return (
    <>
      <div className="code">
        <div className="code-body challenge">
          {lines.map((line, i) => {
            const at = line.indexOf('___')
            return (
              <div key={i} className="code-line">
                <span className="ln">{i + 1}</span>
                {at < 0 ? <Src text={line} /> : (
                  <>
                    <Src text={line.slice(0, at)} grow={false} />
                    <input
                      className="blank" value={blank} placeholder="?" aria-label="Fill in the blank" spellCheck={false}
                      autoCapitalize="off" autoComplete="off"
                      style={{ borderColor: bd, width: `${width}ch` }}
                      onChange={e => { setBlank(e.target.value); setChk(null) }}
                      onKeyDown={e => { if (e.key === 'Enter') check() }}
                    />
                    <Src text={line.slice(at + 3)} />
                  </>
                )}
              </div>
            )
          })}
        </div>
        <div className="player">
          <button type="button" className="btn btn-primary" onClick={check}>Check answer</button>
          <span className="hint">Checked against fixed answers. Nothing runs.</span>
        </div>
      </div>
      {chk === 'right' && (
        <div className="callout callout-ok callout-sm result" role="status">
          <div className="callout-head">That works.</div>
          <p><Rich text={c.success} /></p>
        </div>
      )}
      {chk != null && chk !== 'right' && (
        <div className="callout callout-err callout-sm result" role="status">
          <div className="callout-head">{chk === 'other' ? 'Not quite' : c.wrong![chk].title}</div>
          <p><Rich text={chk === 'other' ? c.hint : c.wrong![chk].body} /></p>
        </div>
      )}
    </>
  )
}

function Src({ text, grow = true }: { text: string; grow?: boolean }) {
  return (
    <span className="src" style={grow ? undefined : { flex: 'none' }}>
      {text ? highlightLine(text).map((tk, k) => <span key={k} className={`tk-${tk.k}`}>{tk.t}</span>) : ''}
    </span>
  )
}
