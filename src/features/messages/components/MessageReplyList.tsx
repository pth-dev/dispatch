import { MessageSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { RawMessageReply } from '@/schemas/message'
import { formatMessageAuthor } from '../utils/message-format'
import { LinkifiedText } from './LinkifiedText'

type MessageReplyListProps = {
  messageId: number
  replies: readonly RawMessageReply[]
}

export function MessageReplyList({ messageId, replies }: MessageReplyListProps) {
  const { t } = useTranslation()

  if (replies.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <MessageSquare className="size-3.5" aria-hidden="true" />
        <span>{t('messages.reply.count', { count: replies.length })}</span>
      </div>

      <ul className="space-y-2">
        {replies.map((reply, idx) => {
          const replyAuthor = formatMessageAuthor(reply.fullname, reply.username)
          const replyIp = reply.ip || t('messages.card.unknownIp')
          return (
            <li
              key={reply.id ?? `${messageId}-reply-${idx}`}
              className="rounded-lg border border-border bg-secondary/50 px-3 py-2.5 space-y-1"
            >
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-xs">
                <span className="font-semibold text-primary">{replyAuthor}</span>
                <span className="text-muted-foreground">
                  {[reply.createdAt, t('messages.card.ipLabel', { ip: replyIp })]
                    .filter(Boolean)
                    .join(' • ')}
                </span>
              </div>
              <LinkifiedText
                text={reply.content}
                className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words"
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
