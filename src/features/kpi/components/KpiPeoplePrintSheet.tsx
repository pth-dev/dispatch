import { useTranslation } from 'react-i18next'
import type { SessionUser } from '@/schemas/auth'
import type { RawTask } from '@/schemas/task'
import { formatShortDateTime } from '../utils/kpi-export'
import type { KpiBasis, PeopleKpiRow } from '../utils/kpi-people-domain'
import { KpiPersonTaskDetails } from './KpiPersonTaskDetails'

export interface KpiPeoplePrintSheetProps {
  rows: readonly PeopleKpiRow[]
  taskMap: ReadonlyMap<string, RawTask>
  basis: KpiBasis
  startStr: string
  endStr: string
  deptLabel: string
  query: string
  withDetail: boolean
  user: SessionUser | null
  resolveDeptLabel: (raw: string) => string
}

function fmtPct(value: number, total: number): string {
  return total > 0 ? `${value}%` : 'N/A'
}

export function KpiPeoplePrintSheet({
  rows,
  taskMap,
  basis,
  startStr,
  endStr,
  deptLabel,
  query,
  withDetail,
  user,
  resolveDeptLabel,
}: KpiPeoplePrintSheetProps) {
  const { t } = useTranslation()
  if (rows.length === 0) return null

  return (
    <section className="hidden space-y-4 print:block">
      <div className="border-b-2 border-foreground pb-2 text-center">
        <h1 className="text-lg font-bold text-foreground">{t('kpi.title')}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('kpi.print.filterLine', {
            start: startStr || '-',
            end: endStr || '-',
            basis: t(`kpi.basis.${basis}`),
            dept: deptLabel,
            query: query ? ` | ${query}` : '',
          })}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {t('kpi.print.metaLine', {
            printer: user ? `${user.fullname || user.username} (${user.username})` : '-',
            time: formatShortDateTime(new Date()),
            count: rows.length,
          })}
        </p>
      </div>

      <p className="text-[11px] text-muted-foreground">{t('kpi.formulaBanner')}</p>

      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="border border-border px-1.5 py-1 text-left">#</th>
            <th className="border border-border px-1.5 py-1 text-left">{t('kpi.table.username')}</th>
            <th className="border border-border px-1.5 py-1 text-left">{t('kpi.table.fullname')}</th>
            <th className="border border-border px-1.5 py-1 text-left">{t('kpi.table.dept')}</th>
            <th className="border border-border px-1.5 py-1 text-right">{t('kpi.table.total')}</th>
            <th className="border border-border px-1.5 py-1 text-right">{t('kpi.table.completed')}</th>
            <th className="border border-border px-1.5 py-1 text-right">{t('kpi.table.completionRate')}</th>
            <th className="border border-border px-1.5 py-1 text-right">{t('kpi.table.ontime')}</th>
            <th className="border border-border px-1.5 py-1 text-right">{t('kpi.table.ontimeRate')}</th>
            <th className="border border-border px-1.5 py-1 text-right">{t('kpi.table.late')}</th>
            <th className="border border-border px-1.5 py-1 text-right">{t('kpi.table.overdue')}</th>
            <th className="border border-border px-1.5 py-1 text-right">{t('kpi.table.paused')}</th>
            <th className="border border-border px-1.5 py-1 text-right">{t('kpi.table.score')}</th>
            <th className="border border-border px-1.5 py-1 text-left">{t('kpi.table.grade')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.key}>
              <td className="border border-border px-1.5 py-1">{i + 1}</td>
              <td className="border border-border px-1.5 py-1">{r.username}</td>
              <td className="border border-border px-1.5 py-1">
                {r.isUnregistered ? t('kpi.unregistered') : r.fullname || '-'}
              </td>
              <td className="border border-border px-1.5 py-1">
                {r.deptRaw ? resolveDeptLabel(r.deptRaw) : '-'}
              </td>
              <td className="border border-border px-1.5 py-1 text-right">{r.total}</td>
              <td className="border border-border px-1.5 py-1 text-right">{r.completed}</td>
              <td className="border border-border px-1.5 py-1 text-right">
                {fmtPct(r.completionRate, r.total)}
              </td>
              <td className="border border-border px-1.5 py-1 text-right">{r.ontime}</td>
              <td className="border border-border px-1.5 py-1 text-right">
                {fmtPct(r.ontimeRate, r.total)}
              </td>
              <td className="border border-border px-1.5 py-1 text-right">
                {r.late} ({fmtPct(r.lateRate, r.total)})
              </td>
              <td className="border border-border px-1.5 py-1 text-right">{r.overdue}</td>
              <td className="border border-border px-1.5 py-1 text-right">{r.paused}</td>
              <td className="border border-border px-1.5 py-1 text-right font-bold">
                {r.score === null ? '-' : r.score}
              </td>
              <td className="border border-border px-1.5 py-1">
                {r.grade.code} {t(`kpi.grade.${r.grade.code}`)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {withDetail &&
        rows.map((r) => (
          <div key={r.key} className="break-inside-avoid space-y-1.5 pt-2">
            <h2 className="text-xs font-bold text-foreground">
              {r.username} {r.isUnregistered ? t('kpi.unregistered') : r.fullname} (
              {r.deptRaw ? resolveDeptLabel(r.deptRaw) : '-'}) — KPI{' '}
              {r.score === null ? '-' : r.score} / {r.grade.code}
            </h2>
            <KpiPersonTaskDetails row={r} taskMap={taskMap} basis={basis} forPrint />
          </div>
        ))}

      <div className="flex justify-between pt-8 text-xs text-foreground">
        <span>{t('kpi.print.signPrepared')}: ____________________</span>
        <span>{t('kpi.print.signReviewed')}: ____________________</span>
        <span>{t('kpi.print.signApproved')}: ____________________</span>
      </div>
    </section>
  )
}
