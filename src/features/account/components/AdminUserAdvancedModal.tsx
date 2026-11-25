import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import {
  ConvertToAdFormSchema,
  ConvertToLocalFormSchema,
  MergeAccountFormSchema,
  type AdminUser,
  type ConvertToAdFormValues,
  type ConvertToLocalFormValues,
  type MergeAccountFormValues,
  type MergePreviewResponse,
} from '@/schemas/account'
import { resolveApiErrorMessage } from '@/services'
import { useConvertAuthSource, useMergeAccounts, useMergePreview } from '../api/admin-users'
import type { AdminNotice } from './AdminUserFormModal'

type AdminUserAdvancedModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: AdminUser
  onNotify: (notice: AdminNotice) => void
}

const LABEL_CLS = 'block text-xs font-semibold text-foreground'

export function AdminUserAdvancedModal({
  open,
  onOpenChange,
  target,
  onNotify,
}: AdminUserAdvancedModalProps) {
  const { t, i18n } = useTranslation()
  const convertMutation = useConvertAuthSource()
  const previewMutation = useMergePreview()
  const mergeMutation = useMergeAccounts()
  const isLocal = target.auth_source !== 'ad'
  const [preview, setPreview] = React.useState<MergePreviewResponse | null>(null)

  const adForm = useForm<ConvertToAdFormValues>({
    resolver: zodResolver(ConvertToAdFormSchema),
    defaultValues: { ad_sam: target.username, use_ad_username: true },
  })

  const localForm = useForm<ConvertToLocalFormValues>({
    resolver: zodResolver(ConvertToLocalFormSchema),
    defaultValues: { password: '', enable: true },
  })

  const mergeForm = useForm<MergeAccountFormValues>({
    resolver: zodResolver(MergeAccountFormSchema),
    defaultValues: { fromUsername: '', disableSource: true },
  })

  const handleConvertToAd = async (values: ConvertToAdFormValues) => {
    try {
      const res = await convertMutation.mutateAsync({
        id: target.id,
        auth_source: 'ad',
        ad_sam: values.ad_sam,
        use_ad_username: values.use_ad_username,
      })
      if (res.conflict && res.existing) {
        onNotify({
          tone: 'warning',
          text: res.message || t('account.admin.advanced.conflictHint'),
        })
        mergeForm.setValue('fromUsername', res.existing.username)
        setPreview(null)
        return
      }
      onNotify({ tone: 'success', text: t('account.admin.toast.authConverted') })
      onOpenChange(false)
    } catch (error) {
      onNotify({ tone: 'error', text: resolveApiErrorMessage(error, t, i18n.language) })
    }
  }

  const handleConvertToLocal = async (values: ConvertToLocalFormValues) => {
    try {
      await convertMutation.mutateAsync({
        id: target.id,
        auth_source: 'local',
        password: values.password,
        enable: values.enable,
      })
      onNotify({ tone: 'success', text: t('account.admin.toast.authConverted') })
      onOpenChange(false)
    } catch (error) {
      onNotify({ tone: 'error', text: resolveApiErrorMessage(error, t, i18n.language) })
    }
  }

  const handlePreview = async (values: MergeAccountFormValues) => {
    try {
      const data = await previewMutation.mutateAsync({
        targetId: target.id,
        fromUsername: values.fromUsername,
      })
      setPreview(data)
    } catch (error) {
      onNotify({ tone: 'error', text: resolveApiErrorMessage(error, t, i18n.language) })
    }
  }

  const handleMerge = async () => {
    const values = mergeForm.getValues()
    if (!values.fromUsername.trim()) return
    try {
      await mergeMutation.mutateAsync({
        targetId: target.id,
        from: values.fromUsername.trim(),
        disable_source: values.disableSource,
      })
      onNotify({ tone: 'success', text: t('account.admin.toast.merged') })
      onOpenChange(false)
    } catch (error) {
      onNotify({ tone: 'error', text: resolveApiErrorMessage(error, t, i18n.language) })
    }
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title={t('account.admin.advanced.title')}
      description={`${target.fullname || target.username} (${target.username})`}
      footer={
        <div className="flex w-full justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="space-y-3 rounded-lg border border-border p-4">
          <h4 className="text-sm font-semibold text-foreground">
            {isLocal
              ? t('account.admin.advanced.convertToAd')
              : t('account.admin.advanced.convertToLocal')}
          </h4>
          {isLocal ? (
            <form onSubmit={adForm.handleSubmit(handleConvertToAd)} className="space-y-3" noValidate>
              <div className="space-y-1.5">
                <label htmlFor="adv-ad-sam" className={LABEL_CLS}>
                  {t('account.admin.advanced.adSam')}
                </label>
                <Input
                  id="adv-ad-sam"
                  aria-invalid={Boolean(adForm.formState.errors.ad_sam)}
                  {...adForm.register('ad_sam')}
                />
                {adForm.formState.errors.ad_sam?.message && (
                  <p className="text-xs text-destructive">
                    {t(adForm.formState.errors.ad_sam.message)}
                  </p>
                )}
              </div>
              <Controller
                control={adForm.control}
                name="use_ad_username"
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-xs text-foreground">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(Boolean(v))}
                    />
                    <span>{t('account.admin.advanced.useAdUsername')}</span>
                  </label>
                )}
              />
              <Button type="submit" size="sm" disabled={convertMutation.isPending}>
                {t('account.admin.advanced.convertBtn')}
              </Button>
            </form>
          ) : (
            <form
              onSubmit={localForm.handleSubmit(handleConvertToLocal)}
              className="space-y-3"
              noValidate
            >
              <div className="space-y-1.5">
                <label htmlFor="adv-local-pwd" className={LABEL_CLS}>
                  {t('account.admin.fields.password')}
                </label>
                <Input
                  id="adv-local-pwd"
                  type="password"
                  aria-invalid={Boolean(localForm.formState.errors.password)}
                  {...localForm.register('password')}
                />
                {localForm.formState.errors.password?.message && (
                  <p className="text-xs text-destructive">
                    {t(localForm.formState.errors.password.message)}
                  </p>
                )}
              </div>
              <Controller
                control={localForm.control}
                name="enable"
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-xs text-foreground">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(Boolean(v))}
                    />
                    <span>{t('account.admin.advanced.enableAfterConvert')}</span>
                  </label>
                )}
              />
              <Button type="submit" size="sm" disabled={convertMutation.isPending}>
                {t('account.admin.advanced.convertBtn')}
              </Button>
            </form>
          )}
        </section>

        <section className="space-y-3 rounded-lg border border-border p-4">
          <h4 className="text-sm font-semibold text-foreground">
            {t('account.admin.advanced.mergeTitle')}
          </h4>
          <p className="text-xs text-muted-foreground">{t('account.admin.advanced.mergeHint')}</p>
          <form onSubmit={mergeForm.handleSubmit(handlePreview)} className="space-y-2" noValidate>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <label htmlFor="adv-merge-from" className={LABEL_CLS}>
                  {t('account.admin.advanced.sourceUsername')}
                </label>
                <Input
                  id="adv-merge-from"
                  aria-invalid={Boolean(mergeForm.formState.errors.fromUsername)}
                  {...mergeForm.register('fromUsername', {
                    onChange: () => setPreview(null),
                  })}
                />
              </div>
              <Button type="submit" variant="outline" disabled={previewMutation.isPending}>
                {t('account.admin.advanced.previewBtn')}
              </Button>
            </div>
            {mergeForm.formState.errors.fromUsername?.message && (
              <p className="text-xs text-destructive">
                {t(mergeForm.formState.errors.fromUsername.message)}
              </p>
            )}
          </form>

          {preview && (
            <div className="space-y-2 rounded-md border border-border bg-secondary p-3 text-xs">
              <div className="font-medium text-foreground">
                {preview.from?.username ?? mergeForm.getValues('fromUsername')} →{' '}
                {preview.to?.username ?? target.username}
              </div>
              <div className="flex flex-wrap gap-3 text-muted-foreground">
                {Object.entries(preview.counts).map(([k, v]) => (
                  <span key={k}>
                    {k}: <strong className="text-foreground">{v}</strong>
                  </span>
                ))}
              </div>
              <Controller
                control={mergeForm.control}
                name="disableSource"
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-foreground">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(Boolean(v))}
                    />
                    <span>{t('account.admin.advanced.disableSource')}</span>
                  </label>
                )}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={mergeMutation.isPending}
                onClick={() => void handleMerge()}
              >
                {t('account.admin.advanced.confirmMerge')}
              </Button>
            </div>
          )}
        </section>
      </div>
    </ResponsiveModal>
  )
}
