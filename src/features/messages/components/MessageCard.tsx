import { useTranslation } from 'react-i18next'
import type { RawMessage } from '@/schemas/message'
import { formatMessageAuthor, getAuthorInitial } from '../utils/message-format'
import { LinkifiedText } from './LinkifiedText'
import { MessageReplyForm } from './MessageReplyForm'
import { MessageReplyList } from './MessageReplyList'

type MessageCardProps = {
  message: RawMessage
  canWrite: boolean
  isReplying: boolean
  replyError?: string | null
  onSubmitReply: (messageId: number, content: string) => Promise<boolean>
}

export function MessageCard({
  message,
  canWrite,
  isReplying,
  replyError,
  onSubmitReply,
}: MessageCardProps) {
  const { t } = useTranslation()
  const authorLabel = formatMessageAuthor(message.fullname, message.username)
  const initial = getAuthorInitial(message.fullname, message.username)
  const ipLabel = message.ip || t('messages.card.unknownIp')

  return (
    <article className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary"
          >
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{authorLabel}</p>
            {message.createdAt && (
              <p className="text-xs text-muted-foreground">{message.createdAt}</p>
            )}
          </div>
        </div>

        <span className="inline-flex items-center rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-muted-foreground shrink-0">
          {t('messages.card.ipLabel', { ip: ipLabel })}
        </span>
      </div>

      <LinkifiedText
        text={message.content}
        className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words"
      />

      {(message.replies.length > 0 || canWrite) && (
        <div className="border-t border-border pt-3 space-y-3">
          <MessageReplyList messageId={message.id} replies={message.replies} />

          {canWrite && (
            <MessageReplyForm
              messageId={message.id}
              isSubmitting={isReplying}
              submitError={replyError}
              onSubmitReply={onSubmitReply}
            />
          )}
        </div>
      )}
    </article>
  )
}
