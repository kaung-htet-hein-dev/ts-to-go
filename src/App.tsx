import { useEffect, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { trackOf } from './data/course'
import { LESSONS } from './data/lessons'
import { useRoute } from './lib/router'
import { Home } from './pages/Home'
import { ChannelsLesson } from './pages/ChannelsLesson'
import { LessonPage } from './pages/LessonPage'
import { LessonPlaceholder } from './pages/LessonPlaceholder'
import { Playground } from './pages/Playground'
import './styles/ui.css'
import './styles/layout.css'
import './styles/pages.css'

export default function App() {
  const [page, param] = useRoute()
  const [drawer, setDrawer] = useState(false)
  const routeKey = `${page}/${param}`

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [routeKey])

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

  return (
    <div className="app">
      <TopBar active="home" />
      <Home />
    </div>
  )
}
