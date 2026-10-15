import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installLinkInterceptor, legacyHashPath } from './lib/router'

const legacy = legacyHashPath()
if (legacy) {
  // Old '#/lesson/x' links: load the real page so its prerendered HTML is used.
  window.location.replace(legacy)
} else {
  installLinkInterceptor()
  const root = document.getElementById('root')!
  const app = <StrictMode><App /></StrictMode>
  // Hydrate only when the prerendered markup is for this exact path
  // (the 404 page and SPA fallbacks may serve markup for another route).
  if (root.dataset.path === window.location.pathname) hydrateRoot(root, app)
  else {
    root.textContent = ''
    createRoot(root).render(app)
  }
}
