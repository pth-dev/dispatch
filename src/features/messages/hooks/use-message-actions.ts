import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store'
import { resolveApiErrorMessage } from '@/services/http'
import { useCreateMessage, useCreateMessageReply } from '../api/queries'

export function useMessageActions() {
  const { t, i18n } = useTranslation()
  const user = useAppStore((s) => s.user)
  const createMessage = useCreateMessage()
  const createReply = useCreateMessageReply()
  const [replyingMap, setReplyingMap] = useState<Record<number, boolean>>({})
  const [postError, setPostError] = useState<string | null>(null)
  const [replyErrors, setReplyErrors] = useState<Record<number, string>>({})

  const clearReplyingFlag = (messageId: number) => {
    setReplyingMap((prev) => {
      if (!(messageId in prev)) return prev
      const next = { ...prev }
      delete next[messageId]
      return next
    })
  }

  const submitMessage = async (content: string): Promise<boolean> => {
    if (!user) return false
    setPostError(null)
    try {
      await createMessage.mutateAsync({
        username: user.username,
        fullname: user.fullname || user.username,
        content,
      })
      return true
    } catch (error) {
      setPostError(resolveApiErrorMessage(error, t, i18n.language))
      return false
    }
  }

  const submitReply = async (messageId: number, content: string): Promise<boolean> => {
    if (!user) return false
    setReplyingMap((prev) => ({ ...prev, [messageId]: true }))
    setReplyErrors((prev) => {
      if (!(messageId in prev)) return prev
      const next = { ...prev }
      delete next[messageId]
      return next
    })
    try {
      await createReply.mutateAsync({
        messageId,
        username: user.username,
        fullname: user.fullname || user.username,
        content,
      })
      clearReplyingFlag(messageId)
      return true
    } catch (error) {
      const msg = resolveApiErrorMessage(error, t, i18n.language)
      setReplyErrors((prev) => ({ ...prev, [messageId]: msg }))
      clearReplyingFlag(messageId)
      return false
    }
  }

  return {
    isPosting: createMessage.isPending,
    postError,
    replyingMap,
    replyErrors,
    submitMessage,
    submitReply,
  }
}
