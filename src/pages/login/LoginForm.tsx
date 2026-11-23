import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { LoginFormSchema, type LoginFormValues } from '@/schemas/auth'

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void>
  onSwitchToRegister: () => void
}

export function LoginForm({ onSubmit, onSwitchToRegister }: LoginFormProps) {
  const { t } = useTranslation()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: { username: '', password: '', remember: false },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="login-username" className="block text-xs font-semibold text-foreground">
          {t('login.account')}
        </label>
        <Input
          id="login-username"
          type="text"
          autoComplete="username"
          placeholder={t('login.accountPlaceholder')}
          aria-invalid={Boolean(errors.username)}
          aria-describedby={errors.username?.message ? 'login-username-error' : undefined}
          {...register('username')}
        />
        {errors.username?.message && (
          <p id="login-username-error" className="text-xs text-destructive">
            {t(errors.username.message)}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="login-password" className="block text-xs font-semibold text-foreground">
          {t('login.password')}
        </label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder={t('login.passwordPlaceholder')}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password?.message ? 'login-password-error' : undefined}
          {...register('password')}
        />
        {errors.password?.message && (
          <p id="login-password-error" className="text-xs text-destructive">
            {t(errors.password.message)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name="remember"
          render={({ field }) => (
            <Checkbox
              id="login-remember"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
          )}
        />
        <label
          htmlFor="login-remember"
          className="text-xs text-foreground cursor-pointer select-none"
        >
          {t('login.rememberMe')}
        </label>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t('login.submitting') : t('login.submit')}
      </Button>

      <div className="pt-1 text-center">
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="min-h-11 lg:min-h-8 rounded px-2 text-xs font-medium text-primary hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t('register.openLink')}
        </button>
      </div>
    </form>
  )
}
