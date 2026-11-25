import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { DonutChart, type DonutSegment } from '@/components/ui/donut-chart'
import {
  BRIEF_STATUS_COLOR_VAR,
  BRIEF_STATUS_ORDER,
  isBriefStatusUnfinished,
  type BriefAggregate,
  type BriefStatus,
} from '../utils/kpi-brief-domain'

export interface KpiBriefDonutCardProps {
  aggregate: BriefAggregate
  activeStatus: BriefStatus | ''
  onSelectUnfinishedStatus: (status: BriefStatus) => void
}

export function KpiBriefDonutCard({
  aggregate,
  activeStatus,
  onSelectUnfinishedStatus,
}: KpiBriefDonutCardProps) {
  const { t } = useTranslation()

  const segments: DonutSegment[] = BRIEF_STATUS_ORDER.map((status) => ({
    id: status,
    label: t(`kpiBrief.status.${status}`),
    value: aggregate[status],
    colorVar: BRIEF_STATUS_COLOR_VAR[status],
    selectable: isBriefStatusUnfinished(status),
  }))

  const handleSelect = (segmentId: string) => {
    const status = segmentId as BriefStatus
    if (isBriefStatusUnfinished(status)) {
      onSelectUnfinishedStatus(status)
    }
  }

  return (
    <Card className="p-4 space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{t('kpiBrief.donut.title')}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{t('kpiBrief.donut.subtitle')}</p>
      </div>
      <DonutChart
        segments={segments}
        centerLabel={`${aggregate.rate}%`}
        ariaLabel={t('kpiBrief.donut.title')}
        legendColumns={1}
        activeSegmentId={activeStatus || null}
        onSelectSegment={handleSelect}
      />
    </Card>
  )
}
