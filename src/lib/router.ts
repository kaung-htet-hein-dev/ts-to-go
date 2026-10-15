import { useSyncExternalStore } from 'react'

// Tiny hash router: '#/lesson/channels' -> ['lesson', 'channels'].
// In-page anchors use '#!section-id' links handled by scrollToId instead.

const subscribe = (fn: () => void) => {
  window.addEventListener('hashchange', fn)
  return () => window.removeEventListener('hashchange', fn)
}

export function useRoute(): string[] {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => '')
  return hash.replace(/^#\/?/, '').split('/').filter(Boolean)
}

export function scrollToId(id: string, offset = 80) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: reduce ? 'auto' : 'smooth' })
}
