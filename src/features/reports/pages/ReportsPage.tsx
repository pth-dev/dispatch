import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useAppStore } from '@/app/store'
import { PageContainer, PageHeader } from '@/components/layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { canReadMenu } from '@/utils/permissions'
import { ExcelStatsTab } from '../components/ExcelStatsTab'
import { PdfReportTab } from '../components/PdfReportTab'
import { PeriodicKpiTab } from '../components/PeriodicKpiTab'
import { WebReportTab } from '../components/WebReportTab'

type ReportTabId = 'pdf' | 'kpi' | 'excel' | 'web'

export function ReportsPage() {
  const { t } = useTranslation()
  const user = useAppStore((s) => s.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const [notice, setNotice] = React.useState<string | null>(null)

  const canPdf = canReadMenu(user, 'report_pdf')
  const canKpi = canReadMenu(user, 'kpi_report')
  const canExcel = canReadMenu(user, 'excel_report')

  const availableTabs: ReportTabId[] = [
    ...(canPdf ? (['pdf'] as const) : []),
    ...(canKpi ? (['kpi'] as const) : []),
    ...(canExcel ? (['excel'] as const) : []),
    'web',
  ]

  const requestedTab = searchParams.get('tab') as ReportTabId | null
  const activeTab: ReportTabId =
    requestedTab && availableTabs.includes(requestedTab)
      ? requestedTab
      : (availableTabs[0] ?? 'web')

  const handleTabChange = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', value)
      return next
    })
  }

  return (
    <PageContainer className="space-y-4">
      <div className="print:hidden space-y-4">
        <PageHeader title={t('reports.title')} subtitle={t('reports.subtitle')} />

        {notice && (
          <div
            role="status"
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-xs text-foreground"
          >
            <span>{notice}</span>
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => setNotice(null)}
            >
              {t('common.close')}
            </button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList variant="line" className="print:hidden">
          {canPdf && <TabsTrigger value="pdf">{t('reports.tabs.pdf')}</TabsTrigger>}
          {canKpi && <TabsTrigger value="kpi">{t('reports.tabs.kpi')}</TabsTrigger>}
          {canExcel && <TabsTrigger value="excel">{t('reports.tabs.excel')}</TabsTrigger>}
          <TabsTrigger value="web">{t('reports.tabs.web')}</TabsTrigger>
        </TabsList>

        {canPdf && (
          <TabsContent value="pdf" className="mt-4">
            <PdfReportTab onNotify={setNotice} />
          </TabsContent>
        )}
        {canKpi && (
          <TabsContent value="kpi" className="mt-4">
            <PeriodicKpiTab onNotify={setNotice} />
          </TabsContent>
        )}
        {canExcel && (
          <TabsContent value="excel" className="mt-4">
            <ExcelStatsTab onNotify={setNotice} />
          </TabsContent>
        )}
        <TabsContent value="web" className="mt-4">
          <WebReportTab onNotify={setNotice} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}

export default ReportsPage
