import { useTranslation } from 'react-i18next'
import { MetricCard } from '@/components/ui/metric-card'
import type { PeopleKpiSummary } from '../utils/kpi-people-domain'

export interface KpiPeopleSummaryCardsProps {
  summary: PeopleKpiSummary
}

function fmtPct(value: number | null): string {
  return value === null ? 'N/A' : `${value}%`
}

export function KpiPeopleSummaryCards({ summary }: KpiPeopleSummaryCardsProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8 print:hidden">
      <MetricCard label={t('kpi.summary.people')} value={summary.peopleCount} />
      <MetricCard
        label={t('kpi.summary.total')}
        value={summary.total}
        tone="primary"
      />
      <MetricCard
        label={t('kpi.summary.completionRate')}
        value={fmtPct(summary.completionRate)}
        tone="success"
      />
      <MetricCard
        label={t('kpi.summary.ontimeRate')}
        value={fmtPct(summary.ontimeRate)}
        tone="primary"
      />
      <MetricCard
        label={t('kpi.summary.lateRate')}
        value={fmtPct(summary.lateRate)}
        tone="warning"
      />
      <MetricCard
        label={t('kpi.summary.response1h')}
        value={fmtPct(summary.responseRate)}
      />
      <MetricCard
        label={t('kpi.summary.paused')}
        value={summary.paused}
      />
      <MetricCard
        label={t('kpi.summary.avgScore')}
        value={summary.avgScore === null ? '-' : summary.avgScore}
        tone="primary"
      />
    </div>
  )
}
