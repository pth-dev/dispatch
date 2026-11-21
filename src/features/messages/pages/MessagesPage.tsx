import { MessagesSquare, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store'
import {
  InlineError,
  isFullPageError,
  throwFullPageError,
  toErrorStatus,
} from '@/components/layout'
import { Button } from '@/components/ui/button'
import { canWriteMenu } from '@/utils/permissions'
import { useMessages } from '../api/queries'
import { MessageCard } from '../components/MessageCard'
import { MessageComposerCard } from '../components/MessageComposerCard'
import { MessageListSkeleton } from '../components/MessageListSkeleton'
import { MessageToolbar } from '../components/MessageToolbar'
import { useMessageActions } from '../hooks/use-message-actions'
import { useMessageFilters } from '../hooks/use-message-filters'
import { filterMessages } from '../utils/message-format'

export function MessagesPage() {
  const { t } = useTranslation()
  const user = useAppStore((s) => s.user)
  const canWrite = canWriteMenu(user, 'messages')

  const { data: messages = [], isLoading, isFetching, isError, error, refetch } = useMessages()
  const { scope, search, hasActiveFilters, setScope, setSearch, resetFilters } = useMessageFilters()
  const { isPosting, postError, replyingMap, replyErrors, submitMessage, submitReply } =
    useMessageActions()

  const errorStatus = toErrorStatus(error)
  if (isError && isFullPageError(errorStatus)) {
    throwFullPageError(errorStatus)
  }

  const mineCount = filterMessages(messages, 'mine', '', user?.username).length
  const visibleMessages = filterMessages(messages, scope, search, user?.username)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[22px] lg:text-2xl font-semibold text-foreground">
            {t('nav.messages')}
          </h1>
          {!isLoading && !isError && (
            <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-primary">
              {messages.length}
            </span>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          <RefreshCw
            className={isFetching ? 'size-4 motion-safe:animate-spin' : 'size-4'}
            aria-hidden="true"
          />
          <span>{t('common.refresh')}</span>
        </Button>
      </div>

      {canWrite && (
        <MessageComposerCard
          isSubmitting={isPosting}
          submitError={postError}
          onSubmitMessage={submitMessage}
        />
      )}

      <MessageToolbar
        scope={scope}
        search={search}
        allCount={messages.length}
        mineCount={mineCount}
        onScopeChange={setScope}
        onSearchChange={setSearch}
      />

      {isLoading ? (
        <MessageListSkeleton />
      ) : isError ? (
        <InlineError status={errorStatus} onRetry={() => void refetch()} />
      ) : visibleMessages.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-10 text-center space-y-3">
          <MessagesSquare className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">
            {hasActiveFilters ? t('messages.empty.filtered') : t('messages.empty.all')}
          </p>
          {hasActiveFilters && (
            <Button type="button" variant="outline" onClick={resetFilters}>
              {t('messages.empty.clearFilters')}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleMessages.map((msg) => (
            <MessageCard
              key={msg.id}
              message={msg}
              canWrite={canWrite}
              isReplying={Boolean(replyingMap[msg.id])}
              replyError={replyErrors[msg.id]}
              onSubmitReply={submitReply}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default MessagesPage
