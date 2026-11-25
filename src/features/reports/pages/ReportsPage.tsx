import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useAppStore } from '@/app/store'
import { PageContainer, PageContainerBody, PageHeader } from '@/components/layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/toaster'
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

  const handleNotify = (message: string) => {
    toast.info(message)
  }

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
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', value)
        return next
      },
      { replace: true },
    )
  }

  return (
    <PageContainer>
      <div className="shrink-0 print:hidden">
        <PageHeader title={t('reports.title')} />
      </div>

      <PageContainerBody
        surface="card"
        scrollable={false}
        className="gap-3 p-3 lg:p-4 print:border-0 print:p-0 print:overflow-visible"
      >
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="flex min-h-0 flex-1 flex-col gap-3"
        >
          <TabsList
            variant="line"
            className="w-full shrink-0 justify-start overflow-x-auto border-b border-border pb-0 print:hidden"
          >
            {canPdf && <TabsTrigger value="pdf">{t('reports.tabs.pdf')}</TabsTrigger>}
            {canKpi && <TabsTrigger value="kpi">{t('reports.tabs.kpi')}</TabsTrigger>}
            {canExcel && <TabsTrigger value="excel">{t('reports.tabs.excel')}</TabsTrigger>}
            <TabsTrigger value="web">{t('reports.tabs.web')}</TabsTrigger>
          </TabsList>

          {canPdf && (
            <TabsContent
              value="pdf"
              className="mt-0 min-h-0 flex-1 flex-col data-[state=active]:flex"
            >
              <PdfReportTab onNotify={handleNotify} />
            </TabsContent>
          )}
          {canKpi && (
            <TabsContent
              value="kpi"
              className="mt-0 min-h-0 flex-1 flex-col data-[state=active]:flex"
            >
              <PeriodicKpiTab onNotify={handleNotify} />
            </TabsContent>
          )}
          {canExcel && (
            <TabsContent
              value="excel"
              className="mt-0 min-h-0 flex-1 flex-col data-[state=active]:flex"
            >
              <ExcelStatsTab onNotify={handleNotify} />
            </TabsContent>
          )}
          <TabsContent
            value="web"
            className="mt-0 min-h-0 flex-1 flex-col data-[state=active]:flex"
          >
            <WebReportTab onNotify={handleNotify} />
          </TabsContent>
        </Tabs>
      </PageContainerBody>
    </PageContainer>
  )
}

export default ReportsPage
