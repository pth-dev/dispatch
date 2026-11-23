import type { TFunction } from 'i18next'
import type { RawTask } from '@/schemas/task'
import {
  copyTableToClipboard,
  exportTableToCsv,
  type ExportCellValue,
} from '@/utils/export-table'
import { isRecurringTask, isTaskPaused } from '@/utils/task-domain'
import {
  BRIEF_SAMPLE_MIN,
  type BriefAggregate,
  type BriefCaseRow,
  type BriefPersonRow,
  type BriefStatus,
} from './kpi-brief-domain'
import {
  getKpiBasisAt,
  getKpiTaskPoints,
  getTaskFinalDueInfo,
  type KpiBasis,
  type PeopleKpiRow,
} from './kpi-people-domain'

export function formatShortDateTime(date: Date | null | undefined): string {
  if (!date || Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}`
}

function fileTimestamp(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return `${y}${m}${d}_${hh}${mm}`
}

export function buildPeopleKpiExportTable(
  rows: readonly PeopleKpiRow[],
  resolveDeptLabel: (raw: string) => string,
  t: TFunction,
): { headers: string[]; data: ExportCellValue[][] } {
  const headers = [
    t('kpi.table.rank'),
    t('kpi.table.username'),
    t('kpi.table.fullname'),
    t('kpi.table.dept'),
    t('kpi.table.total'),
    t('kpi.table.completed'),
    t('kpi.table.completionRate'),
    t('kpi.table.finalPart'),
    t('kpi.table.ontime'),
    t('kpi.table.ontimeRate'),
    t('kpi.table.ontimePart'),
    t('kpi.table.late'),
    t('kpi.table.lateRate'),
    t('kpi.table.pending'),
    t('kpi.table.overdue'),
    t('kpi.table.response1h'),
    t('kpi.table.paused'),
    t('kpi.table.score'),
    t('kpi.table.grade'),
  ]

  const data: ExportCellValue[][] = rows.map((r, i) => [
    i + 1,
    r.username,
    r.isUnregistered ? t('kpi.unregistered') : r.fullname,
    r.deptRaw ? resolveDeptLabel(r.deptRaw) : '',
    r.total,
    r.completed,
    r.total > 0 ? `${r.completionRate}%` : 'N/A',
    r.total > 0 ? r.finalPart : 'N/A',
    r.ontime,
    r.total > 0 ? `${r.ontimeRate}%` : 'N/A',
    r.total > 0 ? r.ontimePart : 'N/A',
    r.late,
    r.total > 0 ? `${r.lateRate}%` : 'N/A',
    r.pending,
    r.overdue,
    r.total > 0 ? `${r.responseRate}%` : 'N/A',
    r.paused,
    r.score === null ? '-' : r.score,
    `${r.grade.code} ${t(`kpi.grade.${r.grade.code}`)}`,
  ])

  return { headers, data }
}

export function exportPeopleKpiCsv(
  rows: readonly PeopleKpiRow[],
  startStr: string,
  endStr: string,
  resolveDeptLabel: (raw: string) => string,
  t: TFunction,
): void {
  const { headers, data } = buildPeopleKpiExportTable(rows, resolveDeptLabel, t)
  exportTableToCsv(`kpi_people_${startStr}_${endStr}_${fileTimestamp()}`, headers, data)
}

export function exportPeopleKpiDetailsCsv(
  rows: readonly PeopleKpiRow[],
  taskMap: ReadonlyMap<string, RawTask>,
  basis: KpiBasis,
  startStr: string,
  endStr: string,
  t: TFunction,
): void {
  const headers = [
    t('kpi.table.username'),
    t('kpi.table.fullname'),
    t('kpi.detail.taskId'),
    t('kpi.detail.title'),
    t('kpi.detail.nature'),
    t('kpi.detail.created'),
    t('kpi.detail.due'),
    t('kpi.detail.finalDue'),
    t('kpi.detail.finish'),
    t('kpi.detail.basisDate'),
    t('kpi.detail.progress'),
    t('kpi.detail.paused'),
    t('kpi.detail.points'),
    t('kpi.detail.firstResponse'),
  ]

  const data: ExportCellValue[][] = []
  for (const r of rows) {
    for (const key of [...r.taskKeys, ...r.pausedKeys]) {
      const task = taskMap.get(key)
      if (!task) continue
      const rec = isRecurringTask({ recur_type: task.recur_type ?? 'once' })
      const finalDue = getTaskFinalDueInfo(task)
      const basisAt = getKpiBasisAt(task, basis)
      const pts = getKpiTaskPoints(task)
      data.push([
        r.username,
        r.isUnregistered ? t('kpi.unregistered') : r.fullname,
        task.id,
        task.title,
        rec
          ? t('kpi.detail.recurringCycle', {
              no: task.cycle_no || 1,
              date: task.cycle_date || task.recur_cycle_date || '',
            })
          : t('kpi.detail.oneTime'),
        task.kpi_at || task.createdAt || '',
        task.due_date || '',
        finalDue.isUnlimited ? t('kpi.detail.unlimited') : finalDue.displayRaw,
        task.finish_date || '',
        formatShortDateTime(basisAt),
        task.progress,
        isTaskPaused(task) ? t('kpi.detail.pausedYes') : t('kpi.detail.pausedNo'),
        pts === null ? '-' : pts,
        task.first_response_mins ?? '',
      ])
    }
  }

  exportTableToCsv(`kpi_details_${startStr}_${endStr}_${fileTimestamp()}`, headers, data)
}

export async function copyPeopleKpiTsv(
  rows: readonly PeopleKpiRow[],
  resolveDeptLabel: (raw: string) => string,
  t: TFunction,
): Promise<boolean> {
  const { headers, data } = buildPeopleKpiExportTable(rows, resolveDeptLabel, t)
  return copyTableToClipboard(headers, data)
}

export function buildBriefPeopleExportTable(
  people: readonly BriefPersonRow[],
  resolveDeptLabel: (raw: string) => string,
  t: TFunction,
): { headers: string[]; data: ExportCellValue[][] } {
  const headers = [
    t('kpiBrief.table.person'),
    t('kpi.table.username'),
    t('kpi.table.dept'),
    t('kpiBrief.table.total'),
    t('kpiBrief.status.ontime'),
    t('kpiBrief.status.late'),
    t('kpiBrief.status.overdue'),
    t('kpiBrief.status.progress'),
    t('kpiBrief.status.paused'),
    t('kpiBrief.table.completionRate'),
    t('kpiBrief.table.ontimeRate'),
    t('kpiBrief.table.note'),
  ]

  const data: ExportCellValue[][] = people.map((p) => [
    p.fullname,
    p.username,
    p.deptRaw ? resolveDeptLabel(p.deptRaw) : '',
    p.total,
    p.ontime,
    p.late,
    p.overdue,
    p.progress,
    p.paused,
    `${p.rate}%`,
    `${p.ontimeRate}%`,
    p.total < BRIEF_SAMPLE_MIN ? t('kpiBrief.lowSample') : '',
  ])

  return { headers, data }
}

export async function copyBriefBoardTsv(
  people: readonly BriefPersonRow[],
  summary: BriefAggregate,
  periodLabel: string,
  viewLabel: string,
  resolveDeptLabel: (raw: string) => string,
  t: TFunction,
): Promise<boolean> {
  const { headers, data } = buildBriefPeopleExportTable(people, resolveDeptLabel, t)
  const titleRow = [t('kpiBrief.title'), periodLabel, viewLabel]
  const metaRows: ExportCellValue[][] = [
    [
      `${t('kpiBrief.cards.total')} ${summary.total}`,
      `${t('kpiBrief.cards.completionRate')} ${summary.rate}%`,
      `${t('kpiBrief.cards.ontimeRate')} ${summary.ontimeRate}%`,
      `${t('kpiBrief.cards.late')} ${summary.late}`,
      `${t('kpiBrief.cards.unfinished')} ${summary.unfinished}`,
    ],
    [],
    headers,
    ...data,
  ]
  return copyTableToClipboard(titleRow, metaRows)
}

export function exportBriefPeopleCsv(
  people: readonly BriefPersonRow[],
  yearLabel: string,
  monthLabel: string,
  resolveDeptLabel: (raw: string) => string,
  t: TFunction,
): void {
  const { headers, data } = buildBriefPeopleExportTable(people, resolveDeptLabel, t)
  exportTableToCsv(`kpi_brief_${yearLabel}_${monthLabel}_${fileTimestamp()}`, headers, data)
}

export function exportBriefUnfinishedCsv(
  cases: readonly BriefCaseRow[],
  yearLabel: string,
  monthLabel: string,
  statusLabel: (s: BriefStatus) => string,
  t: TFunction,
): void {
  const headers = [
    t('kpiBrief.cases.id'),
    t('kpiBrief.cases.title'),
    t('kpiBrief.cases.assignee'),
    t('kpiBrief.cases.status'),
    t('kpiBrief.cases.planDate'),
    t('kpiBrief.cases.overdueDays'),
    t('kpiBrief.cases.progress'),
    t('kpiBrief.cases.lastReport'),
  ]

  const data: ExportCellValue[][] = cases.map((c) => [
    c.task.id,
    c.task.title,
    c.names.join(', '),
    statusLabel(c.status),
    formatShortDateTime(c.plan),
    c.overdueDays ?? '',
    c.task.progress,
    typeof c.task.last_report === 'string' ? c.task.last_report : '',
  ])

  exportTableToCsv(
    `kpi_brief_unfinished_${yearLabel}_${monthLabel}_${fileTimestamp()}`,
    headers,
    data,
  )
}
