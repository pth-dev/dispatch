import * as React from 'react'
import { Download, Eye, FileSpreadsheet, FileText, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store'
import { InlineError, toErrorStatus } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { getDeptDisplayName, useMetaDepts, useUserDirectory } from '@/hooks/use-meta'
import { resolveApiErrorMessage } from '@/services'
import { getQuickDateRange, type QuickDateRange } from '@/utils/date-range'
import { isSuperLike } from '@/utils/permissions'
import {
  fetchOfficeFilesForReport,
  useReportTasks,
  useSaveWebReport,
} from '../api/queries'
import { triggerTextFileDownload } from '../utils/report-domain'
import {
  buildQueueTargets,
  buildRichWebReportHtml,
  DEFAULT_WEB_REPORT_OPTIONS,
  downloadWebReportAsWord,
  exportWebReportAsExcel,
  splitPrimarySecondaryTasks,
  type BuiltWebReport,
  type WebReportLang,
  type WebReportOptions,
  type WebReportSubject,
} from '../utils/web-report-domain'
import { WebReportArchiveList } from './WebReportArchiveList'
import { WebReportPreviewModal } from './WebReportPreviewModal'

const SELECT_CLS =
  'h-11 lg:h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30'

const QUICK_RANGES: readonly Exclude<QuickDateRange, 'today'>[] = [
  'week',
  'month',
  'quarter',
  'year',
]

const SUBJECTS: readonly WebReportSubject[] = ['SELF', 'DEPT', 'FILTER', 'PERSON']
const OPTION_KEYS: readonly (keyof WebReportOptions)[] = [
  'chart',
  'unit',
  'person',
  'cat',
  'exc',
  'kpi',
  'precautions',
  'content',
  'office',
  'history',
  'mask',
  'sign',
]

export function WebReportTab({ onNotify }: { onNotify: (msg: string) => void }) {
  const { t, i18n } = useTranslation()
  const user = useAppStore((s) => s.user)
  const isSuper = isSuperLike(user)
  const deptsQuery = useMetaDepts()
  const directoryQuery = useUserDirectory()
  const initial = getQuickDateRange('month')

  const [subjects, setSubjects] = React.useState<Set<WebReportSubject>>(() => new Set(['SELF']))
  const [selectedDepts, setSelectedDepts] = React.useState<string[]>([])
  const [selectedPersonNames, setSelectedPersonNames] = React.useState<string[]>([])
  const [personSearch, setPersonSearch] = React.useState('')
  const [startDate, setStartDate] = React.useState(initial.start)
  const [endDate, setEndDate] = React.useState(initial.end)
  const [lang, setLang] = React.useState<WebReportLang>('bi')
  const [title, setTitle] = React.useState('')
  const [author, setAuthor] = React.useState(user?.fullname || user?.username || '')
  const [note, setNote] = React.useState('')
  const [options, setOptions] = React.useState<WebReportOptions>(DEFAULT_WEB_REPORT_OPTIONS)
  const [isBuilding, setIsBuilding] = React.useState(false)
  const [previewQueue, setPreviewQueue] = React.useState<BuiltWebReport[]>([])
  const [previewIndex, setPreviewIndex] = React.useState(0)
  const [previewOpen, setPreviewOpen] = React.useState(false)

  const tasksQuery = useReportTasks({ purpose: 'progress', start: startDate, end: endDate })
  const saveMutation = useSaveWebReport()

  const toggleSubject = (sub: WebReportSubject) => {
    setSubjects((prev) => {
      const next = new Set(prev)
      if (next.has(sub)) next.delete(sub)
      else next.add(sub)
      return next
    })
  }

  const toggleOption = (key: keyof WebReportOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const buildReportsQueue = async (): Promise<BuiltWebReport[]> => {
    const selectedUsers = (directoryQuery.data ?? []).filter((u) =>
      selectedPersonNames.includes(u.username),
    )
    const targets = buildQueueTargets({
      subjects,
      selectedDepts,
      selectedUsers,
      labels: {
        SELF: t('reports.web.subjects.SELF'),
        DEPT: t('reports.web.subjects.DEPT'),
        FILTER: t('reports.web.subjects.FILTER'),
        PERSON: t('reports.web.subjects.PERSON'),
      },
      allDeptsLabel: t('reports.common.allDepartments'),
      currentDept: user?.dept ?? '',
    })

    if (targets.length === 0) return []
    const allTasks = tasksQuery.data ?? []
    const effectiveTitle = title.trim() || t('reports.web.defaultTitle')
    const stamp = `${startDate}_${endDate}`
    const effectiveAuthor = author.trim() || user?.fullname || user?.username || ''

    const results: BuiltWebReport[] = []
    for (const target of targets) {
      const { primary, secondary } = splitPrimarySecondaryTasks(
        allTasks,
        target,
        user?.username ?? '',
        user?.dept ?? '',
      )
      const officeFiles = options.office
        ? await fetchOfficeFilesForReport(
            primary.map((item) => item.id),
            'progress',
          ).catch(() => [])
        : []
      const reportNo = `WR-${stamp}-${(user?.username || 'USER').toUpperCase()}`
      const html = buildRichWebReportHtml({
        target,
        title: effectiveTitle,
        reportNo,
        lang,
        rangeStart: startDate,
        rangeEnd: endDate,
        author: effectiveAuthor,
        note,
        primary,
        secondary,
        options,
        officeFiles,
      })
      results.push({
        target,
        title: effectiveTitle,
        reportNo,
        fileBase: `Dispatch_Report_${stamp}_${target.subject}`,
        lang,
        rangeStart: startDate,
        rangeEnd: endDate,
        mask: options.mask,
        primary,
        secondary,
        html,
      })
    }
    return results
  }

  const saveReport = async (report: BuiltWebReport) => {
    try {
      await saveMutation.mutateAsync({
        title: report.title,
        lang: report.lang,
        file_base: report.fileBase,
        html: report.html,
        subject: report.target.subject,
        subject_label: report.target.label,
        range_start: report.rangeStart,
        range_end: report.rangeEnd,
        total: report.primary.length,
        report_no: report.reportNo,
      })
      onNotify(t('reports.web.savedSuccess'))
    } catch (error) {
      onNotify(resolveApiErrorMessage(error, t, i18n.language))
    }
  }

  const runAction = async (action: 'preview' | 'save' | 'html' | 'word' | 'excel') => {
    setIsBuilding(true)
    try {
      const queue = await buildReportsQueue()
      const first = queue[0]
      if (!first) {
        onNotify(t('reports.common.exportEmpty'))
        setIsBuilding(false)
        return
      }
      if (action === 'preview') {
        setPreviewQueue(queue)
        setPreviewIndex(0)
        setPreviewOpen(true)
      } else if (action === 'save') {
        for (const item of queue) {
          await saveReport(item)
        }
      } else if (action === 'html') {
        for (const item of queue) {
          triggerTextFileDownload(item.html, `${item.fileBase}.html`, 'text/html;charset=utf-8')
        }
        onNotify(t('reports.common.exportSuccess'))
      } else if (action === 'word') {
        for (const item of queue) {
          downloadWebReportAsWord(item.html, item.fileBase, item.title)
        }
        onNotify(t('reports.common.exportSuccess'))
      } else {
        for (const item of queue) {
          await exportWebReportAsExcel(item)
        }
        onNotify(t('reports.common.exportSuccess'))
      }
    } catch (error) {
      onNotify(resolveApiErrorMessage(error, t, i18n.language))
    }
    setIsBuilding(false)
  }

  const filteredDirectory = (directoryQuery.data ?? []).filter((u) => {
    const q = personSearch.trim().toLowerCase()
    if (!q) return true
    return u.username.toLowerCase().includes(q) || (u.fullname || '').toLowerCase().includes(q)
  })

  return (
    <div className="min-h-0 flex-1 overflow-y-auto space-y-3">
      <section className="space-y-2.5 border-b border-border pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-muted-foreground">{t('reports.web.subject')}:</span>
            {SUBJECTS.map((sub) => (
              <label key={sub} className="inline-flex items-center gap-1.5 text-foreground">
                <Checkbox
                  checked={subjects.has(sub)}
                  onCheckedChange={() => toggleSubject(sub)}
                />
                <span>{t(`reports.web.subjects.${sub}`)}</span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {QUICK_RANGES.map((r) => (
              <Button
                key={r}
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  const next = getQuickDateRange(r)
                  setStartDate(next.start)
                  setEndDate(next.end)
                }}
              >
                {t(`worklog.quick.${r}`)}
              </Button>
            ))}
          </div>
        </div>

        {subjects.has('DEPT') && isSuper && (
          <div className="flex max-h-24 flex-wrap gap-x-4 gap-y-1 overflow-y-auto rounded-lg border border-border bg-secondary/30 p-2 text-xs">
            {(deptsQuery.data?.depts ?? []).map((d) => (
              <label key={d.value} className="inline-flex items-center gap-1.5 text-foreground">
                <Checkbox
                  checked={selectedDepts.includes(d.value)}
                  onCheckedChange={(v) =>
                    setSelectedDepts((prev) =>
                      v ? [...prev, d.value] : prev.filter((item) => item !== d.value),
                    )
                  }
                />
                <span>{getDeptDisplayName(d, i18n.language)}</span>
              </label>
            ))}
          </div>
        )}

        {subjects.has('PERSON') && (
          <div className="space-y-1.5 rounded-lg border border-border bg-secondary/30 p-2 text-xs">
            <Input
              type="search"
              aria-label={t('reports.excel.peoplePicker')}
              placeholder={t('reports.excel.peoplePicker')}
              value={personSearch}
              onChange={(e) => setPersonSearch(e.target.value)}
              className="h-8 w-full sm:w-60 text-xs"
            />
            <div className="flex max-h-20 flex-wrap gap-x-4 gap-y-1 overflow-y-auto">
              {filteredDirectory.slice(0, 60).map((u) => (
                <label key={u.username} className="inline-flex items-center gap-1.5 text-foreground">
                  <Checkbox
                    checked={selectedPersonNames.includes(u.username)}
                    onCheckedChange={(v) =>
                      setSelectedPersonNames((prev) =>
                        v ? [...prev, u.username] : prev.filter((item) => item !== u.username),
                      )
                    }
                  />
                  <span>
                    {u.username}
                    {u.fullname ? ` / ${u.fullname}` : ''}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
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
          <select
            aria-label={t('reports.web.langLabel')}
            className={SELECT_CLS}
            value={lang}
            onChange={(e) => setLang(e.target.value as WebReportLang)}
          >
            <option value="bi">{t('reports.web.langs.bi')}</option>
            <option value="vi">{t('reports.web.langs.vi')}</option>
            <option value="zh-CN">{t('reports.web.langs.zhCN')}</option>
            <option value="zh-TW">{t('reports.web.langs.zhTW')}</option>
          </select>
          <Input
            aria-label={t('reports.web.reportTitle')}
            placeholder={t('reports.web.defaultTitle')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            aria-label={t('reports.web.authorLabel')}
            placeholder={t('reports.web.authorLabel')}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </div>

        <Input
          aria-label={t('reports.web.noteLabel')}
          placeholder={t('reports.web.notePlaceholder')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-foreground">
          {OPTION_KEYS.map((key) => (
            <label key={key} className="inline-flex items-center gap-1.5">
              <Checkbox checked={options[key]} onCheckedChange={() => toggleOption(key)} />
              <span>{t(`reports.web.opts.${key}`)}</span>
            </label>
          ))}
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
            size="sm"
            disabled={isBuilding || subjects.size === 0}
            onClick={() => void runAction('preview')}
          >
            <Eye className="size-4" aria-hidden="true" />
            <span>{t('reports.web.generatePreview')}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isBuilding || saveMutation.isPending || subjects.size === 0}
            onClick={() => void runAction('save')}
          >
            <Save className="size-4" aria-hidden="true" />
            <span>{t('reports.web.saveArchive')}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isBuilding || subjects.size === 0}
            onClick={() => void runAction('html')}
          >
            <Download className="size-4" aria-hidden="true" />
            <span>{t('reports.web.downloadHtml')}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isBuilding || subjects.size === 0}
            onClick={() => void runAction('word')}
          >
            <FileText className="size-4" aria-hidden="true" />
            <span>{t('reports.web.downloadWord')}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isBuilding || subjects.size === 0}
            onClick={() => void runAction('excel')}
          >
            <FileSpreadsheet className="size-4" aria-hidden="true" />
            <span>{t('reports.common.exportExcel')}</span>
          </Button>
        </div>
      </section>

      <WebReportArchiveList onNotify={onNotify} />

      <WebReportPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        queue={previewQueue}
        activeIndex={previewIndex}
        onIndexChange={setPreviewIndex}
        isSaving={saveMutation.isPending}
        onSaveCurrent={(rep) => void saveReport(rep)}
        onNotify={onNotify}
      />
    </div>
  )
}
