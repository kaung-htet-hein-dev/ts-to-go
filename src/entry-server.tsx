/* eslint-disable react-refresh/only-export-components -- build-time entry, never hot-reloaded */
// Build-time only: renders a route to HTML for scripts/prerender.mjs.
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.tsx'
import { setServerPath } from './lib/router'
import { ALL_PATHS, SITE_URL, headTags, routeMeta } from './lib/seo'

export { ALL_PATHS, SITE_URL }

export function render(path: string) {
  setServerPath(path)
  return {
    html: renderToString(<StrictMode><App /></StrictMode>),
    head: headTags(routeMeta(path)),
  }
}
