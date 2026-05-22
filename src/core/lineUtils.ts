export function getLineNumber(text: string, index: number): number {
  return text.slice(0, index).split(/\r\n|\r|\n/).length
}

export function getLineSnippet(text: string, lineNumber: number): string {
  const lines = text.split(/\r\n|\r|\n/)
  return (lines[lineNumber - 1] ?? '').trim().slice(0, 240)
}

export function findMatches(text: string, pattern: RegExp) {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
  const regex = new RegExp(pattern.source, flags)
  const results: Array<{ index: number; match: RegExpExecArray; line: number; snippet: string }> = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const line = getLineNumber(text, match.index)
    results.push({ index: match.index, match, line, snippet: getLineSnippet(text, line) })
    if (match.index === regex.lastIndex) regex.lastIndex += 1
  }

  return results
}
