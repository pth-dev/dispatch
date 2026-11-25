import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Download,
  FileSpreadsheet,
  FolderKanban,
  Plus,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DeptItem } from '@/schemas/meta'
import {
  MAX_UPLOAD_FILE_BYTES,
  WORK_ITEMS_MAX,
  WORK_ITEMS_RULES,
  type WorkItem,
  type WorkItemsRule,
} from '@/schemas/task'
import { SELECT_FIELD_CLASS } from '../../api/task-catalog'
import {
  calcWorkItemsRemaining,
  createBlankWorkItem,
  summarizeWorkItems,
  type WorkItemDayCalc,
} from '../../utils/work-items-domain'
import {
  downloadWorkItemsTemplate,
  exportWorkItemsExcel,
  parseWorkItemsExcelFile,
} from '../../utils/work-items-excel'
import { WorkItemEditorRow } from './WorkItemEditorRow'

const EMPTY_CALC: WorkItemDayCalc = {
  gross: 0,
  auto: 0,
  manual: 0,
  net: 0,
  hasRangeError: false,
}

type DirectoryOption = {
  username: string
  fullname?: string | null
}

type WorkItemsEditorSectionProps = {
  items: WorkItem[]
  rule: WorkItemsRule
  depts: DeptItem[]
  directory: DirectoryOption[]
  defaultOwner?: string
  defaultOu?: string
  taskTitle?: string
  required?: boolean
  disabled?: boolean
  error?: string | null
  onItemsChange: (items: WorkItem[]) => void
  onRuleChange: (rule: WorkItemsRule) => void
}

export function WorkItemsEditorSection({
  items,
  rule,
  depts,
  directory,
  defaultOwner = '',
  defaultOu = '',
  taskTitle = '',
  required = false,
  disabled = false,
  error,
  onItemsChange,
  onRuleChange,
}: WorkItemsEditorSectionProps) {
  const { t } = useTranslation()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const userDatalistId = React.useId()
  const [excelNotice, setExcelNotice] = React.useState<{
    tone: 'info' | 'error'
    text: string
  } | null>(null)
  const [excelBusy, setExcelBusy] = React.useState(false)

  const summary = summarizeWorkItems(items, rule)
  const remaining = calcWorkItemsRemaining(items, rule, summary, {})
  const canAddMore = items.length < WORK_ITEMS_MAX

  const handleAdd = () => {
    if (!canAddMore) return
    onItemsChange([...items, createBlankWorkItem(defaultOu)])
  }

  const handleItemChange = (index: number, patch: Partial<WorkItem>) => {
    onItemsChange(items.map((it, idx) => (idx === index ? { ...it, ...patch } : it)))
  }

  const handleMove = (index: number, delta: -1 | 1) => {
    const nextIdx = index + delta
    if (nextIdx < 0 || nextIdx >= items.length) return
    const copy = [...items]
    const [moved] = copy.splice(index, 1)
    if (!moved) return
    copy.splice(nextIdx, 0, moved)
    onItemsChange(copy)
  }

  const handleRemove = (index: number) => {
    onItemsChange(items.filter((_, idx) => idx !== index))
  }

  const handleDownloadTemplate = async () => {
    setExcelBusy(true)
    setExcelNotice(null)
    try {
      await downloadWorkItemsTemplate(rule, defaultOwner, defaultOu)
      setExcelNotice({ tone: 'info', text: t('tasks.project.templateDownloaded') })
    } catch {
      setExcelNotice({ tone: 'error', text: t('tasks.project.excelError') })
    }
    setExcelBusy(false)
  }

  const handleExport = async () => {
    const valid = items.filter((it) => it.topic.trim().length > 0)
    if (valid.length === 0) {
      setExcelNotice({ tone: 'error', text: t('tasks.project.nothingToExport') })
      return
    }
    setExcelBusy(true)
    setExcelNotice(null)
    try {
      await exportWorkItemsExcel(valid, rule, taskTitle)
    } catch {
      setExcelNotice({ tone: 'error', text: t('tasks.project.excelError') })
    }
    setExcelBusy(false)
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (file.size > MAX_UPLOAD_FILE_BYTES) {
      setExcelNotice({ tone: 'error', text: t('tasks.validation.fileTooLarge') })
      return
    }

    setExcelBusy(true)
    setExcelNotice(null)
    try {
      const parsed = await parseWorkItemsExcelFile(file, defaultOu)
      if (parsed.items.length === 0) {
        setExcelNotice({ tone: 'error', text: t('tasks.project.excelNoRows') })
      } else {
        onItemsChange(parsed.items)
        if (parsed.rule) {
          onRuleChange(parsed.rule)
        }
        setExcelNotice({
          tone: 'info',
          text: t('tasks.project.excelImported', {
            count: parsed.items.length,
            warnings: parsed.warnings.length,
          }),
        })
      }
    } catch {
      setExcelNotice({ tone: 'error', text: t('tasks.project.excelError') })
    }
    setExcelBusy(false)
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FolderKanban className="size-4 text-primary shrink-0" aria-hidden="true" />
          <h2 className="text-base font-semibold text-foreground">
            {t('tasks.project.sectionTitle')}
            {required && <span aria-hidden="true" className="ml-1 text-destructive">*</span>}
          </h2>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
            {items.length}/{WORK_ITEMS_MAX}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            aria-label={t('tasks.project.importExcel')}
            onChange={(e) => void handleImportFile(e)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || excelBusy}
            onClick={() => void handleDownloadTemplate()}
          >
            <FileSpreadsheet className="size-3.5" aria-hidden="true" />
            <span>{t('tasks.project.downloadTemplate')}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || excelBusy}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-3.5" aria-hidden="true" />
            <span>{t('tasks.project.importExcel')}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || excelBusy || items.length === 0}
            onClick={() => void handleExport()}
          >
            <Download className="size-3.5" aria-hidden="true" />
            <span>{t('tasks.project.exportExcel')}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={disabled || !canAddMore}
            onClick={handleAdd}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            <span>{t('tasks.project.addItem')}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end rounded-lg border border-border bg-secondary/40 p-3 text-xs">
        <div className="md:col-span-4 space-y-1">
          <label htmlFor="wi-deduct-rule" className="block text-[11px] font-semibold text-foreground">
            {t('tasks.project.ruleLabel')}
          </label>
          <select
            id="wi-deduct-rule"
            value={rule}
            disabled={disabled}
            onChange={(e) => onRuleChange(e.target.value as WorkItemsRule)}
            className={SELECT_FIELD_CLASS}
          >
            {WORK_ITEMS_RULES.map((r) => (
              <option key={r} value={r}>
                {t(`tasks.project.rules.${r}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-8 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground tabular-nums">
          <span>
            {t('tasks.project.spanDays')}:{' '}
            <strong className="text-foreground">{summary.spanDays}</strong>
          </span>
          <span>
            {t('tasks.project.deductDays')}:{' '}
            <strong className="text-foreground">{summary.spanDeduct}</strong>
          </span>
          <span>
            {t('tasks.project.remainNetDays')}:{' '}
            <strong className="text-primary">{remaining.remainNet}</strong>
          </span>
          {remaining.warnings.length > 0 && (
            <span className="font-medium text-warning">
              {t('tasks.project.warnCount', { count: remaining.warnings.length })}
            </span>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      {excelNotice && (
        <p
          role={excelNotice.tone === 'error' ? 'alert' : 'status'}
          className={
            excelNotice.tone === 'error'
              ? 'text-xs text-destructive'
              : 'text-xs text-primary'
          }
        >
          {excelNotice.text}
        </p>
      )}

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          {t('tasks.project.emptyEditorHint')}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <WorkItemEditorRow
              key={item.id}
              item={item}
              index={idx}
              total={items.length}
              calc={summary.calcs[idx] ?? EMPTY_CALC}
              share={summary.shares[idx] ?? 0}
              depts={depts}
              userDatalistId={userDatalistId}
              disabled={disabled}
              onChange={handleItemChange}
              onMove={handleMove}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      <datalist id={userDatalistId}>
        {directory.map((u) => (
          <option key={u.username} value={u.username}>
            {u.fullname ? `${u.fullname} (${u.username})` : u.username}
          </option>
        ))}
      </datalist>
    </section>
  )
}
