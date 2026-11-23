export type TextSegment =
  | { type: 'text'; value: string }
  | { type: 'link'; value: string; href: string }

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi
const TRAILING_PUNCTUATION_REGEX = /[.,!?;:)\]]+$/

function isValidHttpUrl(candidate: string): boolean {
  try {
    const parsed = new URL(candidate)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    return parsed.hostname === 'localhost' || parsed.hostname.includes('.')
  } catch {
    return false
  }
}

/**
 * Safely splits plain text into plain segments and http(s) link segments
 * so components can render native `<a>` elements without `dangerouslySetInnerHTML`.
 */
export function splitTextWithLinks(text: string): TextSegment[] {
  if (!text) return []

  const segments: TextSegment[] = []
  let lastIndex = 0
  URL_REGEX.lastIndex = 0

  let match: RegExpExecArray | null = URL_REGEX.exec(text)
  while (match !== null) {
    const start = match.index
    const rawUrl = match[0]
    const trimmedUrl = rawUrl.replace(TRAILING_PUNCTUATION_REGEX, '')
    const trailing = rawUrl.slice(trimmedUrl.length)

    if (start > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, start) })
    }

    if (trimmedUrl.length > 0 && isValidHttpUrl(trimmedUrl)) {
      segments.push({ type: 'link', value: trimmedUrl, href: trimmedUrl })
      if (trailing.length > 0) {
        segments.push({ type: 'text', value: trailing })
      }
    } else {
      segments.push({ type: 'text', value: rawUrl })
    }

    lastIndex = start + rawUrl.length
    match = URL_REGEX.exec(text)
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return segments
}
