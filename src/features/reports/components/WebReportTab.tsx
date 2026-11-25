import * as React from 'react'
import { Download, FileText, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store'
import { InlineError, toErrorStatus } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { resolveApiErrorMessage } from '@/services'
import { parseAssigneeList, sameDept } from '@/utils/task-domain'
import { getQuickDateRange } from '@/utils/date-range'
import {
  fetchOfficeFilesForReport,
  useReportTasks,
  useSaveWebReport,
} from '../api/queries'
import {
  buildStandaloneWebReportHtml,
  triggerTextFileDownload,
} from '../utils/report-domain'
import { WebReportArchiveList } from './WebReportArchiveList'

type ReportSubject = 'SELF' | 'DEPT' | 'FILTER' | 'PERSON'

const SELECT_CLS =
  'h-11 lg:h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30'

export function WebReportTab({ onNotify }: { onNotify: (msg: string) => void }) {
  const { t, i18n } = useTranslation()
  const user = useAppStore((s) => s.user)
  const initial = getQuickDateRange('month')

  const [subject, setSubject] = React.useState<ReportSubject>('SELF')
  const [startDate, setStartDate] = React.useState(initial.start)
  const [endDate, setEndDate] = React.useState(initial.end)
  const [title, setTitle] = React.useState('')
  const [includeHistory, setIncludeHistory] = React.useState(true)
  const [includeOfficeFiles, setIncludeOfficeFiles] = React.useState(false)
  const [hideConfidential, setHideConfidential] = React.useState(false)
  const [officeCount, setOfficeCount] = React.useState<number | null>(null)
  const [isBuilding, setIsBuilding] = React.useState(false)

  const tasksQuery = useReportTasks({ purpose: 'progress', start: startDate, end: endDate })
  const saveMutation = useSaveWebReport()

  const scopedTasks = (tasksQuery.data ?? []).filter((task) => {
    if (subject === 'SELF' && user?.username) {
      return (
        task.reporter === user.username ||
        parseAssigneeList(task.assign_person).includes(user.username)
      )
    }
    if (subject === 'DEPT' && user?.dept) {
      return sameDept(task.assigned_unit, user.dept)
    }
    return true
  })

  const buildPayload = async () => {
    const effectiveTitle = title.trim() || t('reports.web.defaultTitle')
    const stamp = `${startDate}_${endDate}`
    const reportNo = `WR-${stamp}-${(user?.username || 'USER').toUpperCase()}`
    const officeFiles = includeOfficeFiles
      ? await fetchOfficeFilesForReport(
          scopedTasks.map((item) => item.id),
          'progress',
        ).catch(() => [])
      : []
    if (includeOfficeFiles) setOfficeCount(officeFiles.length)

    const html = buildStandaloneWebReportHtml({
      title: effectiveTitle,
      reportNo,
      subjectLabel: t(`reports.web.subjects.${subject}`),
      rangeStart: startDate,
      rangeEnd: endDate,
      author: user?.fullname || user?.username || '',
      tasks: scopedTasks,
      includeHistory,
      hideConfidential,
      officeFiles,
    })

    return {
      title: effectiveTitle,
      report_no: reportNo,
      file_base: `Dispatch_Report_${stamp}`,
      lang: i18n.language,
      subject,
      subject_label: t(`reports.web.subjects.${subject}`),
      range_start: startDate,
      range_end: endDate,
      total: scopedTasks.length,
      html,
    }
  }

  const handleDownload = async (format: 'html' | 'word') => {
    if (scopedTasks.length === 0) {
      onNotify(t('reports.common.exportEmpty'))
      return
    }
    setIsBuilding(true)
    try {
      const payload = await buildPayload()
      if (format === 'html') {
        triggerTextFileDownload(payload.html, `${payload.file_base}.html`, 'text/html;charset=utf-8')
      } else {
        triggerTextFileDownload(
          payload.html,
          `${payload.file_base}.doc`,
          'application/msword;charset=utf-8',
        )
      }
      onNotify(t('reports.common.exportSuccess'))
    } catch (error) {
      onNotify(resolveApiErrorMessage(error, t, i18n.language))
    }
    setIsBuilding(false)
  }

  const handleSaveArchive = async () => {
    if (scopedTasks.length === 0) {
      onNotify(t('reports.common.exportEmpty'))
      return
    }
    setIsBuilding(true)
    try {
      const payload = await buildPayload()
      await saveMutation.mutateAsync(payload)
      onNotify(t('reports.web.savedSuccess'))
    } catch (error) {
      onNotify(resolveApiErrorMessage(error, t, i18n.language))
    }
    setIsBuilding(false)
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto space-y-3">
      <section className="space-y-2.5 border-b border-border pb-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <select
            aria-label={t('reports.web.subject')}
            className={SELECT_CLS}
            value={subject}
            onChange={(e) => setSubject(e.target.value as ReportSubject)}
          >
            <option value="SELF">{t('reports.web.subjects.SELF')}</option>
            <option value="DEPT">{t('reports.web.subjects.DEPT')}</option>
            <option value="FILTER">{t('reports.web.subjects.FILTER')}</option>
            <option value="PERSON">{t('reports.web.subjects.PERSON')}</option>
          </select>
          <Input
            type="date"
            aria-label={t('reports.common.startDate')}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            type="date"
            aria-label={t('reports.common.endDate')}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Input
            aria-label={t('reports.web.reportTitle')}
            placeholder={t('reports.web.defaultTitle')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-foreground">
          <label className="inline-flex items-center gap-1.5">
            <Checkbox
              checked={includeHistory}
              onCheckedChange={(v) => setIncludeHistory(Boolean(v))}
            />
            <span>{t('reports.web.includeHistory')}</span>
          </label>
          <label className="inline-flex items-center gap-1.5">
            <Checkbox
              checked={includeOfficeFiles}
              onCheckedChange={(v) => setIncludeOfficeFiles(Boolean(v))}
            />
            <span>{t('reports.web.includeOfficeFiles')}</span>
          </label>
          <label className="inline-flex items-center gap-1.5">
            <Checkbox
              checked={hideConfidential}
              onCheckedChange={(v) => setHideConfidential(Boolean(v))}
            />
            <span>{t('reports.web.hideConfidential')}</span>
          </label>
          {officeCount !== null && (
            <span className="text-muted-foreground">
              {t('reports.web.officeFilesCount', { count: officeCount })}
            </span>
          )}
        </div>

        {tasksQuery.isError && (
          <InlineError
            status={toErrorStatus(tasksQuery.error)}
            onRetry={() => void tasksQuery.refetch()}
          />
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            type="button"
            disabled={isBuilding || saveMutation.isPending || scopedTasks.length === 0}
            onClick={() => void handleSaveArchive()}
          >
            <Save className="size-4" aria-hidden="true" />
            <span>{t('reports.web.saveArchive')}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isBuilding || scopedTasks.length === 0}
            onClick={() => void handleDownload('html')}
          >
            <Download className="size-4" aria-hidden="true" />
            <span>{t('reports.web.downloadHtml')}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isBuilding || scopedTasks.length === 0}
            onClick={() => void handleDownload('word')}
          >
            <FileText className="size-4" aria-hidden="true" />
            <span>{t('reports.web.downloadWord')}</span>
          </Button>
        </div>
      </section>

      <WebReportArchiveList onNotify={onNotify} />
    </div>
  )
}
