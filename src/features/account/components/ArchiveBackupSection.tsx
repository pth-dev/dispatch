import { zodResolver } from '@hookform/resolvers/zod'
import { Download, Package } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { InlineError, toErrorStatus } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  ArchiveRunFormSchema,
  type ArchiveHistoryItem,
  type ArchiveRunFormValues,
} from '@/schemas/account-system'
import { resolveApiErrorMessage } from '@/services'
import { useArchiveInfo, useRunArchive } from '../api/admin-system'
import type { AdminNotice } from './AdminUserFormModal'

type ArchiveBackupSectionProps = {
  onNotify: (notice: AdminNotice) => void
}

const SELECT_CLS =
  'h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function ArchiveHistoryRow({ item }: { item: ArchiveHistoryItem }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground">{item.name}</div>
        <div className="text-muted-foreground">
          {item.createdAt} · {formatBytes(item.sizeBytes)}
        </div>
      </div>
      {item.downloadUrl && (
        <a
          href={item.downloadUrl}
          download
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          <Download className="size-3.5" aria-hidden="true" />
          <span>{t('account.system.archive.download')}</span>
        </a>
      )}
    </div>
  )
}

export function ArchiveBackupSection({ onNotify }: ArchiveBackupSectionProps) {
  const { t, i18n } = useTranslation()
  const infoQuery = useArchiveInfo(true)
  const runMutation = useRunArchive()

  const form = useForm<ArchiveRunFormValues>({
    resolver: zodResolver(ArchiveRunFormSchema),
    defaultValues: {
      targetPath: '',
      format: 'zip',
      includeMessages: true,
      includeTodos: true,
      includeUsers: true,
    },
    values: infoQuery.data
      ? {
          targetPath: infoQuery.data.defaultPath || '',
          format: 'zip',
          includeMessages: true,
          includeTodos: true,
          includeUsers: true,
        }
      : undefined,
    resetOptions: { keepDirtyValues: true },
  })

  const onSubmit = async (values: ArchiveRunFormValues) => {
    try {
      const res = await runMutation.mutateAsync({
        targetPath: values.targetPath,
        format: values.format,
        include: {
          messages: values.includeMessages,
          todos: values.includeTodos,
          users: values.includeUsers,
        },
      })
      onNotify({
        tone: 'success',
        text: t('account.system.archive.completed', { name: res.name || res.path }),
      })
    } catch (error) {
      onNotify({ tone: 'error', text: resolveApiErrorMessage(error, t, i18n.language) })
    }
  }

  const { errors } = form.formState

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div>
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Package className="size-4 text-primary" aria-hidden="true" />
          <span>{t('account.system.archive.title')}</span>
        </h3>
        <p className="text-xs text-muted-foreground">{t('account.system.archive.subtitle')}</p>
      </div>

      {infoQuery.isLoading ? (
        <div role="status" className="h-28 motion-safe:animate-pulse rounded-lg border border-border bg-secondary">
          <span className="sr-only">{t('common.loading')}</span>
        </div>
      ) : infoQuery.isError ? (
        <InlineError
          status={toErrorStatus(infoQuery.error)}
          onRetry={() => void infoQuery.refetch()}
        />
      ) : (
        <>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3" noValidate>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="md:col-span-2">
                <Input
                  aria-label={t('account.system.archive.targetPath')}
                  aria-invalid={Boolean(errors.targetPath)}
                  placeholder={t('account.system.archive.targetPath')}
                  {...form.register('targetPath')}
                />
                {errors.targetPath?.message && (
                  <p className="mt-1 text-xs text-destructive">{t(errors.targetPath.message)}</p>
                )}
              </div>
              <select
                aria-label={t('account.system.archive.format')}
                className={SELECT_CLS}
                {...form.register('format')}
              >
                <option value="zip">ZIP</option>
                <option value="folder">{t('account.system.archive.folderFormat')}</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4 text-xs text-foreground">
                <Controller
                  control={form.control}
                  name="includeMessages"
                  render={({ field }) => (
                    <label className="flex items-center gap-1.5">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                      />
                      <span>{t('nav.messages')}</span>
                    </label>
                  )}
                />
                <Controller
                  control={form.control}
                  name="includeTodos"
                  render={({ field }) => (
                    <label className="flex items-center gap-1.5">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                      />
                      <span>{t('nav.todo')}</span>
                    </label>
                  )}
                />
                <Controller
                  control={form.control}
                  name="includeUsers"
                  render={({ field }) => (
                    <label className="flex items-center gap-1.5">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                      />
                      <span>{t('nav.users')}</span>
                    </label>
                  )}
                />
              </div>

              <Button type="submit" disabled={runMutation.isPending}>
                <Package className="size-4" aria-hidden="true" />
                <span>{t('account.system.archive.runBtn')}</span>
              </Button>
            </div>
          </form>

          {(infoQuery.data?.history.length ?? 0) > 0 && (
            <div className="divide-y divide-border rounded-lg border border-border text-xs">
              {(infoQuery.data?.history ?? []).slice(0, 6).map((item) => (
                <ArchiveHistoryRow key={`${item.name}-${item.createdAt}`} item={item} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
