import { MenuIcon, PlayIcon } from './icons'

type Active = 'home' | 'learn' | 'playground'

export function TopBar({ active, onMenu }: { active: Active; onMenu?: () => void }) {
  return (
    <header className="topbar">
      {onMenu && (
        <button type="button" className="topbar-menu" onClick={onMenu} aria-label="Open course menu"><MenuIcon /></button>
      )}
      <a href="#/" className="brand">
        <span className="brand-mark">go</span>
        <span className="brand-text">
          <span className="brand-name">Go from TypeScript</span>
          <span className="brand-sub">A mentor-led course</span>
        </span>
      </a>

      <span className="grow" />

      {active === 'playground'
        ? <span className="btn btn-md pg-current">Playground</span>
        : <a href="#/playground" className="btn btn-primary btn-md pg-btn"><PlayIcon />Playground</a>}
    </header>
  )
}
