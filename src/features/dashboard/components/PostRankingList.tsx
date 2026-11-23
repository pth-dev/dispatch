import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import type { PostStatsRankingRow } from '@/schemas/dashboard'
import { cn } from '@/utils/cn'
import { getKpiGrade, type KpiGradeTone } from '@/utils/kpi-domain'

interface PostRankingListProps {
  rows: readonly PostStatsRankingRow[]
  limit?: number
}

const GRADE_CLASS: Record<KpiGradeTone, string> = {
  success: 'border-success/30 bg-success/10 text-success',
  primary: 'border-primary/30 bg-primary-soft text-primary',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
  muted: 'border-border bg-secondary text-muted-foreground',
}

export function PostRankingList({ rows, limit = 20 }: PostRankingListProps) {
  const { t } = useTranslation()
  const shown = rows.slice(0, limit)

  if (shown.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground">
        {t('dashboard.posts.emptyRanking')}
      </p>
    )
  }

  return (
    <>
      <div className="space-y-2 md:hidden">
        {shown.map((row) => {
          const grade = getKpiGrade(row.kpi_score)
          return (
            <div
              key={`${row.rank}-${row.username}`}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-xs"
            >
              <span
                className={cn(
                  'w-6 shrink-0 text-center font-semibold tabular-nums',
                  row.rank <= 3 ? 'text-warning' : 'text-muted-foreground',
                )}
              >
                {row.rank}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {row.fullname || row.username}{' '}
                  <span className="text-muted-foreground">({row.username})</span>
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {row.dept_label || '—'} · {row.completionRate}% / {row.ontimeRate}%
                </p>
              </div>
              <div className="shrink-0 text-right space-y-0.5">
                <p className="font-semibold text-primary tabular-nums">{row.posts}</p>
                <Badge variant="outline" className={cn('text-[10px]', GRADE_CLASS[grade.tone])}>
                  {row.kpi_score ?? '—'} {grade.code}
                </Badge>
              </div>
            </div>
          )
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-2 pr-2 w-10">#</th>
              <th className="py-2 pr-2">{t('dashboard.posts.cols.person')}</th>
              <th className="py-2 pr-2">{t('dashboard.posts.cols.dept')}</th>
              <th className="py-2 pr-2 text-right">{t('dashboard.posts.cols.posts')}</th>
              <th className="py-2 pr-2 text-right">{t('dashboard.posts.cols.kpiTasks')}</th>
              <th className="py-2 pr-2 text-right">{t('dashboard.posts.cols.completion')}</th>
              <th className="py-2 pr-2 text-right">{t('dashboard.posts.cols.ontime')}</th>
              <th className="py-2 pr-2 text-right">{t('dashboard.posts.cols.score')}</th>
              <th className="py-2">{t('dashboard.posts.cols.grade')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shown.map((row) => {
              const grade = getKpiGrade(row.kpi_score)
              return (
                <tr key={`${row.rank}-${row.username}`} className="hover:bg-secondary/40">
                  <td
                    className={cn(
                      'py-2 pr-2 font-semibold tabular-nums',
                      row.rank <= 3 ? 'text-warning' : 'text-muted-foreground',
                    )}
                  >
                    {row.rank}
                  </td>
                  <td className="py-2 pr-2 font-medium text-foreground">
                    {row.fullname || row.username}{' '}
                    <span className="text-muted-foreground">({row.username})</span>
                  </td>
                  <td className="py-2 pr-2 text-muted-foreground">{row.dept_label || '—'}</td>
                  <td className="py-2 pr-2 text-right font-semibold text-primary tabular-nums">
                    {row.posts}
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums text-muted-foreground">
                    {row.kpi_total}
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums">{row.completionRate}%</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{row.ontimeRate}%</td>
                  <td className="py-2 pr-2 text-right font-semibold tabular-nums">
                    {row.kpi_score ?? '—'}
                  </td>
                  <td className="py-2">
                    <Badge variant="outline" className={cn('text-[10px]', GRADE_CLASS[grade.tone])}>
                      {grade.code}
                    </Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
