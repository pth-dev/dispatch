import * as React from 'react'
import { useNavigate } from 'react-router'
import { Flame } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { HorizontalBarRow } from '@/components/ui/horizontal-bar-row'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { APP_ROUTES } from '@/constants/app-routes'
import { buildTaskDrilldownUrl } from '../utils/dashboard-charts'
import type {
  BottleneckBreakdowns,
  BottleneckRow,
  BottleneckTabKey,
  DashboardScopeMode,
} from '../utils/dashboard-domain'

interface DashboardBottleneckTabsProps {
  breakdowns: BottleneckBreakdowns
  scopeMode: DashboardScopeMode
  department?: string
}

const TAB_KEYS: readonly BottleneckTabKey[] = ['dept', 'site', 'level', 'type']

function buildRowUrl(
  tab: BottleneckTabKey,
  row: BottleneckRow,
  scopeMode: DashboardScopeMode,
  department?: string,
): string {
  return buildTaskDrilldownUrl(APP_ROUTES.TASKS, {
    scope: scopeMode,
    department: tab === 'dept' ? row.filterValue || department : department,
    site: tab === 'site' ? row.filterValue : undefined,
    levelRaw: tab === 'level' ? row.filterValue : undefined,
    taskType: tab === 'type' ? row.filterValue : undefined,
    status: row.open > 0 ? 'incomplete' : undefined,
  })
}

function BottleneckList({
  tab,
  rows,
  emptyMessage,
  formatStat,
  onSelectRow,
}: {
  tab: BottleneckTabKey
  rows: readonly BottleneckRow[]
  emptyMessage: string
  formatStat: (row: BottleneckRow) => string
  onSelectRow: (tab: BottleneckTabKey, row: BottleneckRow) => void
}) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-xs text-muted-foreground">{emptyMessage}</p>
  }

  const maxOpen = Math.max(1, ...rows.map((r) => r.open))
  return (
    <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
      {rows.map((row) => (
        <HorizontalBarRow
          key={row.key}
          label={row.label}
          percent={Math.round((row.overdue / maxOpen) * 100)}
          tone="destructive"
          secondaryPercent={Math.round(((row.open - row.overdue) / maxOpen) * 100)}
          secondaryTone="primary"
          onClick={() => onSelectRow(tab, row)}
          valueText={formatStat(row)}
        />
      ))}
    </div>
  )
}

export function DashboardBottleneckTabs({
  breakdowns,
  scopeMode,
  department,
}: DashboardBottleneckTabsProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = React.useState<BottleneckTabKey>('dept')

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as BottleneckTabKey)}
        className="space-y-3"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Flame className="size-4 text-warning" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground">
                {t('dashboard.bottleneck.title')}
              </h2>
              <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {t('dashboard.scopeBadge.live')}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-xs bg-destructive" aria-hidden="true" />
                <span>{t('dashboard.bottleneck.legendOverdue')}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-xs bg-primary" aria-hidden="true" />
                <span>{t('dashboard.bottleneck.legendOpenOnTrack')}</span>
              </span>
              <span>{t('dashboard.bottleneck.subtitle')}</span>
            </div>
          </div>

          <TabsList className="group-data-[orientation=horizontal]/tabs:h-auto w-full sm:w-fit flex-wrap gap-1 p-1">
            {TAB_KEYS.map((key) => (
              <TabsTrigger key={key} value={key} className="min-h-11 lg:min-h-8 px-2.5 text-xs">
                {t(`dashboard.bottleneck.tabs.${key}`)} ({breakdowns[key].length})
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {TAB_KEYS.map((key) => (
          <TabsContent key={key} value={key} className="mt-0">
            <BottleneckList
              tab={key}
              rows={breakdowns[key]}
              emptyMessage={t('dashboard.bottleneck.empty')}
              formatStat={(row) =>
                t('dashboard.bottleneck.rowStat', {
                  open: row.open,
                  overdue: row.overdue,
                  total: row.total,
                })
              }
              onSelectRow={(tabKey, row) =>
                navigate(buildRowUrl(tabKey, row, scopeMode, department))
              }
            />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}
