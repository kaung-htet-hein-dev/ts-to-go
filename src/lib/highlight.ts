export type TokenKind = 'plain' | 'kw' | 'type' | 'str' | 'num' | 'com' | 'fn'
export interface Token { t: string; k: TokenKind }
export type Lang = 'go' | 'ts'

const KW: Record<Lang, RegExp> = {
  go: /^(func|go|for|range|if|else|return|var|const|type|struct|interface|chan|close|make|defer|select|case|package|import|map|switch|default|break|continue|fallthrough|goto|iota|nil|true|false)$/,
  ts: /^(const|let|var|async|await|function|for|of|in|new|return|if|else|class|interface|type|extends|implements|try|catch|finally|throw|export|import|from|as|switch|case|default|break|continue|while|do|typeof|instanceof|readonly|void|this|super|yield|static|private|public|enum|keyof|true|false|null|undefined)$/,
}
const TYPES = /^(int|int8|int16|int32|int64|uint|uint8|uint16|uint32|uint64|uintptr|float32|float64|complex64|complex128|string|bool|error|byte|rune|any|comparable|number|boolean|bigint|unknown|never|object|symbol|Promise|Array|Record|Map|Set|Error|AsyncQueue|sync|WaitGroup|Mutex)$/

/** Small regex highlighter. Good enough for lesson snippets, not a parser. */
export function highlightLine(line: string, lang: Lang = 'go'): Token[] {
  const toks: Token[] = []
  const re = /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`)|(\b\d+\b)|([A-Za-z_]\w*)|(\s+)|([^\sA-Za-z_\d"'`]+)|(.)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(line))) {
    let k: TokenKind = 'plain'
    if (m[1]) k = 'com'
    else if (m[2]) k = 'str'
    else if (m[3]) k = 'num'
    else if (m[4]) {
      if (KW[lang].test(m[4])) k = 'kw'
      else if (TYPES.test(m[4])) k = 'type'
      else if (line[re.lastIndex] === '(') k = 'fn'
    }
    toks.push({ t: m[0], k })
  }
  return toks
}
