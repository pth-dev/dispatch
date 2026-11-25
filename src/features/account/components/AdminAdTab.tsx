import * as React from 'react'
import { AlertCircle, CheckCircle2, Download, RefreshCw, Stethoscope } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store'
import { InlineError, toErrorStatus } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { getDeptDisplayName, getSiteDisplayName, useMetaDepts, useMetaSites } from '@/hooks/use-meta'
import type { AdDiagnoseResponse, AdUserItem } from '@/schemas/account-ad'
import { resolveApiErrorMessage } from '@/services'
import { isSuperLike } from '@/utils/permissions'
import {
  useAdDiagnose,
  useAdImport,
  useAdStatus,
  useAdSyncLogs,
  useAdSyncNow,
  useAdUsers,
} from '../api/admin-ad'
import { canWriteAd } from '../utils/admin-permissions'
import { AdminNoticeBanner } from './AdminNoticeBanner'
import type { AdminNotice } from './AdminUserFormModal'

const SELECT_CLS =
  'h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30'

function getAdAccountId(u: AdUserItem): string {
  return u.sam || u.sAMAccountName || u.username
}

export function AdminAdTab() {
  const { t, i18n } = useTranslation()
  const actor = useAppStore((s) => s.user)
  const canWrite = canWriteAd(actor)
  const isSuper = isSuperLike(actor)

  const statusQuery = useAdStatus(true)
  const usersQuery = useAdUsers(Boolean(statusQuery.data?.available))
  const logsQuery = useAdSyncLogs(isSuper)
  const deptsQuery = useMetaDepts()
  const sitesQuery = useMetaSites()

  const importMutation = useAdImport()
  const syncMutation = useAdSyncNow()
  const diagnoseMutation = useAdDiagnose()

  const [notice, setNotice] = React.useState<AdminNotice | null>(null)
  const [search, setSearch] = React.useState('')
  const [selectedSams, setSelectedSams] = React.useState<Set<string>>(() => new Set())
  const [importDept, setImportDept] = React.useState(actor?.dept ?? '')
  const [importSite, setImportSite] = React.useState(actor?.site ?? '')
  const [diagnoseResult, setDiagnoseResult] = React.useState<AdDiagnoseResponse | null>(null)

  const effectiveSite = importSite || sitesQuery.data?.sites[0]?.value || ''

  const adUsers = usersQuery.data ?? []
  const filtered = adUsers.filter((u) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    const sam = getAdAccountId(u).toLowerCase()
    const name = (u.fullname || u.displayName).toLowerCase()
    const dept = (u.dept || u.department || u.ou).toLowerCase()
    return sam.includes(q) || name.includes(q) || dept.includes(q)
  })

  const toggleSam = (sam: string) => {
    setSelectedSams((prev) => {
      const next = new Set(prev)
      if (next.has(sam)) next.delete(sam)
      else next.add(sam)
      return next
    })
  }

  const handleImport = async () => {
    if (selectedSams.size === 0) return
    try {
      const res = await importMutation.mutateAsync({
        accounts: Array.from(selectedSams),
        dept: importDept,
        site: effectiveSite,
        role: 'user',
        status: 'Approved',
        link_existing: true,
        auto_dept: !importDept,
      })
      setNotice({
        tone: 'success',
        text: t('account.ad.importDone', {
          created: res.created,
          linked: res.linked,
          failed: res.failed,
        }),
      })
      setSelectedSams(new Set())
    } catch (error) {
      setNotice({ tone: 'error', text: resolveApiErrorMessage(error, t, i18n.language) })
    }
  }

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync()
      setNotice({ tone: 'success', text: t('account.ad.syncTriggered') })
    } catch (error) {
      setNotice({ tone: 'error', text: resolveApiErrorMessage(error, t, i18n.language) })
    }
  }

  const handleDiagnose = async () => {
    try {
      const res = await diagnoseMutation.mutateAsync()
      setDiagnoseResult(res)
    } catch (error) {
      setNotice({ tone: 'error', text: resolveApiErrorMessage(error, t, i18n.language) })
    }
  }

  const columns: ColumnDef<AdUserItem, unknown>[] = [
    ...(canWrite
      ? [
          {
            id: 'select',
            header: '',
            meta: { width: '5%', align: 'center' as const },
            cell: ({ row }: { row: { original: AdUserItem } }) => {
              const sam = getAdAccountId(row.original)
              return (
                <Checkbox
                  aria-label={sam}
                  disabled={row.original.disabled || !sam}
                  checked={selectedSams.has(sam)}
                  onCheckedChange={() => toggleSam(sam)}
                />
              )
            },
          },
        ]
      : []),
    {
      id: 'sam',
      header: t('account.admin.fields.username'),
      meta: { width: '20%' },
      cell: ({ row }) => (
        <span className="font-medium text-primary">{getAdAccountId(row.original) || '—'}</span>
      ),
    },
    {
      id: 'fullname',
      header: t('account.admin.fields.fullname'),
      meta: { width: '25%' },
      cell: ({ row }) => <span>{row.original.fullname || row.original.displayName || '—'}</span>,
    },
    {
      id: 'dept',
      header: t('common.department'),
      meta: { width: '30%' },
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.dept || row.original.department || row.original.ou || '—'}
        </span>
      ),
    },
    {
      id: 'status',
      header: t('common.status'),
      meta: { width: '20%' },
      cell: ({ row }) => (
        <span className={row.original.disabled ? 'text-destructive' : 'text-success'}>
          {row.original.disabled
            ? t('account.admin.statuses.Disabled')
            : row.original.imported
              ? t('account.ad.imported')
              : t('account.ad.available')}
        </span>
      ),
    },
  ]

  if (statusQuery.isLoading) {
    return (
      <div role="status" className="space-y-4">
        <span className="sr-only">{t('common.loading')}</span>
        <div className="h-28 motion-safe:animate-pulse rounded-xl border border-border bg-card" />
        <div className="h-64 motion-safe:animate-pulse rounded-xl border border-border bg-card" />
      </div>
    )
  }

  if (statusQuery.isError) {
    return (
      <InlineError
        status={toErrorStatus(statusQuery.error)}
        onRetry={() => void statusQuery.refetch()}
      />
    )
  }

  const status = statusQuery.data

  return (
    <div className="space-y-4">
      <AdminNoticeBanner notice={notice} onDismiss={() => setNotice(null)} />

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">{t('account.ad.statusTitle')}</h3>
            <p className="text-xs text-muted-foreground">
              {status?.available
                ? `${status.config?.domain || 'AD'} · ${t('account.ad.syncInterval', {
                    minutes: status.config?.syncMinutes ?? 30,
                  })}`
                : status?.message || t('account.ad.unavailable')}
            </p>
          </div>
          {isSuper && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={diagnoseMutation.isPending}
                onClick={() => void handleDiagnose()}
              >
                <Stethoscope className="size-4" aria-hidden="true" />
                <span>{t('account.ad.diagnose')}</span>
              </Button>
              <Button
                type="button"
                disabled={syncMutation.isPending || !status?.available}
                onClick={() => void handleSync()}
              >
                <RefreshCw
                  className={syncMutation.isPending ? 'size-4 motion-safe:animate-spin' : 'size-4'}
                  aria-hidden="true"
                />
                <span>{t('account.ad.syncNow')}</span>
              </Button>
            </div>
          )}
        </div>

        {status?.localAdAccounts && (
          <div className="flex flex-wrap gap-6 border-t border-border pt-3 text-xs text-muted-foreground">
            <span>
              {t('account.ad.localTotal')}:{' '}
              <strong className="text-foreground">{status.localAdAccounts.total}</strong>
            </span>
            <span>
              {t('account.ad.localDisabled')}:{' '}
              <strong className="text-foreground">{status.localAdAccounts.disabled}</strong>
            </span>
            {status.lastSync?.at && (
              <span>
                {t('account.ad.lastSync')}:{' '}
                <strong className="text-foreground">{status.lastSync.at}</strong>
              </span>
            )}
          </div>
        )}

        {diagnoseResult?.result && (
          <div className="rounded-lg border border-border bg-secondary p-3 text-xs space-y-1">
            <div className="font-semibold text-foreground">
              {diagnoseResult.result.domain} ({diagnoseResult.result.durationMs}ms) —{' '}
              {diagnoseResult.result.goodUrl || '—'}
            </div>
            {diagnoseResult.result.hints.map((hint, idx) => (
              <p key={idx} className="text-muted-foreground">
                • {hint}
              </p>
            ))}
          </div>
        )}
      </div>

      {status?.available && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          {usersQuery.isError ? (
            <InlineError
              status={toErrorStatus(usersQuery.error)}
              onRetry={() => void usersQuery.refetch()}
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Input
                  type="search"
                  aria-label={t('account.ad.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('account.ad.searchPlaceholder')}
                  className="w-full sm:w-64"
                />
                {canWrite && (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label={t('common.department')}
                      className={SELECT_CLS}
                      value={importDept}
                      onChange={(e) => setImportDept(e.target.value)}
                    >
                      <option value="">{t('account.ad.autoDept')}</option>
                      {(deptsQuery.data?.depts ?? []).map((d) => (
                        <option key={d.value} value={d.value}>
                          {getDeptDisplayName(d, i18n.language)}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label={t('account.admin.fields.site')}
                      className={SELECT_CLS}
                      value={effectiveSite}
                      onChange={(e) => setImportSite(e.target.value)}
                    >
                      {(sitesQuery.data?.sites ?? []).map((s) => (
                        <option key={s.value} value={s.value}>
                          {getSiteDisplayName(s, i18n.language)}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      disabled={selectedSams.size === 0 || importMutation.isPending}
                      onClick={() => void handleImport()}
                    >
                      <Download className="size-4" aria-hidden="true" />
                      <span>{t('account.ad.importSelected', { count: selectedSams.size })}</span>
                    </Button>
                  </div>
                )}
              </div>

              <DataTable
                data={filtered}
                columns={columns}
                isLoading={usersQuery.isLoading}
                density="compact"
                enablePagination
                keyExtractor={(row) => getAdAccountId(row) || row.dn}
                emptyMessage={t('common.empty')}
              />
            </>
          )}
        </div>
      )}

      {isSuper && (logsQuery.data?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <h4 className="text-sm font-semibold text-foreground">{t('account.ad.syncLogsTitle')}</h4>
          <div className="divide-y divide-border text-xs">
            {(logsQuery.data ?? []).slice(0, 8).map((log, idx) => (
              <div
                key={`${log.createdAt}-${idx}`}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <span className="font-medium text-foreground">{log.createdAt}</span>
                <span
                  className={
                    log.ok
                      ? 'inline-flex items-center gap-1 text-success'
                      : 'inline-flex items-center gap-1 text-destructive'
                  }
                >
                  {log.ok ? (
                    <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                  )}
                  <span>{log.message || `${log.checked}/${log.ad_total}`}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
