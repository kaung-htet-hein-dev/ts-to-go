import { useEffect, useRef, useState } from 'react'
import { TRACKS, lessonHref, trackOf, type LessonId } from '../data/course'
import { Chevron, CloseIcon } from './icons'

export function Sidebar({ current, open, onClose }: { current?: LessonId; open: boolean; onClose: () => void }) {
  const curTrack = current ? trackOf(current) : undefined
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const box = scrollRef.current
    const el = box?.querySelector<HTMLElement>('[aria-current="page"]')
    if (box && el) box.scrollTop = Math.max(0, el.offsetTop - box.clientHeight / 2)
  }, [current])

  return (
    <>
      <div className={open ? 'scrim on' : 'scrim'} onClick={onClose} aria-hidden="true" />
      <nav className={open ? 'sidebar open' : 'sidebar'} aria-label="Course">
        <div className="sidebar-head">
          <span>Course</span>
          <button type="button" className="btn btn-secondary btn-icon" onClick={onClose} aria-label="Close course menu"><CloseIcon size={14} /></button>
        </div>
        <div className="sidebar-scroll" ref={scrollRef}>
          {TRACKS.map(t => {
            const isCur = curTrack?.id === t.id
            const isOpen = expanded[t.id] ?? isCur
            return (
              <div key={t.id} className="sb-track">
                <button type="button" className={isCur ? 'sb-track-btn cur' : 'sb-track-btn'} aria-expanded={isOpen} onClick={() => setExpanded({ ...expanded, [t.id]: !isOpen })}>
                  <Chevron dir={isOpen ? 'down' : 'right'} />
                  <span className="grow">{t.title}</span>
                </button>
                {isOpen && (
                  <div className="sb-lessons">
                    {t.lessons.map(l => (
                      <a key={l.id} href={lessonHref(l.id)} className="sb-lesson" aria-current={l.id === current ? 'page' : undefined} onClick={onClose}>
                        <span className="grow">{l.title}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </nav>
    </>
  )
}
