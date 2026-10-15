import type { ReactNode } from 'react'

// Renders the lesson markup: `code`, **bold**, [label](href).
const PATTERN = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))/g

export function Rich({ text }: { text: string }) {
  const out: ReactNode[] = []
  let at = 0
  const re = new RegExp(PATTERN)
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > at) out.push(text.slice(at, m.index))
    const t = m[0]
    if (m[1]) out.push(<code key={m.index} className="ic-bare">{t.slice(1, -1)}</code>)
    else if (m[2]) out.push(<strong key={m.index}>{t.slice(2, -2)}</strong>)
    else {
      const [, label, href] = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(t)!
      out.push(<a key={m.index} href={href} className="rich-link">{label}</a>)
    }
    at = m.index + t.length
  }
  if (at < text.length) out.push(text.slice(at))
  return <>{out}</>
}
