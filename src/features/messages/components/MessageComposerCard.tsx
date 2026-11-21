import type { KeyboardEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Send } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  MessageCreateFormSchema,
  type MessageCreateFormValues,
} from '@/schemas/message'

type MessageComposerCardProps = {
  isSubmitting: boolean
  submitError?: string | null
  onSubmitMessage: (content: string) => Promise<boolean>
}

export function MessageComposerCard({
  isSubmitting,
  submitError,
  onSubmitMessage,
}: MessageComposerCardProps) {
  const { t } = useTranslation()
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MessageCreateFormValues>({
    resolver: zodResolver(MessageCreateFormSchema),
    defaultValues: { content: '' },
  })

  const onValidSubmit = async (values: MessageCreateFormValues) => {
    if (isSubmitting) return
    const ok = await onSubmitMessage(values.content)
    if (ok) {
      reset({ content: '' })
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      if (isSubmitting) return
      void handleSubmit(onValidSubmit)()
    }
  }

  const contentError = errors.content?.message

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-3" noValidate>
        <div className="space-y-1.5">
          <label
            htmlFor="message-composer-input"
            className="block text-sm font-semibold text-foreground"
          >
            {t('messages.composer.title')}
          </label>
          <Controller
            control={control}
            name="content"
            render={({ field }) => (
              <Textarea
                id="message-composer-input"
                rows={3}
                placeholder={t('messages.composer.placeholder')}
                aria-invalid={Boolean(contentError || submitError)}
                aria-describedby={contentError || submitError ? 'message-composer-error' : undefined}
                readOnly={isSubmitting}
                onKeyDown={handleKeyDown}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
          {(contentError || submitError) && (
            <p id="message-composer-error" className="text-xs text-destructive" role="alert">
              {contentError ? t(contentError) : submitError}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {t('messages.composer.shortcutHint')}
          </span>
          <Button type="submit" disabled={isSubmitting}>
            <Send className="size-4" aria-hidden="true" />
            <span>
              {isSubmitting ? t('messages.composer.sending') : t('messages.composer.submit')}
            </span>
          </Button>
        </div>
      </form>
    </section>
  )
}
