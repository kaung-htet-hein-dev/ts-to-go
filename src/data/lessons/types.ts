// Shape of a written lesson. Lessons are plain data; LessonPage renders them.
//
// Inline text ("Rich" strings) supports a tiny markup:
//   `code`            inline code
//   **bold**          strong text
//   [label](#/lesson/id)  link to another lesson (or any href)

import type { LessonId } from '../course'

export type Rich = string

/** One block inside a section. A bare string is a paragraph. */
export type Block =
  | Rich
  | { code: string; lang?: 'go' | 'ts'; title?: string; file?: string }
  | { compare: { ts: string; go: string; tsFile?: string; goFile?: string } }
  | { list: Rich[] }
  | { note: Rich; title?: string }
  | { pitfall: Rich; title?: string }
  | { table: { head: Rich[]; rows: Rich[][] } }

export interface ContentSection {
  /** Short label used in the eyebrow and the table of contents. */
  eyebrow: string
  title: string
  blocks: Block[]
}

export type TraceKind = 'idle' | 'run' | 'wait' | 'runtime' | 'out' | 'err'

export interface Predict {
  /** Defaults to "What does this program print?" */
  q?: string
  code: string
  options: string[]
  /** Index into options. */
  answer: number
  /** Shown after answering. Explain in simple words. */
  why: string
  /** Optional step-by-step trace shown after answering: [where, what happens, kind]. */
  trace?: [string, string, TraceKind][]
}

export interface Challenge {
  title: string
  prompt: Rich
  /** Program text. Exactly one `___` marks the blank the learner fills in. */
  code: string
  /** Accepted answers. Compared after removing all whitespace. */
  answers: string[]
  /** Shown when the answer is right. */
  success: Rich
  /** Known wrong answers with a specific explanation. */
  wrong?: { answers: string[]; title: string; body: Rich }[]
  /** Fallback explanation for any other wrong answer. */
  hint: Rich
}

export interface LessonContent {
  id: LessonId
  minutes: number
  lead: Rich
  /** Section 1: the TypeScript the learner already knows, next to the Go version. */
  fromTs: {
    title: string
    intro: Rich
    ts: string
    go: string
    tsFile?: string
    goFile?: string
    /** Exactly three [title, body] facts. */
    facts: [Rich, Rich][]
  }
  /** Teaching sections between "from TS" and "pitfalls". */
  sections: ContentSection[]
  pitfalls: { title: string; body: Rich }[]
  note?: Rich
  deepDive?: { q: string; body: Rich[] }
  predict: Predict
  challenge: Challenge
  /** "Remember this" bullets at the end. */
  recap: Rich[]
}
