import { useTranslation } from 'react-i18next'
import { MetricCard } from '@/components/ui/metric-card'
import type { BriefAggregate } from '../utils/kpi-brief-domain'

export interface KpiBriefSummaryCardsProps {
  aggregate: BriefAggregate
  scopeSubtitle: string
}

export function KpiBriefSummaryCards({
  aggregate,
  scopeSubtitle,
}: KpiBriefSummaryCardsProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <MetricCard
        label={t('kpiBrief.cards.total')}
        value={aggregate.total}
        subtext={scopeSubtitle}
      />
      <MetricCard
        label={t('kpiBrief.cards.completionRate')}
        value={`${aggregate.rate}%`}
        tone="primary"
        subtext={t('kpiBrief.cards.doneSub', {
          done: aggregate.done,
          total: aggregate.total,
        })}
      />
      <MetricCard
        label={t('kpiBrief.cards.ontimeRate')}
        value={`${aggregate.ontimeRate}%`}
        tone="success"
        subtext={t('kpiBrief.cards.ontimeSub', { count: aggregate.ontime })}
      />
      <MetricCard
        label={t('kpiBrief.cards.late')}
        value={aggregate.late}
        tone="warning"
        subtext={t('kpiBrief.cards.lateSub')}
      />
      <MetricCard
        label={t('kpiBrief.cards.unfinished')}
        value={aggregate.unfinished}
        tone="destructive"
        subtext={t('kpiBrief.cards.unfinishedSub', {
          overdue: aggregate.overdue,
          paused: aggregate.paused,
          progress: aggregate.progress,
        })}
      />
    </div>
  )
}
