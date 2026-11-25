import { Link } from 'react-router'
import { Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { APP_ROUTES } from '@/constants/app-routes'
import type { PostDeptOption } from '@/schemas/dashboard'

interface DeptScopeHeaderProps {
  deptLabel: string
  selectedDept: string
  deptOptions: readonly PostDeptOption[]
  includeSub: boolean
  totalVisibleCount: number
  deptTaskCount: number
  deptSetSize: number
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
  onDeptChange,
  onIncludeSubChange,
}: DeptScopeHeaderProps) {
  const { t } = useTranslation()

  return (
    <section className="rounded-xl border border-border bg-card p-4">
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

    </section>
  )
}
