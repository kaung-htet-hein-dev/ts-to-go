import { useSyncExternalStore } from 'react'

// Tiny path router: '/lesson/channels' -> ['lesson', 'channels'].
// Real paths (not '#/...') so every lesson is its own crawlable URL.
// Same-origin <a href="/..."> clicks are turned into pushState navigations
// by installLinkInterceptor; in-page anchors use scrollToId instead.

const NAV_EVENT = 'app:navigate'

let serverPath = '/'
/** Used while prerendering: the path to render instead of window.location. */
export function setServerPath(path: string) {
  serverPath = path
}

const subscribe = (fn: () => void) => {
  window.addEventListener('popstate', fn)
  window.addEventListener(NAV_EVENT, fn)
  return () => {
    window.removeEventListener('popstate', fn)
    window.removeEventListener(NAV_EVENT, fn)
  }
}

const currentPath = () => (typeof window === 'undefined' ? serverPath : window.location.pathname)

export const splitPath = (path: string) => path.split('/').filter(Boolean)

export function usePath(): string {
  return useSyncExternalStore(subscribe, currentPath, currentPath)
}

export function useRoute(): string[] {
  return splitPath(usePath())
}

export function navigate(href: string) {
  window.history.pushState(null, '', href)
  window.dispatchEvent(new Event(NAV_EVENT))
}

export function installLinkInterceptor() {
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = (e.target as Element | null)?.closest?.('a')
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return
    const href = a.getAttribute('href')
    if (!href || !href.startsWith('/') || href.startsWith('//')) return
    e.preventDefault()
    if (href !== window.location.pathname) navigate(href)
  })
}

/** Old links used '#/lesson/x'. Returns the path they now live at, if any. */
export function legacyHashPath(): string | null {
  const h = window.location.hash
  return h.startsWith('#/') ? h.slice(1) : null
}

export function scrollToId(id: string, offset = 80) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: reduce ? 'auto' : 'smooth' })
}
