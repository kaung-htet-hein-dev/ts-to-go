import type { CSSProperties } from 'react'

/** Sets a component's accent through the --c custom property. */
export const tone = (c: string) => ({ '--c': c }) as CSSProperties

// Semantic state colors, shared by lessons, Playground and the component sheet.
export const C = {
  idle: '#99A1B3',
  running: '#58C4DC',
  runningFill: '#149ECA',
  runnable: '#2E5D73',
  paused: '#EBECF0',
  wait: '#FABD62',
  queued: '#DB7D27',
  done: '#44AC99',
  doneText: '#7FCCBF',
  err: '#C1554D',
  errText: '#D07D77',
  runtime: '#8891EC',
  empty: '#262A33',
  dim: '#404756',
} as const

export const LANE_LEGEND = [
  { label: 'running', color: C.runningFill },
  { label: 'blocked', color: C.wait },
  { label: 'done', color: C.done },
  { label: 'deadlocked', color: C.err },
]
