// Course outline: 7 tracks, 40 lessons. Every page reads tracks and lessons
// only through these exports. Lesson content lives in ./lessons (and the
// hand-built Channels page).

export type LessonId = string

export interface Lesson {
  id: LessonId
  title: string
}

export interface Track {
  id: string
  n: number
  title: string
  blurb: string
  lessons: Lesson[]
}

const l = (id: string, title: string): Lesson => ({ id, title })

export const TRACKS: Track[] = [
  {
    id: 'start', n: 1, title: 'Start here',
    blurb: 'Why does Go feel so different from TS? It builds one program file you can copy and run, and it has no classes and no throw/catch. Start here for the mental map, the go command, and how packages share code.',
    lessons: [l('differs', 'How Go differs from JS and TS'), l('toolchain', 'Toolchain: mod, run, build, fmt, vet, test'), l('packages', 'Packages and exported names')],
  },
  {
    id: 'basics', n: 2, title: 'Basics',
    blurb: 'In JS, a variable you forget to set is undefined. In Go, it starts at a safe zero value. Learn that, the one loop keyword Go has, functions that return two values, defer for cleanup, and pointers.',
    lessons: [l('variables', 'Variables, := and zero values'), l('types', 'Types, constants, iota'), l('control', 'for, if, switch'), l('functions', 'Functions, multiple returns, closures'), l('defer', 'defer'), l('pointers', 'Pointers')],
  },
  {
    id: 'data', n: 3, title: 'Data',
    blurb: 'Slices are Go\'s growable arrays, and two of them can quietly share memory. Learn slices, maps, text as bytes and runes, and how structs reuse code without extends.',
    lessons: [l('slices', 'Arrays versus slices'), l('maps', 'Maps'), l('strings', 'Strings, bytes, runes'), l('structs', 'Structs and embedding'), l('methods', 'Methods: value versus pointer receivers')],
  },
  {
    id: 'types', n: 4, title: 'Types and errors',
    blurb: 'Go checks interfaces by shape, like TS does, but you never write implements. Learn interfaces, the nil interface trap, generics, and why errors are returned like any other value.',
    lessons: [l('interfaces', 'Interfaces without "implements"'), l('niltrap', 'Interface values and the nil trap'), l('assertions', 'Type assertions and type switches'), l('generics', 'Generics and constraints'), l('errors', 'Errors as values: wrapping, Is, As'), l('panic', 'panic and recover')],
  },
  {
    id: 'concurrency', n: 5, title: 'Concurrency',
    blurb: 'In JS you await things on one thread. In Go you start goroutines and pass values between them through channels. Learn goroutines, channels, select, locks, context (Go\'s AbortController) and common patterns.',
    lessons: [l('goroutines', 'Goroutines versus async/await'), l('channels', 'Channels: unbuffered and buffered'), l('select', 'select'), l('sync', 'sync: Mutex, WaitGroup, Once, atomic'), l('races', 'Race conditions'), l('context', 'context: cancel, timeout, values'), l('patterns', 'Patterns: worker pool, pipeline, fan-in'), l('deadlocks', 'Deadlocks and goroutine leaks')],
  },
  {
    id: 'under', n: 6, title: 'Under the hood',
    blurb: 'What actually happens when your Go code runs? Look inside the scheduler, stack and heap memory, the garbage collector, and the structures behind slices, maps and channels.',
    lessons: [l('scheduler', 'The scheduler'), l('escape', 'Stack versus heap, escape analysis'), l('gc', 'Garbage collector'), l('stacks', 'Growing stacks'), l('internals', 'Inside a slice, a map, a channel'), l('layout', 'Struct layout and padding')],
  },
  {
    id: 'building', n: 7, title: 'Building things',
    blurb: 'Put it all together and build real things: tests, streams with io.Reader, JSON, an HTTP server like Express, modules, and what changed in newer Go.',
    lessons: [l('testing', 'Testing, benchmarks, fuzzing'), l('io', 'io.Reader and io.Writer'), l('json', 'JSON and struct tags'), l('http', 'net/http server'), l('modules', 'Project layout and modules'), l('newer', 'Newer Go')],
  },
]

const ALL = TRACKS.flatMap(t => t.lessons)

export const lessonTitle = (id: LessonId) => ALL.find(x => x.id === id)?.title ?? id
export const trackOf = (id: LessonId) => TRACKS.find(t => t.lessons.some(x => x.id === id))
export const lessonHref = (id: LessonId) => `/lesson/${id}`
export const TOTAL_LESSONS = ALL.length

export function neighbors(id: LessonId) {
  const i = ALL.findIndex(x => x.id === id)
  return { prev: i > 0 ? ALL[i - 1] : undefined, next: i >= 0 ? ALL[i + 1] : undefined }
}

export function lessonPosition(id: LessonId) {
  const t = trackOf(id)
  if (!t) return null
  return { track: t, index: t.lessons.findIndex(x => x.id === id) + 1, count: t.lessons.length }
}
