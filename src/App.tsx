import { useEffect, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { trackOf } from './data/course'
import { LESSONS } from './data/lessons'
import { usePath, splitPath } from './lib/router'
import { applyMeta, routeMeta } from './lib/seo'
import { Home } from './pages/Home'
import { ChannelsLesson } from './pages/ChannelsLesson'
import { LessonPage } from './pages/LessonPage'
import { LessonPlaceholder } from './pages/LessonPlaceholder'
import { Playground } from './pages/Playground'
import './styles/ui.css'
import './styles/layout.css'
import './styles/pages.css'

export default function App() {
  const path = usePath()
  const [page, param] = splitPath(path)
  const [drawer, setDrawer] = useState(false)
  const routeKey = `${page}/${param}`

  useEffect(() => {
    window.scrollTo(0, 0)
    applyMeta(routeMeta(path))
  }, [routeKey, path])

  if (page === 'playground') {
    return (
      <div className="app app-fixed">
        <TopBar active="playground" />
        <Playground />
      </div>
    )
  }

  if (page === 'lesson') {
    const lessonId = param && trackOf(param) ? param : undefined
    return (
      <div className="app">
        <TopBar active="learn" onMenu={() => setDrawer(true)} />
        <div className="with-sidebar">
          <Sidebar current={lessonId} open={drawer} onClose={() => setDrawer(false)} />
          {lessonId === 'channels'
            ? <ChannelsLesson key={routeKey} />
            : lessonId && LESSONS[lessonId]
              ? <LessonPage key={routeKey} lesson={LESSONS[lessonId]} />
              : <LessonPlaceholder key={routeKey} id={lessonId} />}
        </div>
      </div>
    )
  }

  if (page) {
    return (
      <div className="app">
        <TopBar active="learn" />
        <LessonPlaceholder />
      </div>
    )
  }

  return (
    <div className="app">
      <TopBar active="home" />
      <Home />
    </div>
  )
}
