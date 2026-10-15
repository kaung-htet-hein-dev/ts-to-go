import { lessonHref, lessonPosition, lessonTitle, neighbors, type LessonId } from '../data/course'

export function LessonPlaceholder({ id }: { id?: LessonId }) {
  if (!id) {
    return (
      <main className="lesson-main">
        <div className="lesson empty-state">
          <h1 className="lesson-title">That lesson doesn't exist</h1>
          <p className="lead">The link may be out of date. Pick a lesson from the course menu.</p>
          <a href="#/" className="btn btn-primary btn-md">Go to the home page</a>
        </div>
      </main>
    )
  }
  const pos = lessonPosition(id)
  const { next } = neighbors(id)
  return (
    <main className="lesson-main">
      <article className="lesson">
        <nav className="crumbs" aria-label="Breadcrumb">
          {pos && <span>{pos.track.title}</span>}
          <span aria-hidden="true">›</span>
          <span className="here">{lessonTitle(id)}</span>
        </nav>
        <h1 className="lesson-title">{lessonTitle(id)}</h1>
        <div className="empty-state">
          <h2>This lesson is being written</h2>
          <p>Its outline is in place, but the page isn't. Try the Channels lesson in the meantime.</p>
          <div className="row">
            <a href={lessonHref('channels')} className="btn btn-primary btn-md">Open Channels</a>
            {next && <a href={lessonHref(next.id)} className="btn btn-secondary btn-md">Next: {next.title}</a>}
          </div>
        </div>
      </article>
    </main>
  )
}
