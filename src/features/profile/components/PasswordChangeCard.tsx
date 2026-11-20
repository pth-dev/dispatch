import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { CircleAlert, CheckCircle2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  UpdatePasswordFormSchema,
  type SessionUser,
  type UpdatePasswordFormValues,
} from '@/schemas/auth'
import { resolveApiErrorMessage, updateLocalPassword } from '@/services'

interface PasswordChangeCardProps {
  user: SessionUser
  onPasswordChanged: () => void
}

export function PasswordChangeCard({ user, onPasswordChanged }: PasswordChangeCardProps) {
  const { t, i18n } = useTranslation()
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(UpdatePasswordFormSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  if (user.auth_source === 'ad') {
    return (
      <section className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-base font-semibold text-foreground">{t('profile.passwordTitle')}</h2>
        <div className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
          <Info className="size-4 shrink-0 text-primary mt-0.5" aria-hidden="true" />
          <span>{t('profile.adPasswordNotice')}</span>
        </div>
      </section>
    )
  }

  const onSubmit = async (values: UpdatePasswordFormValues) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      await updateLocalPassword({
        username: user.username,
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      })
      reset()
      setSuccessMsg(t('profile.passwordSuccess'))
      onPasswordChanged()
    } catch (err) {
      setErrorMsg(resolveApiErrorMessage(err, t, i18n.language))
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h2 className="text-base font-semibold text-foreground">{t('profile.passwordTitle')}</h2>

      {errorMsg && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-border p-3 text-xs text-destructive">
          <CircleAlert className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div role="status" className="flex items-start gap-2 rounded-lg border border-border p-3 text-xs text-success">
          <CheckCircle2 className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 max-w-md" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="pw-old" className="block text-xs font-semibold text-foreground">
            {t('profile.oldPassword')}
          </label>
          <Input id="pw-old" type="password" autoComplete="current-password" {...register('oldPassword')} />
          {errors.oldPassword?.message && (
            <p className="text-xs text-destructive">{t(errors.oldPassword.message)}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="pw-new" className="block text-xs font-semibold text-foreground">
            {t('profile.newPassword')}
          </label>
          <Input id="pw-new" type="password" autoComplete="new-password" {...register('newPassword')} />
          {errors.newPassword?.message && (
            <p className="text-xs text-destructive">{t(errors.newPassword.message)}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="pw-confirm" className="block text-xs font-semibold text-foreground">
            {t('profile.confirmPassword')}
          </label>
          <Input id="pw-confirm" type="password" autoComplete="new-password" {...register('confirmPassword')} />
          {errors.confirmPassword?.message && (
            <p className="text-xs text-destructive">{t(errors.confirmPassword.message)}</p>
          )}
        </div>

        <div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('profile.updatingPassword') : t('profile.updatePassword')}
          </Button>
        </div>
      </form>
    </section>
  )
}
