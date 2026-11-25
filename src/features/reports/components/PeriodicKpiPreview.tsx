import { useTranslation } from 'react-i18next'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import { MetricCard } from '@/components/ui/metric-card'
import {
  formatRateText,
  type PeriodicKpiDataset,
  type PersonFlowRow,
} from '../utils/periodic-kpi-domain'

export function PeriodicKpiPreview({ dataset }: { dataset: PeriodicKpiDataset }) {
  const { t } = useTranslation()
  const { totalAgg, finAgg, kpiSummary, topPeople } = dataset

  const avgLeadText =
    totalAgg.leadCnt > 0 ? `${Math.round((totalAgg.leadSum / totalAgg.leadCnt) * 10) / 10}` : 'N/A'
  const kpiScoreText =
    kpiSummary.score === null ? '-' : `${kpiSummary.score} (${kpiSummary.grade.code})`
  const finalRateText = kpiSummary.total > 0 ? `${kpiSummary.finalRate}%` : 'N/A'

  const columns: ColumnDef<PersonFlowRow, unknown>[] = [
    {
      id: 'rank',
      header: '#',
      meta: { width: '48px', minWidth: '48px' },
      cell: ({ row }) => <span className="font-medium text-muted-foreground">{row.index + 1}</span>,
    },
    {
      id: 'person',
      header: t('reports.excel.cols.person'),
      meta: { minWidth: '180px' },
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.info.username}
          {row.original.info.fullname ? ` / ${row.original.info.fullname}` : ''}
        </span>
      ),
    },
    {
      id: 'total',
      header: t('reports.excel.cols.total'),
      meta: { align: 'right', minWidth: '72px' },
      cell: ({ row }) => <span>{row.original.agg.total}</span>,
    },
    {
      id: 'ontime',
      header: t('reports.excel.cols.ontime'),
      meta: { align: 'right', minWidth: '80px' },
      cell: ({ row }) => <span className="text-success">{row.original.agg.onTime}</span>,
    },
    {
      id: 'late',
      header: t('reports.excel.cols.late'),
      meta: { align: 'right', minWidth: '76px' },
      cell: ({ row }) => <span className="text-warning">{row.original.agg.late}</span>,
    },
    {
      id: 'delayed',
      header: t('reports.excel.cols.delayed'),
      meta: { align: 'right', minWidth: '80px' },
      cell: ({ row }) => <span className="text-destructive">{row.original.agg.delayed}</span>,
    },
    {
      id: 'rate',
      header: t('reports.excel.cols.rate'),
      meta: { align: 'right', minWidth: '104px' },
      cell: ({ row }) => (
        <span className="font-semibold">
          {formatRateText(row.original.agg.onTime, row.original.agg.total)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard label={t('reports.kpi.cards.total')} value={totalAgg.total} />
        <MetricCard label={t('reports.kpi.cards.finishedInPeriod')} value={finAgg.total} />
        <MetricCard
          label={t('reports.kpi.cards.ontimeRate')}
          value={formatRateText(totalAgg.onTime, totalAgg.total)}
        />
        <MetricCard
          label={t('reports.kpi.cards.completionRate')}
          value={formatRateText(totalAgg.completed, totalAgg.total)}
        />
        <MetricCard label={t('reports.kpi.cards.delayed')} value={totalAgg.delayed} />
        <MetricCard label={t('reports.kpi.cards.late')} value={totalAgg.late} />
        <MetricCard
          label={t('reports.kpi.cards.response1h')}
          value={formatRateText(totalAgg.oneHr, totalAgg.responded)}
        />
        <MetricCard label={t('reports.kpi.cards.avgLeadDays')} value={avgLeadText} />
        <MetricCard label={t('reports.kpi.cards.kpiScore')} value={kpiScoreText} />
        <MetricCard label={t('reports.kpi.cards.finalRate')} value={finalRateText} />
      </div>

      <p className="text-xs text-muted-foreground">{t('reports.kpi.formulaNote')}</p>

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            {t('reports.kpi.topPeopleTitle')}
          </h3>
          <span className="text-xs text-muted-foreground">{t('reports.kpi.topPeopleHint')}</span>
        </div>
        <div className="rounded-lg border border-border bg-card">
          <DataTable
            data={topPeople}
            columns={columns}
            keyExtractor={(row) => row.info.key}
            emptyMessage={t('reports.common.noTasks')}
            variant="embedded"
            density="compact"
          />
        </div>
      </section>
    </div>
  )
}
