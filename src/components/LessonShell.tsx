import { useEffect, useState, type ReactNode } from 'react'
import { lessonHref, lessonPosition, lessonTitle, neighbors, type LessonId } from '../data/course'
import { scrollToId } from '../lib/router'

export interface SectionDef { id: string; title: string }

/** Page frame shared by every written lesson: header, table of contents, prev/next. */
export function LessonShell({ id, lead, minutes, sections, children }: {
  id: LessonId
  lead: ReactNode
  minutes: number
  sections: SectionDef[]
  children: ReactNode
}) {
  const pos = lessonPosition(id)
  const { prev, next } = neighbors(id)
  const [active, setActive] = useState(sections[0]?.id)

  useEffect(() => {
    const onScroll = () => {
      let a = sections[0]?.id
      for (const s of sections) {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top < 160) a = s.id
      }
      // The last section is often too short to reach the 160px line, so treat
      // reaching the bottom of the page as being on it.
      const root = document.documentElement
      if (window.innerHeight + window.scrollY >= root.scrollHeight - 2) a = sections[sections.length - 1]?.id ?? a
      setActive(a)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [sections])

  return (
    <div className="lesson-grid">
      <main className="lesson-main">
        <article className="lesson">
          <nav className="crumbs" aria-label="Breadcrumb">
            {pos && <a href={lessonHref(pos.track.lessons[0].id)}>{pos.track.title}</a>}
            <span aria-hidden="true">›</span>
            <span className="here">{lessonTitle(id)}</span>
          </nav>
          <h1 className="lesson-title">{lessonTitle(id)}</h1>
          <p className="lead">{lead}</p>
          <div className="lesson-meta">
            {pos && <span>Track {pos.track.n}, lesson {pos.index} of {pos.count}</span>}
            <span>About {minutes} minutes</span>
          </div>

          {children}

          <nav className="pager" aria-label="Lessons">
            {prev ? (
              <a href={lessonHref(prev.id)}>
                <span className="pager-dir">‹ Previous</span>
                <span className="pager-title">{prev.title}</span>
              </a>
            ) : <span />}
            {next && (
              <a href={lessonHref(next.id)} className="next">
                <span className="pager-dir">Next ›</span>
                <span className="pager-title">{next.title}</span>
              </a>
            )}
          </nav>
        </article>
      </main>

      <aside className="toc" aria-label="On this page">
        <div className="toc-head">On this page</div>
        <div className="toc-list">
          {sections.map((s, k) => (
            <button key={s.id} type="button" aria-current={active === s.id ? 'location' : undefined} onClick={() => scrollToId(s.id)}>
              <span className="toc-n">{k + 1}</span>{s.title}
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}

export function Section({ id, n, eyebrow, title, children }: {
  id: string; n: number; eyebrow: string; title: string; children: ReactNode
}) {
  return (
    <section id={id} className="lsec" aria-labelledby={`${id}-h`}>
      <div className="lsec-eyebrow"><span className="lsec-n">{n}</span>{eyebrow}</div>
      <h2 id={`${id}-h`}>{title}</h2>
      {children}
    </section>
  )
}
