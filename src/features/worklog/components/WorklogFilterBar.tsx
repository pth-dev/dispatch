import { Download, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AdminUser } from '@/schemas/account'
import type { WorklogQuickRange } from '../utils/worklog-domain'

const QUICK_RANGES: readonly WorklogQuickRange[] = ['today', 'week', 'month', 'quarter', 'year']

const SELECT_CLS =
  'h-11 lg:h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30'

type WorklogFilterBarProps = {
  canSelectUser: boolean
  isSuper: boolean
  users: readonly AdminUser[]
  selectedUser: string
  startDate: string
  endDate: string
  activeQuick: WorklogQuickRange | null
  rangeInvalid: boolean
  hasRecords: boolean
  isExporting: boolean
  onUserChange: (user: string) => void
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
  onQuickSelect: (range: WorklogQuickRange) => void
  onSearch: () => void
  onExport: () => void
}

export function WorklogFilterBar({
  canSelectUser,
  isSuper,
  users,
  selectedUser,
  startDate,
  endDate,
  activeQuick,
  rangeInvalid,
  hasRecords,
  isExporting,
  onUserChange,
  onStartChange,
  onEndChange,
  onQuickSelect,
  onSearch,
  onExport,
}: WorklogFilterBarProps) {
  const { t } = useTranslation()

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {canSelectUser && (
          <label className="space-y-1 text-xs font-semibold text-foreground md:col-span-2">
            <span>{t('worklog.userLabel')}</span>
            <select
              aria-label={t('worklog.userLabel')}
              className={SELECT_CLS}
              value={selectedUser}
              onChange={(e) => onUserChange(e.target.value)}
            >
              <option value="ALL">
                {isSuper ? t('worklog.allUsersSuper') : t('worklog.allUsersDept')}
              </option>
              {users.map((u) => (
                <option key={u.username} value={u.username}>
                  {u.username} / {u.fullname || u.username}
                  {u.dept ? ` (${u.dept})` : ''}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="space-y-1 text-xs font-semibold text-foreground">
          <span>{t('worklog.startDate')}</span>
          <Input
            type="date"
            aria-label={t('worklog.startDate')}
            value={startDate}
            onChange={(e) => onStartChange(e.target.value)}
          />
        </label>

        <label className="space-y-1 text-xs font-semibold text-foreground">
          <span>{t('worklog.endDate')}</span>
          <Input
            type="date"
            aria-label={t('worklog.endDate')}
            value={endDate}
            onChange={(e) => onEndChange(e.target.value)}
          />
        </label>
      </div>

      {rangeInvalid && (
        <p role="alert" className="text-xs text-destructive">
          {t('worklog.rangeInvalid')}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {QUICK_RANGES.map((range) => (
            <Button
              key={range}
              type="button"
              size="sm"
              variant={activeQuick === range ? 'default' : 'outline'}
              onClick={() => onQuickSelect(range)}
            >
              {t(`worklog.quick.${range}`)}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" disabled={rangeInvalid} onClick={onSearch}>
            <Search className="size-4" aria-hidden="true" />
            <span>{t('common.search')}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!hasRecords || isExporting}
            onClick={onExport}
          >
            <Download className="size-4" aria-hidden="true" />
            <span>{t('worklog.exportExcel')}</span>
          </Button>
        </div>
      </div>
    </section>
  )
}
