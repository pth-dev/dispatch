import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import type { SessionUser } from '@/schemas/auth'
import type { RawTask } from '@/schemas/task'
import { formatShortDateTime } from '../utils/kpi-export'
import { formatKpiPct, type KpiBasis, type PeopleKpiRow } from '../utils/kpi-people-domain'
import { KpiPersonTaskDetails } from './KpiPersonTaskDetails'

export type KpiPeoplePrintSheetProps = {
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

function buildPrintColumns(
  resolveDeptLabel: (raw: string) => string,
  t: (key: string) => string,
): ColumnDef<PeopleKpiRow>[] {
  return [
    { id: 'rank', header: '#', cell: ({ row }) => row.index + 1 },
    { id: 'username', header: t('kpi.table.username'), cell: ({ row }) => row.original.username },
    {
      id: 'fullname',
      header: t('kpi.table.fullname'),
      cell: ({ row }) =>
        row.original.isUnregistered ? t('kpi.unregistered') : row.original.fullname || '-',
    },
    {
      id: 'dept',
      header: t('kpi.table.dept'),
      cell: ({ row }) => (row.original.deptRaw ? resolveDeptLabel(row.original.deptRaw) : '-'),
    },
    {
      id: 'total',
      header: t('kpi.table.total'),
      meta: { align: 'right' },
      cell: ({ row }) => row.original.total,
    },
    {
      id: 'completed',
      header: t('kpi.table.completed'),
      meta: { align: 'right' },
      cell: ({ row }) => row.original.completed,
    },
    {
      id: 'completionRate',
      header: t('kpi.table.completionRate'),
      meta: { align: 'right' },
      cell: ({ row }) => formatKpiPct(row.original.completionRate, row.original.total),
    },
    {
      id: 'ontime',
      header: t('kpi.table.ontime'),
      meta: { align: 'right' },
      cell: ({ row }) => row.original.ontime,
    },
    {
      id: 'ontimeRate',
      header: t('kpi.table.ontimeRate'),
      meta: { align: 'right' },
      cell: ({ row }) => formatKpiPct(row.original.ontimeRate, row.original.total),
    },
    {
      id: 'late',
      header: t('kpi.table.late'),
      meta: { align: 'right' },
      cell: ({ row }) =>
        `${row.original.late} (${formatKpiPct(row.original.lateRate, row.original.total)})`,
    },
    {
      id: 'overdue',
      header: t('kpi.table.overdue'),
      meta: { align: 'right' },
      cell: ({ row }) => row.original.overdue,
    },
    {
      id: 'paused',
      header: t('kpi.table.paused'),
      meta: { align: 'right' },
      cell: ({ row }) => row.original.paused,
    },
    {
      id: 'score',
      header: t('kpi.table.score'),
      meta: { align: 'right', cellClassName: 'font-bold' },
      cell: ({ row }) => (row.original.score === null ? '-' : row.original.score),
    },
    {
      id: 'grade',
      header: t('kpi.table.grade'),
      cell: ({ row }) =>
        `${row.original.grade.code} ${t(`kpi.grade.${row.original.grade.code}`)}`,
    },
  ]
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
}: KpiPeoplePrintSheetProps): React.ReactElement | null {
  const { t } = useTranslation()
  if (rows.length === 0) return null

  const columns = buildPrintColumns(resolveDeptLabel, t)

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

      <DataTable
        variant="print"
        data={rows}
        columns={columns}
        keyExtractor={(r) => r.key}
      />

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
