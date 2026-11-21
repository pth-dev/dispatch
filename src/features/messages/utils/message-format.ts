import type { RawMessage } from '@/schemas/message'

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

export function formatMessageAuthor(fullname?: string | null, username?: string | null): string {
  const name = (fullname ?? '').trim()
  const code = (username ?? '').trim()
  if (name && code && name.toLowerCase() !== code.toLowerCase()) {
    return `${name} (${code})`
  }
  return name || code || '?'
}

export function getAuthorInitial(fullname?: string | null, username?: string | null): string {
  const label = (fullname ?? '').trim() || (username ?? '').trim()
  return label ? label.charAt(0).toUpperCase() : '?'
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

export type MessageScope = 'all' | 'mine'

export function filterMessages(
  messages: readonly RawMessage[],
  scope: MessageScope,
  search: string,
  currentUsername?: string | null,
): RawMessage[] {
  const normalizedUser = (currentUsername ?? '').trim().toLowerCase()
  const query = search.trim().toLowerCase()

  return messages.filter((msg) => {
    if (scope === 'mine' && normalizedUser) {
      const isAuthor = msg.username.trim().toLowerCase() === normalizedUser
      const hasMyReply = msg.replies.some(
        (reply) => reply.username.trim().toLowerCase() === normalizedUser,
      )
      if (!isAuthor && !hasMyReply) return false
    }

    if (!query) return true

    const haystack = [
      msg.fullname,
      msg.username,
      msg.content,
      msg.ip,
      ...msg.replies.flatMap((reply) => [reply.fullname, reply.username, reply.content]),
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
}
