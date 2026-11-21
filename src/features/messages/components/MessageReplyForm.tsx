import { zodResolver } from '@hookform/resolvers/zod'
import { Send } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  MessageReplyFormSchema,
  type MessageReplyFormValues,
} from '@/schemas/message'

type MessageReplyFormProps = {
  messageId: number
  isSubmitting: boolean
  submitError?: string | null
  onSubmitReply: (messageId: number, content: string) => Promise<boolean>
}

export function MessageReplyForm({
  messageId,
  isSubmitting,
  submitError,
  onSubmitReply,
}: MessageReplyFormProps) {
  const { t } = useTranslation()
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MessageReplyFormValues>({
    resolver: zodResolver(MessageReplyFormSchema),
    defaultValues: { content: '' },
  })

  const onValidSubmit = async (values: MessageReplyFormValues) => {
    if (isSubmitting) return
    const ok = await onSubmitReply(messageId, values.content)
    if (ok) {
      reset({ content: '' })
    }
  }

  const inputId = `message-reply-input-${messageId}`
  const errorId = `message-reply-error-${messageId}`
  const contentError = errors.content?.message
  const displayError = contentError ? t(contentError) : submitError

  return (
    <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-1.5" noValidate>
      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name="content"
          render={({ field }) => (
            <Input
              id={inputId}
              type="text"
              placeholder={t('messages.reply.placeholder')}
              aria-label={t('messages.reply.inputAria')}
              aria-invalid={Boolean(displayError)}
              aria-describedby={displayError ? errorId : undefined}
              readOnly={isSubmitting}
              className="bg-card"
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="shrink-0">
          <Send className="size-4" aria-hidden="true" />
          <span>{t('messages.reply.submit')}</span>
        </Button>
      </div>
      {displayError && (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {displayError}
        </p>
      )}
    </form>
  )
}
