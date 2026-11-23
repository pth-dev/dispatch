import type { RawMessage } from '@/schemas/message'
export { splitTextWithLinks, type TextSegment } from '@/utils/linkify'

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
