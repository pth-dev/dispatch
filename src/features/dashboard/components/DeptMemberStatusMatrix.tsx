import { Link } from 'react-router'
import { Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { APP_ROUTES } from '@/constants/app-routes'
import { cn } from '@/utils/cn'
import { buildTaskDrilldownUrl, type DeptMemberStatusRow } from '../utils/dashboard-charts'

interface DeptMemberStatusMatrixProps {
  selectedDept: string
  memberRows: readonly DeptMemberStatusRow[]
}

function MatrixCellLink({
  count,
  href,
  toneClass,
}: {
  count: number
  href: string
  toneClass?: string
}) {
  if (count <= 0) {
    return <span className="text-muted-foreground/40 tabular-nums">0</span>
  }
  return (
    <Link
      to={href}
      className={cn(
        'inline-block min-w-6 rounded px-1.5 py-0.5 font-semibold tabular-nums transition-colors hover:bg-secondary',
        toneClass ?? 'text-foreground',
      )}
    >
      {count}
    </Link>
  )
}

function MemberStatusTr({
  row,
  department,
}: {
  row: DeptMemberStatusRow
  department?: string
}) {
  const cellUrl = (status?: string) =>
    buildTaskDrilldownUrl(APP_ROUTES.TASKS, {
      scope: 'all',
      department,
      search: row.name,
      status,
    })

  return (
    <tr className="hover:bg-secondary/40">
      <td className="px-3 py-1.5 font-medium text-foreground whitespace-nowrap">
        <Link to={cellUrl()} className="hover:text-primary hover:underline">
          {row.name}
        </Link>
      </td>
      <td className="px-2 py-1.5 text-right">
        <MatrixCellLink count={row.overdue} toneClass="text-destructive" href={cellUrl('delayed_pending')} />
      </td>
      <td className="px-2 py-1.5 text-right">
        <MatrixCellLink count={row.inProgress} toneClass="text-primary" href={cellUrl('in_progress')} />
      </td>
      <td className="px-2 py-1.5 text-right">
        <MatrixCellLink count={row.notStarted} href={cellUrl('not_started')} />
      </td>
      <td className="px-2 py-1.5 text-right">
        <MatrixCellLink count={row.paused} toneClass="text-muted-foreground" href={cellUrl('paused')} />
      </td>
      <td className="px-2 py-1.5 text-right">
        <MatrixCellLink count={row.completed} toneClass="text-success" href={cellUrl('completed')} />
      </td>
      <td className="px-3 py-1.5 text-right">
        <MatrixCellLink count={row.open} href={cellUrl('incomplete')} />
      </td>
    </tr>
  )
}

export function DeptMemberStatusMatrix({ selectedDept, memberRows }: DeptMemberStatusMatrixProps) {
  const { t } = useTranslation()
  const visibleMembers = memberRows.slice(0, 12)
  const department = selectedDept || undefined

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Users className="size-3.5 text-primary" aria-hidden="true" />
          <span>{t('dashboard.dept.statusMatrixTitle')}</span>
          <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {t('dashboard.scopeBadge.live')}
          </span>
        </h3>
        <span className="text-[11px] text-muted-foreground">
          {t('dashboard.dept.statusMatrixHint')}
        </span>
      </div>

      {visibleMembers.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          {t('dashboard.dept.peopleLoadEmpty')}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-muted-foreground">
                <th className="px-3 py-2 text-left font-semibold">{t('dashboard.posts.cols.person')}</th>
                <th className="px-2 py-2 text-right font-semibold text-destructive">
                  {t('dashboard.dept.metrics.delayed')}
                </th>
                <th className="px-2 py-2 text-right font-semibold text-primary">
                  {t('dashboard.dept.metrics.progress')}
                </th>
                <th className="px-2 py-2 text-right font-semibold">{t('dashboard.dept.metrics.notStarted')}</th>
                <th className="px-2 py-2 text-right font-semibold">{t('dashboard.dept.metrics.paused')}</th>
                <th className="px-2 py-2 text-right font-semibold text-success">
                  {t('dashboard.dept.metrics.completed')}
                </th>
                <th className="px-3 py-2 text-right font-semibold">{t('dashboard.dept.metrics.openTotal')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleMembers.map((row) => (
                <MemberStatusTr key={row.name} row={row} department={department} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
