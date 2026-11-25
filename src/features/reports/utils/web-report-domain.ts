import type { OfficeFileItem } from '@/schemas/report'
import type { RawTask } from '@/schemas/task'
import { exportMultiSheetWorkbook, type ExcelSheetSpec } from '@/utils/export-table'
import {
  deriveTaskStatus,
  parseAssigneeList,
  parseReqDepts,
  parseSites,
  sameDept,
} from '@/utils/task-domain'
import {
  addTaskToFlowAgg,
  createEmptyFlowAgg,
  formatRateText,
  type DirectoryLookupUser,
} from './periodic-kpi-domain'
import { triggerTextFileDownload } from './report-domain'

export type WebReportSubject = 'SELF' | 'DEPT' | 'FILTER' | 'PERSON'
export type WebReportLang = 'bi' | 'vi' | 'zh-CN' | 'zh-TW'

export type WebReportOptions = {
  chart: boolean
  unit: boolean
  person: boolean
  cat: boolean
  exc: boolean
  kpi: boolean
  precautions: boolean
  content: boolean
  office: boolean
  history: boolean
  mask: boolean
  sign: boolean
}

export const DEFAULT_WEB_REPORT_OPTIONS: WebReportOptions = {
  chart: true,
  unit: true,
  person: true,
  cat: true,
  exc: true,
  kpi: true,
  precautions: true,
  content: false,
  office: false,
  history: true,
  mask: false,
  sign: true,
}

export type WebReportQueueTarget = {
  key: string
  subject: WebReportSubject
  label: string
  dept?: string
  username?: string
}

export type BuiltWebReport = {
  target: WebReportQueueTarget
  title: string
  reportNo: string
  fileBase: string
  lang: WebReportLang
  rangeStart: string
  rangeEnd: string
  mask: boolean
  primary: RawTask[]
  secondary: RawTask[]
  html: string
}

function esc(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getSummaryText(task: RawTask): string {
  if (typeof task.last_report === 'string' && task.last_report.trim()) return task.last_report
  return typeof task.all_reports === 'string' ? task.all_reports : ''
}

export function splitPrimarySecondaryTasks(
  tasks: readonly RawTask[],
  target: WebReportQueueTarget,
  currentUsername: string,
  currentDept: string,
): { primary: RawTask[]; secondary: RawTask[] } {
  if (target.subject === 'SELF' || target.subject === 'PERSON') {
    const uname = (target.username || currentUsername).toLowerCase()
    const primary = tasks.filter((t) =>
      parseAssigneeList(t.assign_person).some((a) => a.toLowerCase() === uname),
    )
    const primaryIds = new Set(primary.map((t) => t.id))
    const secondary = tasks.filter(
      (t) => !primaryIds.has(t.id) && (t.reporter || '').toLowerCase() === uname,
    )
    return { primary, secondary }
  }

  if (target.subject === 'DEPT') {
    const deptKey = target.dept ?? currentDept
    if (!deptKey) return { primary: [...tasks], secondary: [] }
    const primary = tasks.filter((t) => sameDept(t.assigned_unit, deptKey))
    const primaryIds = new Set(primary.map((t) => t.id))
    const secondary = tasks.filter(
      (t) =>
        !primaryIds.has(t.id) &&
        parseReqDepts(t.req_depts, t.req_dept).some((d) => sameDept(d, deptKey)),
    )
    return { primary, secondary }
  }

  return { primary: [...tasks], secondary: [] }
}

export function buildRichWebReportHtml(params: {
  target: WebReportQueueTarget
  title: string
  reportNo: string
  lang: WebReportLang
  rangeStart: string
  rangeEnd: string
  author: string
  note: string
  primary: readonly RawTask[]
  secondary: readonly RawTask[]
  options: WebReportOptions
  officeFiles?: readonly OfficeFileItem[]
}): string {
  const {
    target,
    title,
    reportNo,
    lang,
    rangeStart,
    rangeEnd,
    author,
    note,
    primary,
    secondary,
    options,
    officeFiles = [],
  } = params

  const agg = createEmptyFlowAgg()
  for (const t of primary) addTaskToFlowAgg(agg, t)
  const kpiFinalRate = agg.total > 0 ? Math.round((agg.completed / agg.total) * 1000) / 10 : 0
  const kpiOntimeRate = agg.total > 0 ? Math.round((agg.onTime / agg.total) * 1000) / 10 : 0
  const kpiScore =
    agg.total > 0 ? Math.round((kpiFinalRate * 0.6 + kpiOntimeRate * 0.4) * 10) / 10 : null
  const kpiGrade =
    kpiScore === null ? '-' : kpiScore >= 90 ? 'A' : kpiScore >= 80 ? 'B' : kpiScore >= 60 ? 'C' : 'D'

  const renderTaskRows = (list: readonly RawTask[]) =>
    list
      .map((t) => {
        const masked = options.mask && t.confidential > 0
        const displayTitle = masked ? `[Confidential #${t.id}]` : t.title || `#${t.id}`
        const extraBlocks: string[] = []
        if (!masked && options.precautions && t.precautions) {
          extraBlocks.push(
            `<div style="margin-top:4px;font-size:11px;color:#b91c1c;"><b>Lưu ý / 注意:</b> ${esc(t.precautions)}</div>`,
          )
        }
        if (!masked && options.content && t.content) {
          extraBlocks.push(
            `<div style="margin-top:4px;font-size:11px;color:#334155;white-space:pre-wrap;">${esc(t.content)}</div>`,
          )
        }
        if (!masked && options.history) {
          const summary = getSummaryText(t)
          if (summary) {
            extraBlocks.push(
              `<div style="margin-top:4px;font-size:11px;color:#475569;white-space:pre-wrap;">${esc(summary)}</div>`,
            )
          }
        }
        return `<tr>
          <td style="border:1px solid #cbd5e1;padding:6px;">#${t.id}</td>
          <td style="border:1px solid #cbd5e1;padding:6px;"><b>${esc(displayTitle)}</b>${extraBlocks.join('')}</td>
          <td style="border:1px solid #cbd5e1;padding:6px;">${esc(t.assigned_unit || '—')}</td>
          <td style="border:1px solid #cbd5e1;padding:6px;">${esc(t.assign_person || '—')}</td>
          <td style="border:1px solid #cbd5e1;padding:6px;">${esc(t.due_date || '—')}</td>
          <td style="border:1px solid #cbd5e1;padding:6px;text-align:right;">${t.progress}%</td>
          <td style="border:1px solid #cbd5e1;padding:6px;">${esc(deriveTaskStatus(t))}</td>
        </tr>`
      })
      .join('')

  const sections: string[] = []

  if (options.chart || options.kpi) {
    sections.push(`
      <h2 style="font-size:15px;margin:18px 0 8px;border-left:4px solid #1f6feb;padding-left:8px;">1. Tổng quan & KPI / 摘要与 KPI</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:12px;">
        <tr>
          <td style="border:1px solid #e2e8f0;padding:8px;">Tổng NV / 总数: <b>${agg.total}</b></td>
          <td style="border:1px solid #e2e8f0;padding:8px;">Hoàn thành / 已完成: <b>${agg.completed}</b></td>
          <td style="border:1px solid #e2e8f0;padding:8px;">Đúng hạn / 如期: <b style="color:#15803d;">${agg.onTime} (${formatRateText(agg.onTime, agg.total)})</b></td>
          <td style="border:1px solid #e2e8f0;padding:8px;">Quá hạn / 逾期未结: <b style="color:#dc2626;">${agg.delayed}</b></td>
          <td style="border:1px solid #e2e8f0;padding:8px;">KPI: <b>${kpiScore === null ? '-' : `${kpiScore} (${kpiGrade})`}</b></td>
        </tr>
      </table>`)
  }

  if (options.unit) {
    const byUnit = new Map<string, ReturnType<typeof createEmptyFlowAgg>>()
    for (const t of primary) {
      const k = t.assigned_unit || '—'
      const cur = byUnit.get(k) ?? createEmptyFlowAgg()
      addTaskToFlowAgg(cur, t)
      byUnit.set(k, cur)
    }
    sections.push(`
      <h2 style="font-size:15px;margin:18px 0 8px;border-left:4px solid #1f6feb;padding-left:8px;">Thống kê theo bộ phận / 按部门统计</h2>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr style="background:#f8fafc;">
          <th style="border:1px solid #cbd5e1;padding:6px;text-align:left;">Bộ phận / 部门</th>
          <th style="border:1px solid #cbd5e1;padding:6px;text-align:right;">Tổng</th>
          <th style="border:1px solid #cbd5e1;padding:6px;text-align:right;">Đúng hạn</th>
          <th style="border:1px solid #cbd5e1;padding:6px;text-align:right;">HT trễ</th>
          <th style="border:1px solid #cbd5e1;padding:6px;text-align:right;">Quá hạn</th>
          <th style="border:1px solid #cbd5e1;padding:6px;text-align:right;">Tỷ lệ đúng hạn</th>
        </tr></thead>
        <tbody>${Array.from(byUnit.entries())
          .map(
            ([k, v]) => `<tr>
            <td style="border:1px solid #cbd5e1;padding:6px;">${esc(k)}</td>
            <td style="border:1px solid #cbd5e1;padding:6px;text-align:right;">${v.total}</td>
            <td style="border:1px solid #cbd5e1;padding:6px;text-align:right;">${v.onTime}</td>
            <td style="border:1px solid #cbd5e1;padding:6px;text-align:right;">${v.late}</td>
            <td style="border:1px solid #cbd5e1;padding:6px;text-align:right;">${v.delayed}</td>
            <td style="border:1px solid #cbd5e1;padding:6px;text-align:right;">${formatRateText(v.onTime, v.total)}</td>
          </tr>`,
          )
          .join('')}</tbody>
      </table>`)
  }

  const renderBreakdownTable = (
    heading: string,
    colLabel: string,
    groups: Map<string, ReturnType<typeof createEmptyFlowAgg>>,
  ) => `
      <h2 style="font-size:15px;margin:18px 0 8px;border-left:4px solid #1f6feb;padding-left:8px;">${heading}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr style="background:#f8fafc;">
          <th style="border:1px solid #cbd5e1;padding:6px;text-align:left;">${colLabel}</th>
          <th style="border:1px solid #cbd5e1;padding:6px;text-align:right;">Tổng</th>
          <th style="border:1px solid #cbd5e1;padding:6px;text-align:right;">Đúng hạn</th>
          <th style="border:1px solid #cbd5e1;padding:6px;text-align:right;">HT trễ</th>
          <th style="border:1px solid #cbd5e1;padding:6px;text-align:right;">Quá hạn</th>
          <th style="border:1px solid #cbd5e1;padding:6px;text-align:right;">% Đúng hạn</th>
        </tr></thead>
        <tbody>${Array.from(groups.entries())
          .sort((a, b) => b[1].total - a[1].total)
          .map(
            ([k, v]) => `<tr>
            <td style="border:1px solid #cbd5e1;padding:6px;">${esc(k)}</td>
            <td style="border:1px solid #cbd5e1;padding:6px;text-align:right;">${v.total}</td>
            <td style="border:1px solid #cbd5e1;padding:6px;text-align:right;">${v.onTime}</td>
            <td style="border:1px solid #cbd5e1;padding:6px;text-align:right;">${v.late}</td>
            <td style="border:1px solid #cbd5e1;padding:6px;text-align:right;">${v.delayed}</td>
            <td style="border:1px solid #cbd5e1;padding:6px;text-align:right;">${formatRateText(v.onTime, v.total)}</td>
          </tr>`,
          )
          .join('')}</tbody>
      </table>`

  if (options.person && primary.length > 0) {
    const byPerson = new Map<string, ReturnType<typeof createEmptyFlowAgg>>()
    for (const t of primary) {
      const assignees = parseAssigneeList(t.assign_person)
      const list = assignees.length > 0 ? assignees : ['—']
      for (const p of list) {
        const entry = byPerson.get(p) ?? createEmptyFlowAgg()
        addTaskToFlowAgg(entry, t)
        byPerson.set(p, entry)
      }
    }
    sections.push(
      renderBreakdownTable('Thống kê theo nhân sự / 人员统计', 'Nhân sự / 人员', byPerson),
    )
  }

  if (options.cat && primary.length > 0) {
    const byCat = new Map<string, ReturnType<typeof createEmptyFlowAgg>>()
    for (const t of primary) {
      const key = (t.task_type || '').trim() || '—'
      const entry = byCat.get(key) ?? createEmptyFlowAgg()
      addTaskToFlowAgg(entry, t)
      byCat.set(key, entry)
    }
    sections.push(
      renderBreakdownTable('Thống kê theo loại nhiệm vụ / 类型统计', 'Loại hình / 类型', byCat),
    )
  }

  if (options.exc) {
    const overdue = primary.filter((t) => {
      const st = deriveTaskStatus(t)
      return st === 'delayed_pending' || st === 'late_completed'
    })
    if (overdue.length > 0) {
      sections.push(`
        <h2 style="font-size:15px;margin:18px 0 8px;border-left:4px solid #dc2626;padding-left:8px;">Danh sách quá hạn & trễ / 逾期清单 (${overdue.length})</h2>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="background:#fef2f2;">
            <th style="border:1px solid #cbd5e1;padding:6px;">ID</th>
            <th style="border:1px solid #cbd5e1;padding:6px;text-align:left;">Nhiệm vụ</th>
            <th style="border:1px solid #cbd5e1;padding:6px;text-align:left;">BP</th>
            <th style="border:1px solid #cbd5e1;padding:6px;text-align:left;">Người nhận</th>
            <th style="border:1px solid #cbd5e1;padding:6px;text-align:left;">Hạn</th>
            <th style="border:1px solid #cbd5e1;padding:6px;text-align:right;">Tiến độ</th>
            <th style="border:1px solid #cbd5e1;padding:6px;text-align:left;">Trạng thái</th>
          </tr></thead>
          <tbody>${renderTaskRows(overdue)}</tbody>
        </table>`)
    }
  }

  sections.push(`
    <h2 style="font-size:15px;margin:18px 0 8px;border-left:4px solid #1f6feb;padding-left:8px;">Danh sách nhiệm vụ chính / 主要任务明细 (${primary.length})</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead><tr style="background:#f8fafc;">
        <th style="border:1px solid #cbd5e1;padding:6px;">ID</th>
        <th style="border:1px solid #cbd5e1;padding:6px;text-align:left;">Nhiệm vụ / 任务</th>
        <th style="border:1px solid #cbd5e1;padding:6px;text-align:left;">BP / 部门</th>
        <th style="border:1px solid #cbd5e1;padding:6px;text-align:left;">Người nhận / 受理人</th>
        <th style="border:1px solid #cbd5e1;padding:6px;text-align:left;">Hạn / 期限</th>
        <th style="border:1px solid #cbd5e1;padding:6px;text-align:right;">%</th>
        <th style="border:1px solid #cbd5e1;padding:6px;text-align:left;">Trạng thái</th>
      </tr></thead>
      <tbody>${renderTaskRows(primary)}</tbody>
    </table>`)

  if (secondary.length > 0) {
    sections.push(`
      <h2 style="font-size:15px;margin:18px 0 8px;border-left:4px solid #64748b;padding-left:8px;">Nhiệm vụ theo dõi (giao đi / yêu cầu) / 追踪任务 (${secondary.length})</h2>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr style="background:#f8fafc;">
          <th style="border:1px solid #cbd5e1;padding:6px;">ID</th>
          <th style="border:1px solid #cbd5e1;padding:6px;text-align:left;">Nhiệm vụ</th>
          <th style="border:1px solid #cbd5e1;padding:6px;text-align:left;">BP</th>
          <th style="border:1px solid #cbd5e1;padding:6px;text-align:left;">Người nhận</th>
          <th style="border:1px solid #cbd5e1;padding:6px;text-align:left;">Hạn</th>
          <th style="border:1px solid #cbd5e1;padding:6px;text-align:right;">%</th>
          <th style="border:1px solid #cbd5e1;padding:6px;text-align:left;">Trạng thái</th>
        </tr></thead>
        <tbody>${renderTaskRows(secondary)}</tbody>
      </table>`)
  }

  if (options.office && officeFiles.length > 0) {
    sections.push(`
      <h2 style="font-size:15px;margin:18px 0 8px;border-left:4px solid #1f6feb;padding-left:8px;">Tệp Word / Excel đính kèm (${officeFiles.length})</h2>
      <ul style="font-size:12px;line-height:1.6;">${officeFiles
        .map((f) => `<li>#${f.task_id} — ${esc(f.hidden ? '[Confidential]' : f.name)}</li>`)
        .join('')}</ul>`)
  }

  if (note.trim()) {
    sections.push(`
      <h2 style="font-size:15px;margin:18px 0 8px;border-left:4px solid #1f6feb;padding-left:8px;">Ghi chú & Kết luận / 备注与结论</h2>
      <p style="font-size:13px;white-space:pre-wrap;">${esc(note.trim())}</p>`)
  }

  if (options.sign) {
    sections.push(`
      <table style="width:100%;border-collapse:collapse;margin-top:24px;font-size:12px;text-align:center;">
        <tr>
          <td style="border:1px solid #cbd5e1;padding:12px;width:33%;"><b>Lập biểu / 编制</b><br/><br/>${esc(author)}</td>
          <td style="border:1px solid #cbd5e1;padding:12px;width:33%;"><b>Kiểm tra / 审核</b><br/><br/>&nbsp;</td>
          <td style="border:1px solid #cbd5e1;padding:12px;width:34%;"><b>Phê duyệt / 核准</b><br/><br/>&nbsp;</td>
        </tr>
      </table>`)
  }

  const htmlLang = lang === 'bi' ? 'vi' : lang
  return `<!DOCTYPE html>
<html lang="${esc(htmlLang)}">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
</head>
<body style="font-family:Inter,'Microsoft YaHei',Arial,sans-serif;color:#1e293b;max-width:980px;margin:20px auto;padding:0 16px;">
  <header style="border-bottom:2px solid #1f6feb;padding-bottom:10px;margin-bottom:14px;">
    <h1 style="margin:0 0 6px;font-size:21px;">${esc(title)}</h1>
    <div style="font-size:12px;color:#475569;">
      ${esc(reportNo)} · ${esc(target.label)} · ${esc(rangeStart)} ~ ${esc(rangeEnd)} · ${esc(author)}
    </div>
  </header>
  ${sections.join('\n')}
</body>
</html>`
}

export function wrapAsWordDocument(html: string, title: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const bodyInner = doc.body?.innerHTML ?? html
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8" /><title>${esc(title)}</title></head>
<body style="font-family:Arial,'Microsoft YaHei',sans-serif;color:#1e293b;">${bodyInner}</body>
</html>`
}

export function downloadWebReportAsWord(html: string, fileBase: string, title: string): void {
  const wordDoc = wrapAsWordDocument(html, title)
  triggerTextFileDownload(wordDoc, `${fileBase}.doc`, 'application/msword;charset=utf-8')
}

export async function exportWebReportAsExcel(report: BuiltWebReport): Promise<void> {
  const detailHeaders = ['ID', 'Tiêu đề', 'BP Nhận', 'Người nhận', 'Khu vực', 'Hạn', 'Tiến độ', 'Trạng thái']
  const toRows = (list: readonly RawTask[]) =>
    list.map((t) => [
      t.id,
      report.mask && t.confidential > 0 ? `[Confidential #${t.id}]` : t.title,
      t.assigned_unit || '',
      t.assign_person || '',
      parseSites(t.site).join(', '),
      t.due_date || '',
      `${t.progress}%`,
      deriveTaskStatus(t),
    ])

  const sheets: ExcelSheetSpec[] = [
    {
      name: 'Thong tin',
      headers: ['Mục', 'Giá trị'],
      rows: [
        ['Tiêu đề', report.title],
        ['Số báo cáo', report.reportNo],
        ['Đối tượng', report.target.label],
        ['Khoảng ngày', `${report.rangeStart} ~ ${report.rangeEnd}`],
        ['NV chính', report.primary.length],
        ['NV theo dõi', report.secondary.length],
      ],
    },
    { name: 'NV Chinh', headers: detailHeaders, rows: toRows(report.primary) },
  ]
  if (report.secondary.length > 0) {
    sheets.push({ name: 'NV Theo doi', headers: detailHeaders, rows: toRows(report.secondary) })
  }
  await exportMultiSheetWorkbook(`${report.fileBase}.xlsx`, sheets)
}

export async function exportArchivedHtmlAsExcel(html: string, fileBase: string): Promise<void> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const tables = Array.from(doc.querySelectorAll('table'))
  const sheets: ExcelSheetSpec[] = tables
    .map((table, idx) => {
      const trs = Array.from(table.querySelectorAll('tr'))
      const rows = trs.map((tr) =>
        Array.from(tr.querySelectorAll('th,td')).map((cell) => (cell.textContent || '').trim()),
      )
      const [headers = [], ...body] = rows
      return {
        name: `Section_${idx + 1}`,
        headers,
        rows: body,
      }
    })
    .filter((s) => s.headers.length > 0)

  if (sheets.length === 0) {
    sheets.push({
      name: 'Report',
      headers: ['Content'],
      rows: [[(doc.body?.textContent || '').trim()]],
    })
  }
  await exportMultiSheetWorkbook(`${fileBase}.xlsx`, sheets)
}

export function buildQueueTargets(params: {
  subjects: ReadonlySet<WebReportSubject>
  selectedDepts: readonly string[]
  selectedUsers: readonly DirectoryLookupUser[]
  labels: Record<WebReportSubject, string>
  allDeptsLabel: string
  currentDept: string
}): WebReportQueueTarget[] {
  const queue: WebReportQueueTarget[] = []
  if (params.subjects.has('SELF')) {
    queue.push({ key: 'SELF', subject: 'SELF', label: params.labels.SELF })
  }
  if (params.subjects.has('DEPT')) {
    if (params.selectedDepts.length > 0) {
      for (const d of params.selectedDepts) {
        queue.push({
          key: `DEPT:${d || 'ALL'}`,
          subject: 'DEPT',
          dept: d,
          label: d ? `${params.labels.DEPT}: ${d}` : `${params.labels.DEPT}: ${params.allDeptsLabel}`,
        })
      }
    } else {
      queue.push({
        key: `DEPT:${params.currentDept || 'ALL'}`,
        subject: 'DEPT',
        dept: params.currentDept,
        label: params.currentDept
          ? `${params.labels.DEPT}: ${params.currentDept}`
          : params.labels.DEPT,
      })
    }
  }
  if (params.subjects.has('FILTER')) {
    queue.push({ key: 'FILTER', subject: 'FILTER', label: params.labels.FILTER })
  }
  if (params.subjects.has('PERSON')) {
    for (const u of params.selectedUsers) {
      queue.push({
        key: `PERSON:${u.username}`,
        subject: 'PERSON',
        username: u.username,
        label: `${params.labels.PERSON}: ${u.username}${u.fullname ? ` / ${u.fullname}` : ''}`,
      })
    }
  }
  return queue
}
