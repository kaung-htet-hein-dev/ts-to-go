import { useEffect, useState, useSyncExternalStore } from 'react'
import { PauseIcon, PlayIcon } from '../components/icons'
import { TRACKS, lessonHref } from '../data/course'
import { C, tone } from '../lib/colors'

// Race between Node and Go: three fetches, then CPU-bound parsing.
// Segments are [start, end, kind, label] in timeline units (1 unit = 5 ms).
type Kind = 'r' | 'w' | 'q' | 'd'
type Seg = [number, number, Kind, string]
interface LaneDef { name: string; where: string; segs: Seg[] }

const END = 84
const SEG_COLOR: Record<Kind, [string, string]> = {
  r: [C.runningFill, '#F6F7F9'], w: ['rgba(250,189,98,0.85)', '#16181D'], q: [C.queued, '#16181D'], d: [C.done, '#16181D'],
}
const NODE: LaneDef[] = [
  { name: 'JS thread', where: '', segs: [[0, 4, 'r', 'fetch a'], [4, 8, 'r', 'b'], [8, 12, 'r', 'c'], [38, 50, 'r', 'parse a'], [50, 62, 'r', 'parse b'], [62, 74, 'r', 'parse c'], [74, 78, 'd', '✓']] },
  { name: 'req a', where: ' I/O', segs: [[4, 38, 'w', 'waiting on network']] },
  { name: 'req b', where: ' I/O', segs: [[8, 40, 'w', 'waiting on network'], [40, 50, 'q', 'callback queued']] },
  { name: 'req c', where: ' I/O', segs: [[12, 42, 'w', 'waiting on network'], [42, 62, 'q', 'callback queued']] },
]
const GO: LaneDef[] = [
  { name: 'main', where: ' P0', segs: [[0, 6, 'r', 'go ×3'], [6, 54, 'w', 'wg.Wait()'], [54, 58, 'd', '✓']] },
  { name: 'g1', where: ' P1', segs: [[1, 4, 'r', ''], [4, 38, 'w', 'parked on netpoller'], [38, 50, 'r', 'parse a'], [50, 52, 'd', '']] },
  { name: 'g2', where: ' P2', segs: [[2, 8, 'r', ''], [8, 40, 'w', 'parked on netpoller'], [40, 52, 'r', 'parse b'], [52, 54, 'd', '']] },
  { name: 'g3', where: ' P3', segs: [[3, 12, 'r', ''], [12, 42, 'w', 'parked on netpoller'], [42, 54, 'r', 'parse c'], [54, 56, 'd', '']] },
]
const CAPTIONS: [number, string][] = [
  [0, 'Both programs start three requests right away. Neither waits for the first response before sending the next.'],
  [14, 'Now everything is waiting on the network. Neither runtime is using the CPU.'],
  [38, 'Responses arrive at about the same moment. Node has one thread, so the callbacks queue up and run one after another.'],
  [41, 'Go wakes each goroutine on whichever processor is free. Three parses run at the same time on three cores.'],
  [55, 'Go is done: every goroutine called wg.Done(), so main’s wg.Wait() returns.'],
  [62, 'Node is still working through the queue. The network wait was the same, but Node had to run the CPU work one callback at a time.'],
  [78, 'Node finishes last. The network was no faster for Go. Go won because the parsing after each response ran on three cores at once.'],
]
const PANELS = [
  { title: 'Node.js', sub: 'one thread, an event loop', lanes: NODE, end: 78, endLabel: '390 ms',
    code: 'await Promise.all(urls.map(async u => {\n  const res = await fetch(u);\n  parse(await res.text());\n}));' },
  { title: 'Go', sub: 'goroutines on four processors', lanes: GO, end: 58, endLabel: '290 ms',
    code: 'for _, u := range urls {\n    wg.Add(1)\n    go func() { defer wg.Done(); parse(get(u)) }()\n}\nwg.Wait()' },
]

const MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const reducedMotion = () => window.matchMedia(MOTION_QUERY).matches
const subscribeMotion = (fn: () => void) => {
  const mq = window.matchMedia(MOTION_QUERY)
  mq.addEventListener('change', fn)
  return () => mq.removeEventListener('change', fn)
}

function RuntimeRace() {
  // Reduced motion starts on the finished frame. Until the user presses Play
  // the timeline is derived from the media query (false while prerendering).
  const reduce = useSyncExternalStore(subscribeMotion, reducedMotion, () => false)
  const [started, setStarted] = useState(false)
  const [time, setT] = useState(0)
  const [play, setPlaying] = useState(true)
  const t = reduce && !started ? END : time
  const playing = reduce && !started ? false : play

  useEffect(() => {
    if (!playing || t >= END) return
    const id = setTimeout(() => {
      const next = Math.min(END, t + 0.5)
      setT(next)
      if (next >= END) setPlaying(false)
    }, 60)
    return () => clearTimeout(id)
  }, [playing, t])

  const caption = CAPTIONS.filter(c => t >= c[0]).pop()![1]

  return (
    <div className="race">
      <div className="race-head">
        <span className="race-title">Same task, two runtimes: fetch three URLs, then parse each response</span>
        <span className="num">t = {Math.round(t * 5)} ms</span>
        {playing
          ? <button type="button" className="btn btn-secondary" onClick={() => setPlaying(false)}><PauseIcon />Pause</button>
          : <button type="button" className="btn btn-primary" onClick={() => { setStarted(true); if (t >= END) setT(0); setPlaying(true) }}><PlayIcon />{t >= END ? 'Replay' : 'Play'}</button>}
      </div>
      <div className="race-panels">
        {PANELS.map(p => (
          <div className="race-panel" key={p.title}>
            <div className="race-panel-head">
              <span className="race-panel-title">{p.title}</span>
              <span className="race-panel-sub">{p.sub}</span>
              {t >= p.end && <span className="pill no-dot" style={tone(C.doneText)}>Done at {p.endLabel}</span>}
            </div>
            <pre className="race-code">{p.code}</pre>
            <div className="race-lanes">
              {p.lanes.map(l => (
                <div className="race-lane" key={l.name}>
                  <span className="race-lane-name">{l.name}<span>{l.where}</span></span>
                  <div className="race-track">
                    {l.segs.filter(s => t > s[0]).map(([a, b, k, label], i) => (
                      <span key={i} className="race-seg" style={{
                        left: `${(a / END) * 100}%`, width: `${((Math.min(t, b) - a) / END) * 100}%`,
                        background: SEG_COLOR[k][0], color: SEG_COLOR[k][1],
                      }}>{label}</span>
                    ))}
                    <span className="race-head-line" style={{ left: `${(t / END) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="race-foot">
        <p aria-live="polite">{caption}</p>
        <div className="legend">
          <span><i style={tone(C.runningFill)} />running</span>
          <span><i style={tone(C.wait)} />waiting</span>
          <span><i style={tone(C.queued)} />queued</span>
          <span><i style={tone(C.done)} />done</span>
        </div>
      </div>
    </div>
  )
}

export function Home() {
  const first = TRACKS[0].lessons[0].id

  return (
    <div className="home">
      <section className="hero">
        <div>
          <div className="hero-kicker">For developers who write JavaScript or TypeScript</div>
          <h1>Learn Go by starting from the code you already know.</h1>
        </div>
        <div>
          <p className="lead">Seven tracks, from <code className="ic-bare">:=</code> to the scheduler. Every lesson opens with the code you'd write in TypeScript (plain JavaScript plus type labels, so it reads fine if you only know JS), then shows the Go version and explains what changed.</p>
          <div className="row" style={{ marginTop: 24 }}>
            <a href={lessonHref(first)} className="btn btn-primary btn-lg">Start learning</a>
            <a href="#tracks" onClick={e => { e.preventDefault(); document.getElementById('tracks')?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' }) }} className="btn btn-secondary btn-lg">Browse the tracks</a>
          </div>
        </div>
      </section>

      <RuntimeRace />

      <section id="tracks" className="tracks">
        <div className="tracks-head">
          <h2>Seven tracks</h2>
        </div>
        <div className="track-grid">
          {TRACKS.map(t => (
            <a key={t.id} href={lessonHref(t.lessons[0].id)} className="track-card">
              <div className="track-card-top">
                <span className="num">Track {t.n}</span>
                <span className="num">{t.lessons.length} lessons</span>
              </div>
              <span className="track-card-title">{t.title}</span>
              <span className="track-card-blurb">{t.blurb}</span>
            </a>
          ))}
          <a href="/playground" className="track-card pg-card">
            <span className="num" style={{ color: C.runtime }}>Any time</span>
            <span className="track-card-title">Playground</span>
            <span className="track-card-blurb">Step through recorded programs: goroutine lanes, channels and output, one step at a time.</span>
            <span className="pg-card-link">Open the Playground</span>
          </a>
        </div>
      </section>
    </div>
  )
}
