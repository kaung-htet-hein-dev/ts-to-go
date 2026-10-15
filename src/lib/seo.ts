// Per-route <head> data. Used by the prerender script (static HTML for
// crawlers and link previews) and by App on client-side navigation.

import { TOTAL_LESSONS, TRACKS, lessonPosition, lessonTitle, trackOf } from '../data/course'
import { LESSONS } from '../data/lessons'
import { splitPath } from './router'

export const SITE_URL = 'https://ts-to-go.kaungdev.workers.dev'
export const SITE_NAME = 'Go from TypeScript'
export const OG_IMAGE = `${SITE_URL}/og.png`

export interface RouteMeta {
  path: string
  title: string
  description: string
  /** false for not-found pages. */
  index: boolean
  jsonLd: object[]
}

const HOME_DESCRIPTION = `Learn Go if you already know JavaScript or TypeScript. ${TOTAL_LESSONS} interactive lessons that put the TypeScript you'd write next to the Go version: goroutines, channels, interfaces, errors, generics and the runtime.`

const CHANNELS_LEAD = "In JavaScript, two pieces of async code hand data to each other through a promise or a shared queue. In Go, goroutines (Go's lightweight threads) pass values through a channel."

/** Strips the lesson markup (`code`, **bold**, [label](href)) to plain text. */
const plain = (s: string) => s
  .replace(/`([^`]+)`/g, '$1')
  .replace(/\*\*([^*]+)\*\*/g, '$1')
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  .replace(/\s+/g, ' ')
  .trim()

/** Cuts to at most `max` chars, at a sentence end if one is close, else a word. */
function clip(s: string, max = 158) {
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const dot = cut.lastIndexOf('. ')
  if (dot > max * 0.55) return cut.slice(0, dot + 1)
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:]$/, '') + '…'
}

const breadcrumbs = (items: [string, string][]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE_URL + path })),
})

const COURSE = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'Go from TypeScript',
  description: HOME_DESCRIPTION,
  url: SITE_URL + '/',
  inLanguage: 'en',
  isAccessibleForFree: true,
  educationalLevel: 'Intermediate',
  teaches: ['Go programming language', 'Goroutines and channels', 'Go interfaces and generics', 'Error handling in Go'],
  provider: { '@type': 'Person', name: 'Kaung Htet Hein', url: 'https://github.com/kaung-htet-hein-dev' },
  offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD', category: 'Free' },
  hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Online', courseWorkload: 'PT10H' },
  syllabusSections: TRACKS.map(t => ({ '@type': 'Syllabus', name: `Track ${t.n}. ${t.title}`, description: t.blurb })),
}

export function routeMeta(path: string): RouteMeta {
  const [page, param] = splitPath(path)

  if (!page) {
    return {
      path: '/',
      title: 'Go from TypeScript: learn Go as a JS/TS developer',
      description: clip(HOME_DESCRIPTION, 200),
      index: true,
      jsonLd: [
        { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: SITE_URL + '/' },
        COURSE,
      ],
    }
  }

  if (page === 'playground') {
    return {
      path: '/playground',
      title: `Goroutine and channel playground | ${SITE_NAME}`,
      description: 'Step through Go concurrency programs one event at a time. Watch goroutines block, wake and hand values through channels, and see how deadlocks happen.',
      index: true,
      jsonLd: [breadcrumbs([[SITE_NAME, '/'], ['Playground', '/playground']])],
    }
  }

  const track = page === 'lesson' && param ? trackOf(param) : undefined
  if (track && param) {
    const title = lessonTitle(param)
    const lead = param === 'channels' ? CHANNELS_LEAD : LESSONS[param]?.lead ?? track.blurb
    const pos = lessonPosition(param)
    const description = clip(plain(lead))
    const lessonPath = `/lesson/${param}`
    return {
      path: lessonPath,
      title: `${title} | Go for TypeScript developers`,
      description,
      index: true,
      jsonLd: [
        breadcrumbs([[SITE_NAME, '/'], [track.title, `/lesson/${track.lessons[0].id}`], [title, lessonPath]]),
        {
          '@context': 'https://schema.org',
          '@type': 'LearningResource',
          name: title,
          description,
          url: SITE_URL + lessonPath,
          inLanguage: 'en',
          isAccessibleForFree: true,
          learningResourceType: 'Lesson',
          timeRequired: `PT${LESSONS[param]?.minutes ?? 15}M`,
          position: pos?.index,
          isPartOf: { '@type': 'Course', name: COURSE.name, url: COURSE.url },
        },
      ],
    }
  }

  return {
    path,
    title: `Page not found | ${SITE_NAME}`,
    description: 'This page does not exist. Pick a lesson from the course menu.',
    index: false,
    jsonLd: [],
  }
}

/** Every indexable path, in course order. */
export const ALL_PATHS = ['/', ...TRACKS.flatMap(t => t.lessons.map(l => `/lesson/${l.id}`)), '/playground']

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** The tags that go in <head> for a route. */
export function headTags(m: RouteMeta): string {
  const url = SITE_URL + m.path
  return [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    m.index ? `<link rel="canonical" href="${url}" />` : `<meta name="robots" content="noindex" />`,
    `<meta property="og:type" content="${m.path.startsWith('/lesson/') ? 'article' : 'website'}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${SITE_NAME}: a Go course for JavaScript and TypeScript developers" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(m.title)}" />`,
    `<meta name="twitter:description" content="${esc(m.description)}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    ...m.jsonLd.map(j => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`),
  ].join('\n    ')
}

/** Keeps <head> in sync after client-side navigation. */
export function applyMeta(m: RouteMeta) {
  document.title = m.title
  const set = (sel: string, attr: string, value: string) => document.querySelector(sel)?.setAttribute(attr, value)
  const url = SITE_URL + m.path
  set('meta[name="description"]', 'content', m.description)
  set('link[rel="canonical"]', 'href', url)
  set('meta[property="og:title"]', 'content', m.title)
  set('meta[property="og:description"]', 'content', m.description)
  set('meta[property="og:url"]', 'content', url)
  set('meta[name="twitter:title"]', 'content', m.title)
  set('meta[name="twitter:description"]', 'content', m.description)
}
