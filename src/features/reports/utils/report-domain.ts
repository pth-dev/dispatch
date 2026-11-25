import type { OfficeFileItem } from '@/schemas/report'
import type { RawTask } from '@/schemas/task'
import { exportMultiSheetWorkbook } from '@/utils/export-table'
import { deriveTaskStatus, isTaskPaused, parseAssigneeList } from '@/utils/task-domain'

export type ReportTaskMetrics = {
  total: number
  completed: number
  ontime: number
  late: number
  delayed: number
  open: number
  paused: number
  ontimeRate: number
}

export type ReportGroupRow = {
  key: string
  label: string
  dept?: string
  metrics: ReportTaskMetrics
}

function emptyMetrics(): ReportTaskMetrics {
  return {
    total: 0,
    completed: 0,
    ontime: 0,
    late: 0,
    delayed: 0,
    open: 0,
    paused: 0,
    ontimeRate: 0,
  }
}

export function summarizeReportTasks(tasks: readonly RawTask[]): ReportTaskMetrics {
  const m = emptyMetrics()
  for (const task of tasks) {
    m.total += 1
    const status = deriveTaskStatus(task)
    if (isTaskPaused(task)) {
      m.paused += 1
      m.open += 1
    } else if (status === 'completed_ontime') {
      m.completed += 1
      m.ontime += 1
    } else if (status === 'late_completed') {
      m.completed += 1
      m.late += 1
    } else if (status === 'delayed_pending') {
      m.delayed += 1
      m.open += 1
    } else {
      m.open += 1
    }
  }
  m.ontimeRate = m.total > 0 ? Math.round((m.ontime / m.total) * 1000) / 10 : 0
  return m
}

function groupByKeys(
  tasks: readonly RawTask[],
  extract: (task: RawTask) => string[],
): ReportGroupRow[] {
  const map = new Map<string, RawTask[]>()
  for (const task of tasks) {
    const keys = extract(task)
    for (const key of keys) {
      const clean = key.trim() || '—'
      const list = map.get(clean)
      if (list) list.push(task)
      else map.set(clean, [task])
    }
  }
  return Array.from(map.entries())
    .map(([key, list]) => ({
      key,
      label: key,
      metrics: summarizeReportTasks(list),
    }))
    .sort((a, b) => b.metrics.total - a.metrics.total || a.label.localeCompare(b.label))
}

export function buildEfficiencyRanking(
  tasks: readonly RawTask[],
  dimension: 'assignee' | 'reporter',
): ReportGroupRow[] {
  const map = new Map<string, { dept: string; list: RawTask[] }>()
  for (const task of tasks) {
    const assignees = parseAssigneeList(task.assign_person)
    const people =
      dimension === 'reporter' ? [task.reporter || '—'] : assignees.length > 0 ? assignees : ['—']
    for (const person of people) {
      const clean = person.trim() || '—'
      const entry = map.get(clean)
      if (entry) {
        entry.list.push(task)
      } else {
        map.set(clean, { dept: task.assigned_unit || '—', list: [task] })
      }
    }
  }
  return Array.from(map.entries())
    .map(([key, entry]) => ({
      key,
      label: key,
      dept: entry.dept,
      metrics: summarizeReportTasks(entry.list),
    }))
    .sort(
      (a, b) =>
        b.metrics.ontimeRate - a.metrics.ontimeRate ||
        b.metrics.total - a.metrics.total ||
        a.label.localeCompare(b.label),
    )
}

export async function exportPeriodicKpiWorkbook(
  tasks: readonly RawTask[],
  start: string,
  end: string,
): Promise<void> {
  if (tasks.length === 0) return
  const overall = summarizeReportTasks(tasks)
  const byTrend = groupByKeys(tasks, (t) => [(t.createdAt || '').split(/[ T]/)[0] || '—']).sort(
    (a, b) => a.key.localeCompare(b.key),
  )
  const byDept = groupByKeys(tasks, (t) => [t.assigned_unit || '—'])
  const byPeople = buildEfficiencyRanking(tasks, 'assignee')
  const byType = groupByKeys(tasks, (t) => [t.task_type || '—'])
  const bySite = groupByKeys(tasks, (t) =>
    (t.site || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  )

  const groupHeaders = [
    'Mục / 项目',
    'Tổng / 总数',
    'Hoàn thành / 已完成',
    'Đúng hạn / 如期',
    'HT trễ / 逾期完成',
    'Quá hạn / 逾期未结',
    'Đang XL / 处理中',
    'Tỷ lệ đúng hạn / 如期率',
  ]
  const toGroupRows = (rows: ReportGroupRow[]) =>
    rows.map((r) => [
      r.label,
      r.metrics.total,
      r.metrics.completed,
      r.metrics.ontime,
      r.metrics.late,
      r.metrics.delayed,
      r.metrics.open,
      `${r.metrics.ontimeRate}%`,
    ])

  await exportMultiSheetWorkbook(`KPI_Report_${start}_to_${end}.xlsx`, [
    {
      name: 'KPI_Summary',
      headers: ['Chỉ tiêu / 指标', 'Giá trị / 数值'],
      colWidths: [30, 22],
      rows: [
        ['Khoảng thời gian / 统计区间', `${start} ~ ${end}`],
        ['Tổng nhiệm vụ / 总任务数', overall.total],
        ['Hoàn thành / 已完成', overall.completed],
        ['Đúng hạn / 如期完成', overall.ontime],
        ['Hoàn thành trễ / 逾期完成', overall.late],
        ['Quá hạn chưa xong / 逾期未结', overall.delayed],
        ['Đang xử lý / 处理中', overall.open],
        ['Tỷ lệ đúng hạn / 如期结案率', `${overall.ontimeRate}%`],
      ],
    },
    { name: 'Trend', headers: groupHeaders, rows: toGroupRows(byTrend) },
    { name: 'Departments', headers: groupHeaders, rows: toGroupRows(byDept) },
    { name: 'People', headers: groupHeaders, rows: toGroupRows(byPeople) },
    { name: 'Task_Types', headers: groupHeaders, rows: toGroupRows(byType) },
    { name: 'Sites', headers: groupHeaders, rows: toGroupRows(bySite) },
    {
      name: 'Details',
      headers: [
        'ID',
        'Tiêu đề / 标题',
        'Bộ phận / 部门',
        'Người xử lý / 受理人',
        'Loại / 类型',
        'Khu vực / 厂区',
        'Hạn / 期限',
        'Tiến độ / 进度',
        'Trạng thái / 状态',
      ],
      colWidths: [10, 40, 18, 22, 20, 14, 18, 12, 18],
      rows: tasks.map((t) => [
        t.id,
        t.title,
        t.assigned_unit,
        t.assign_person,
        t.task_type,
        t.site,
        t.due_date,
        `${t.progress}%`,
        deriveTaskStatus(t),
      ]),
    },
  ])
}

function getTaskReportSummaryText(task: RawTask): string {
  if (typeof task.last_report === 'string' && task.last_report.trim()) {
    return task.last_report
  }
  return typeof task.all_reports === 'string' ? task.all_reports : ''
}

export async function exportProgressWorkbook(
  tasks: readonly RawTask[],
  start: string,
  end: string,
): Promise<void> {
  if (tasks.length === 0) return
  await exportMultiSheetWorkbook(`Progress_Report_${start}_to_${end}.xlsx`, [
    {
      name: 'Progress',
      headers: [
        'ID',
        'Tiêu đề / 标题',
        'Bộ phận / 部门',
        'Người giao / 指派人',
        'Người xử lý / 受理人',
        'Hạn / 期限',
        'Tiến độ / 进度',
        'Trạng thái / 状态',
        'Báo cáo gần nhất / 最新回报',
      ],
      colWidths: [10, 38, 18, 18, 22, 18, 10, 18, 55],
      rows: tasks.map((t) => [
        t.id,
        t.title,
        t.assigned_unit,
        t.reporter,
        t.assign_person,
        t.due_date,
        `${t.progress}%`,
        deriveTaskStatus(t),
        getTaskReportSummaryText(t),
      ]),
    },
  ])
}

export async function exportEfficiencyWorkbook(
  rows: readonly ReportGroupRow[],
  dimension: 'assignee' | 'reporter',
  start: string,
  end: string,
): Promise<void> {
  if (rows.length === 0) return
  await exportMultiSheetWorkbook(`Efficiency_${dimension}_${start}_to_${end}.xlsx`, [
    {
      name: 'Efficiency',
      headers: [
        '#',
        'Nhân sự / 人员',
        'Bộ phận / 部门',
        'Tổng / 总数',
        'Đúng hạn / 如期',
        'HT trễ / 逾期完成',
        'Quá hạn / 逾期未结',
        'Đang XL / 处理中',
        'Tỷ lệ đúng hạn / 如期率',
      ],
      colWidths: [6, 24, 18, 10, 10, 12, 12, 10, 14],
      rows: rows.map((r, idx) => [
        idx + 1,
        r.label,
        r.dept || '—',
        r.metrics.total,
        r.metrics.ontime,
        r.metrics.late,
        r.metrics.delayed,
        r.metrics.open,
        `${r.metrics.ontimeRate}%`,
      ]),
    },
  ])
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function buildStandaloneWebReportHtml(options: {
  title: string
  reportNo: string
  subjectLabel: string
  rangeStart: string
  rangeEnd: string
  author: string
  tasks: readonly RawTask[]
  includeHistory: boolean
  hideConfidential: boolean
  officeFiles?: readonly OfficeFileItem[]
}): string {
  const metrics = summarizeReportTasks(options.tasks)
  const rowsHtml = options.tasks
    .map((task) => {
      const isMasked = options.hideConfidential && task.confidential > 0
      const displayTitle = isMasked
        ? `[Confidential #${task.id}]`
        : task.title || `#${task.id}`
      const historyCell =
        options.includeHistory && !isMasked
          ? `<div style="margin-top:4px;font-size:12px;color:#475569;white-space:pre-wrap;">${escapeHtml(getTaskReportSummaryText(task))}</div>`
          : ''
      return `<tr>
        <td style="border:1px solid #cbd5e1;padding:6px;">#${task.id}</td>
        <td style="border:1px solid #cbd5e1;padding:6px;"><strong>${escapeHtml(displayTitle)}</strong>${historyCell}</td>
        <td style="border:1px solid #cbd5e1;padding:6px;">${escapeHtml(task.assigned_unit || '—')}</td>
        <td style="border:1px solid #cbd5e1;padding:6px;">${escapeHtml(task.assign_person || '—')}</td>
        <td style="border:1px solid #cbd5e1;padding:6px;">${escapeHtml(task.due_date || '—')}</td>
        <td style="border:1px solid #cbd5e1;padding:6px;text-align:right;">${task.progress}%</td>
      </tr>`
    })
    .join('')

  const officeHtml =
    options.officeFiles && options.officeFiles.length > 0
      ? `<h2 style="font-size:16px;margin-top:20px;">Word / Excel Attachments (${options.officeFiles.length})</h2>
         <ul style="font-size:13px;line-height:1.6;">${options.officeFiles
           .map((f) => `<li>#${f.task_id} — ${escapeHtml(f.hidden ? '[Confidential]' : f.name)}</li>`)
           .join('')}</ul>`
      : ''

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(options.title)}</title>
</head>
<body style="font-family:Inter,Arial,sans-serif;color:#1e293b;max-width:960px;margin:24px auto;padding:0 16px;">
  <header style="border-bottom:2px solid #1f6feb;padding-bottom:12px;margin-bottom:16px;">
    <h1 style="margin:0 0 6px;font-size:22px;">${escapeHtml(options.title)}</h1>
    <div style="font-size:13px;color:#475569;">
      ${escapeHtml(options.reportNo)} · ${escapeHtml(options.subjectLabel)} · ${escapeHtml(options.rangeStart)} ~ ${escapeHtml(options.rangeEnd)} · ${escapeHtml(options.author)}
    </div>
  </header>
  <section style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;">Total: <strong>${metrics.total}</strong></div>
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;">Completed: <strong>${metrics.completed}</strong></div>
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;">On-time: <strong>${metrics.ontime} (${metrics.ontimeRate}%)</strong></div>
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;">Overdue: <strong>${metrics.delayed}</strong></div>
  </section>
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead>
      <tr style="background:#f8fafc;">
        <th style="border:1px solid #cbd5e1;padding:6px;text-align:left;">ID</th>
        <th style="border:1px solid #cbd5e1;padding:6px;text-align:left;">Task</th>
        <th style="border:1px solid #cbd5e1;padding:6px;text-align:left;">Department</th>
        <th style="border:1px solid #cbd5e1;padding:6px;text-align:left;">Assignee</th>
        <th style="border:1px solid #cbd5e1;padding:6px;text-align:left;">Due</th>
        <th style="border:1px solid #cbd5e1;padding:6px;text-align:right;">Progress</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  ${officeHtml}
</body>
</html>`
}

const BLOCKED_HTML_TAGS = 'script,iframe,object,embed,base,meta[http-equiv="refresh"]'
const UNSAFE_URI_RE = /^\s*(javascript|vbscript|data):/i

/**
 * Strips executable elements/handlers and injects a strict CSP meta tag
 * before opening archived report HTML in a same-origin blob tab.
 */
export function hardenArchivedReportHtml(rawHtml: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(rawHtml, 'text/html')

  for (const el of Array.from(doc.querySelectorAll(BLOCKED_HTML_TAGS))) {
    el.remove()
  }

  for (const el of Array.from(doc.querySelectorAll('*'))) {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase()
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name)
      } else if (
        (name === 'href' || name === 'src' || name === 'action' || name === 'formaction') &&
        UNSAFE_URI_RE.test(attr.value)
      ) {
        el.removeAttribute(attr.name)
      }
    }
  }

  const cspMeta = doc.createElement('meta')
  cspMeta.setAttribute('http-equiv', 'Content-Security-Policy')
  cspMeta.setAttribute('content', "script-src 'none'; object-src 'none'; base-uri 'none';")
  doc.head.prepend(cspMeta)

  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`
}

export function triggerTextFileDownload(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
