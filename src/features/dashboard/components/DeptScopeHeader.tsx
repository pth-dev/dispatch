import { Link } from 'react-router'
import { Building2, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HorizontalBarRow } from '@/components/ui/horizontal-bar-row'
import { MetricCard } from '@/components/ui/metric-card'
import { APP_ROUTES } from '@/constants/app-routes'
import type { PostDeptOption } from '@/schemas/dashboard'
import type { DeptTaskSummary } from '@/utils/kpi-domain'

interface DeptScopeHeaderProps {
  deptLabel: string
  selectedDept: string
  deptOptions: readonly PostDeptOption[]
  includeSub: boolean
  totalVisibleCount: number
  deptTaskCount: number
  deptSetSize: number
  summary: DeptTaskSummary
  onDeptChange: (dept: string) => void
  onIncludeSubChange: (checked: boolean) => void
}

const SELECT_CLASS =
  'flex h-11 lg:h-9 min-w-52 rounded-md border border-input bg-card px-3 py-1.5 text-xs font-medium text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

export function DeptScopeHeader({
  deptLabel,
  selectedDept,
  deptOptions,
  includeSub,
  totalVisibleCount,
  deptTaskCount,
  deptSetSize,
  summary,
  onDeptChange,
  onIncludeSubChange,
}: DeptScopeHeaderProps) {
  const { t } = useTranslation()
  const topPeople = summary.people.slice(0, 10)
  const maxOpen = Math.max(1, ...topPeople.map((p) => p.open))

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-0.5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Building2 className="size-4 text-primary" aria-hidden="true" />
            <span>{deptLabel || selectedDept || '—'}</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.dept.scopeSummary', {
              depts: deptSetSize,
              matched: deptTaskCount,
              total: totalVisibleCount,
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {deptOptions.length > 0 && (
            <select
              aria-label={t('dashboard.dept.selectLabel')}
              value={selectedDept}
              onChange={(e) => onDeptChange(e.target.value)}
              className={SELECT_CLASS}
            >
              {deptOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.path ? `${opt.label} (${opt.path})` : opt.label}
                </option>
              ))}
            </select>
          )}

          <label className="inline-flex min-h-11 lg:min-h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground cursor-pointer select-none">
            <Checkbox
              checked={includeSub}
              onCheckedChange={(checked) => onIncludeSubChange(checked === true)}
            />
            <span>{t('dashboard.dept.includeSub')}</span>
          </label>

          <Button asChild variant="outline" size="sm">
            <Link to={APP_ROUTES.ACCOUNT}>{t('dashboard.dept.viewScopeLink')}</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:col-span-2">
          <MetricCard label={t('dashboard.dept.metrics.total')} value={summary.total} />
          <MetricCard label={t('dashboard.dept.metrics.progress')} value={summary.progress} tone="primary" />
          <MetricCard label={t('dashboard.dept.metrics.notStarted')} value={summary.notStarted} />
          <MetricCard
            label={t('dashboard.dept.metrics.delayed')}
            value={summary.delayed}
            tone={summary.delayed > 0 ? 'destructive' : 'success'}
          />
          <MetricCard label={t('dashboard.dept.metrics.ontime')} value={summary.ontime} tone="success" />
          <MetricCard label={t('dashboard.dept.metrics.late')} value={summary.late} tone="warning" />
          <MetricCard label={t('dashboard.dept.metrics.dueToday')} value={summary.dueToday} tone="warning" />
          <MetricCard label={t('dashboard.dept.metrics.paused')} value={summary.paused} />
        </div>

        <div className="rounded-lg border border-border p-3 space-y-2">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Users className="size-3.5 text-primary" aria-hidden="true" />
            <span>{t('dashboard.dept.peopleLoadTitle')}</span>
          </h3>
          {topPeople.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              {t('dashboard.dept.peopleLoadEmpty')}
            </p>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-1">
              {topPeople.map((person) => (
                <HorizontalBarRow
                  key={person.name}
                  label={person.name}
                  percent={Math.round((person.delayed / maxOpen) * 100)}
                  tone="destructive"
                  secondaryPercent={Math.round(((person.open - person.delayed) / maxOpen) * 100)}
                  secondaryTone="primary"
                  valueText={`${person.open}/${person.total}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
