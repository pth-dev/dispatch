import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { InlineError, toErrorStatus } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  CreateSiteFormSchema,
  type AdminSite,
  type CreateSiteFormValues,
} from '@/schemas/account-system'
import { resolveApiErrorMessage } from '@/services'
import { useAdminSites, useCreateSite, useUpdateSite } from '../api/admin-system'
import type { AdminNotice } from './AdminUserFormModal'

type SitesManagerSectionProps = {
  onNotify: (notice: AdminNotice) => void
}

function SiteRow({
  site,
  disabled,
  onToggleActive,
}: {
  site: AdminSite
  disabled: boolean
  onToggleActive: (site: AdminSite, nextActive: boolean) => void
}) {
  const { t } = useTranslation()
  return (
    <tr className="hover:bg-secondary/50">
      <td className="px-3 py-2 font-medium text-primary">{site.code}</td>
      <td className="px-3 py-2 text-foreground">{site.name || '—'}</td>
      <td className="px-3 py-2 text-muted-foreground">{site.vn || '—'}</td>
      <td className="px-3 py-2 text-right">
        <Checkbox
          aria-label={`${site.code} - ${t('account.system.sites.active')}`}
          checked={site.active}
          disabled={disabled || site.builtin}
          onCheckedChange={(checked) => onToggleActive(site, Boolean(checked))}
        />
      </td>
    </tr>
  )
}

export function SitesManagerSection({ onNotify }: SitesManagerSectionProps) {
  const { t, i18n } = useTranslation()
  const sitesQuery = useAdminSites(true)
  const createMutation = useCreateSite()
  const updateMutation = useUpdateSite()

  const form = useForm<CreateSiteFormValues>({
    resolver: zodResolver(CreateSiteFormSchema),
    defaultValues: { code: '', name: '', vn: '' },
  })

  const onSubmit = async (values: CreateSiteFormValues) => {
    try {
      await createMutation.mutateAsync(values)
      form.reset()
      onNotify({ tone: 'success', text: t('account.system.sites.created') })
    } catch (error) {
      onNotify({ tone: 'error', text: resolveApiErrorMessage(error, t, i18n.language) })
    }
  }

  const handleToggle = async (site: AdminSite, nextActive: boolean) => {
    try {
      await updateMutation.mutateAsync({
        code: site.code,
        name: site.name,
        vn: site.vn,
        active: nextActive,
      })
      onNotify({ tone: 'success', text: t('account.system.sites.updated') })
    } catch (error) {
      onNotify({ tone: 'error', text: resolveApiErrorMessage(error, t, i18n.language) })
    }
  }

  const { errors } = form.formState
  const sites = sitesQuery.data ?? []

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="size-4 text-primary" aria-hidden="true" />
        <h3 className="text-base font-semibold text-foreground">{t('account.system.sites.title')}</h3>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-2 sm:grid-cols-4"
        noValidate
      >
        <div>
          <Input
            maxLength={20}
            aria-label={t('account.system.sites.code')}
            aria-invalid={Boolean(errors.code)}
            placeholder={t('account.system.sites.code')}
            {...form.register('code')}
          />
          {errors.code?.message && (
            <p className="mt-1 text-xs text-destructive">{t(errors.code.message)}</p>
          )}
        </div>
        <div>
          <Input
            maxLength={60}
            aria-label={t('account.system.sites.name')}
            aria-invalid={Boolean(errors.name)}
            placeholder={t('account.system.sites.name')}
            {...form.register('name')}
          />
          {errors.name?.message && (
            <p className="mt-1 text-xs text-destructive">{t(errors.name.message)}</p>
          )}
        </div>
        <div>
          <Input
            maxLength={80}
            aria-label={t('account.system.sites.vnName')}
            aria-invalid={Boolean(errors.vn)}
            placeholder={t('account.system.sites.vnName')}
            {...form.register('vn')}
          />
          {errors.vn?.message && (
            <p className="mt-1 text-xs text-destructive">{t(errors.vn.message)}</p>
          )}
        </div>
        <Button type="submit" disabled={createMutation.isPending}>
          <Plus className="size-4" aria-hidden="true" />
          <span>{t('account.system.sites.addBtn')}</span>
        </Button>
      </form>

      {sitesQuery.isLoading ? (
        <div role="status" className="h-28 motion-safe:animate-pulse rounded-lg border border-border bg-secondary">
          <span className="sr-only">{t('common.loading')}</span>
        </div>
      ) : sitesQuery.isError ? (
        <InlineError
          status={toErrorStatus(sitesQuery.error)}
          onRetry={() => void sitesQuery.refetch()}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary text-left text-xs font-semibold text-primary">
                <th className="px-3 py-2">{t('account.system.sites.code')}</th>
                <th className="px-3 py-2">{t('account.system.sites.name')}</th>
                <th className="px-3 py-2">{t('account.system.sites.vnName')}</th>
                <th className="px-3 py-2 text-right">{t('account.system.sites.active')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {sites.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-xs text-muted-foreground">
                    {t('common.empty')}
                  </td>
                </tr>
              ) : (
                sites.map((site) => (
                  <SiteRow
                    key={site.code}
                    site={site}
                    disabled={updateMutation.isPending}
                    onToggleActive={(s, active) => void handleToggle(s, active)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
