import type { LessonId } from '../course'
import { START } from './t1-start'
import { BASICS } from './t2-basics'
import { DATA } from './t3-data'
import { TYPES } from './t4-types'
import { CONCURRENCY } from './t5-concurrency'
import { UNDER } from './t6-under'
import { BUILDING } from './t7-building'
import type { LessonContent } from './types'

/** Every lesson written as data. Channels has its own hand-built page. */
export const LESSONS: Partial<Record<LessonId, LessonContent>> = Object.fromEntries(
  [...START, ...BASICS, ...DATA, ...TYPES, ...CONCURRENCY, ...UNDER, ...BUILDING].map(l => [l.id, l]),
)
