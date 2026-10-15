import { useEffect, useState } from 'react'

/**
 * Steps through a recorded trace of `count` frames.
 * Frame 0 is the idle frame; the last frame is the end state.
 */
export function usePlayer(count: number, stepMs = 1100) {
  const [f, setF] = useState(0)
  const [playing, setPlaying] = useState(false)
  const last = Math.max(0, count - 1)
  const frame = Math.min(f, last)

  useEffect(() => {
    if (!playing || frame >= last) return
    const t = setTimeout(() => {
      setF(frame + 1)
      if (frame + 1 >= last) setPlaying(false)
    }, stepMs)
    return () => clearTimeout(t)
  }, [playing, frame, last, stepMs])

  return {
    f: frame,
    last,
    playing: playing && frame < last,
    play() {
      if (frame >= last) setF(0)
      setPlaying(true)
    },
    pause: () => setPlaying(false),
    fwd() { setPlaying(false); setF(Math.min(last, frame + 1)) },
    back() { setPlaying(false); setF(Math.max(0, frame - 1)) },
    reset() { setPlaying(false); setF(0) },
    seek(n: number) { setPlaying(false); setF(Math.max(0, Math.min(last, n))) },
    playLabel: frame >= last ? 'Replay' : frame === 0 ? 'Play' : 'Resume',
  }
}

export type Player = ReturnType<typeof usePlayer>
