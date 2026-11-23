import * as React from 'react'
import { useNavigate } from 'react-router'
import { Flame } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { HorizontalBarRow } from '@/components/ui/horizontal-bar-row'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { APP_ROUTES } from '@/constants/app-routes'
import type { BottleneckBreakdowns, BottleneckRow, BottleneckTabKey } from '../utils/dashboard-domain'

interface DashboardBottleneckTabsProps {
  breakdowns: BottleneckBreakdowns
}

const TAB_KEYS: readonly BottleneckTabKey[] = ['dept', 'site', 'level', 'type']

function buildFilterUrl(tab: BottleneckTabKey, row: BottleneckRow): string {
  const qs = new URLSearchParams()
  if (tab === 'dept' && row.filterValue) qs.set('dept', row.filterValue)
  if (tab === 'site' && row.filterValue) qs.set('site', row.filterValue)
  if (tab === 'level' && row.filterValue) qs.set('level', row.filterValue)
  if (tab === 'type' && row.filterValue) qs.set('type', row.filterValue)
  const query = qs.toString()
  return query ? `${APP_ROUTES.TASKS}?${query}` : APP_ROUTES.TASKS
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

export function DashboardBottleneckTabs({ breakdowns }: DashboardBottleneckTabsProps) {
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
          <div className="space-y-0.5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Flame className="size-4 text-warning" aria-hidden="true" />
              <span>{t('dashboard.bottleneck.title')}</span>
            </h2>
            <p className="text-xs text-muted-foreground">{t('dashboard.bottleneck.subtitle')}</p>
          </div>

          <TabsList className="h-auto flex-wrap gap-1 p-1">
            {TAB_KEYS.map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="min-h-11 lg:min-h-8 px-2.5 text-xs"
              >
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
              onSelectRow={(tabKey, row) => navigate(buildFilterUrl(tabKey, row))}
            />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}
