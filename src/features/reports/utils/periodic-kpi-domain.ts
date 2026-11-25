import type { RawTask } from '@/schemas/task'
import { formatLocalDateInput } from '@/utils/date-range'
import { exportMultiSheetWorkbook, type ExportCellValue } from '@/utils/export-table'
import { getKpiGrade, type KpiGradeInfo } from '@/utils/kpi-domain'
import {
  deriveTaskStatus,
  isTaskPaused,
  parseAssigneeList,
  parseLocalDateTime,
  parseSites,
  sameDept,
} from '@/utils/task-domain'

export type DirectoryLookupUser = {
  username: string
  fullname?: string | null
  dept?: string | null
}

export type PeriodicKpiCycle = 'week' | 'month' | 'quarter' | 'year' | 'custom'
export type TrendGranularity = 'day' | 'week' | 'month'

export type PeriodicKpiRangeInput = {
  type: PeriodicKpiCycle
  year: number
  week: number
  month: number
  quarter: number
  customStart: string
  customEnd: string
}

export type ResolvedPeriodicRange = {
  type: PeriodicKpiCycle
  start: Date
  end: Date
  startStr: string
  endStr: string
  gran: TrendGranularity
  label: string
}

export type FlowAgg = {
  total: number
  completed: number
  onTime: number
  late: number
  delayed: number
  inProgress: number
  notStarted: number
  responded: number
  oneHr: number
  respSum: number
  leadSum: number
  leadCnt: number
}

export type PersonIdentity = {
  key: string
  username: string
  fullname: string
  dept: string
}

export type PersonFlowRow = {
  info: PersonIdentity
  agg: FlowAgg
  ontimeRate: number
}

export type PersonKpiV16Row = {
  key: string
  username: string
  fullname: string
  dept: string
  total: number
  paused: number
  completed: number
  ontime: number
  late: number
  pending: number
  overdue: number
  responded: number
  finalRate: number
  ontimeRate: number
  lateRate: number
  responseRate: number
  partFinal: number
  partOntime: number
  score: number | null
  grade: KpiGradeInfo
}

export type PeriodicKpiSummary = {
  total: number
  completed: number
  ontime: number
  late: number
  pending: number
  overdue: number
  paused: number
  responded: number
  people: number
  finalRate: number
  ontimeRate: number
  partFinal: number
  partOntime: number
  score: number | null
  grade: KpiGradeInfo
}

export type PeriodicKpiDataset = {
  range: ResolvedPeriodicRange
  unit: string
  created: RawTask[]
  finished: RawTask[]
  totalAgg: FlowAgg
  finAgg: FlowAgg
  peopleFlow: PersonFlowRow[]
  topPeople: PersonFlowRow[]
  kpiRows: PersonKpiV16Row[]
  kpiSummary: PeriodicKpiSummary
}

const KPI_WEIGHT_FINAL = 60
const KPI_WEIGHT_ONTIME = 40
const MS_PER_DAY = 86_400_000

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

function inDateRange(date: Date | null, start: Date, end: Date): boolean {
  if (!date || Number.isNaN(date.getTime())) return false
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime()
}

export function formatRateText(numerator: number, denominator: number): string {
  if (denominator <= 0) return 'N/A'
  return `${round1((numerator / denominator) * 100)}%`
}

/** ISO-8601 week number & week-year (matches legacy `DU_isoWeek`). */
export function getIsoWeekInfo(date: Date = new Date()): { year: number; week: number } {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / MS_PER_DAY + 1) / 7)
  return { year: utc.getUTCFullYear(), week }
}

/** Local Monday 00:00 of the given ISO week (matches legacy `DU_isoWeekStart`). */
export function getIsoWeekStart(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4)
  const dow = jan4.getDay() || 7
  const week1Mon = new Date(year, 0, 4 - dow + 1)
  return new Date(
    week1Mon.getFullYear(),
    week1Mon.getMonth(),
    week1Mon.getDate() + (week - 1) * 7,
  )
}

export function resolvePeriodicKpiRange(input: PeriodicKpiRangeInput): ResolvedPeriodicRange | null {
  const { type, year, week, month, quarter, customStart, customEnd } = input
  if (type === 'week') {
    const start = getIsoWeekStart(year, week)
    const end = endOfDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6))
    return {
      type,
      start,
      end,
      startStr: formatLocalDateInput(start),
      endStr: formatLocalDateInput(end),
      gran: 'day',
      label: `${year} W${pad2(week)}`,
    }
  }
  if (type === 'month') {
    const start = new Date(year, month - 1, 1)
    const end = endOfDay(new Date(year, month, 0))
    return {
      type,
      start,
      end,
      startStr: formatLocalDateInput(start),
      endStr: formatLocalDateInput(end),
      gran: 'week',
      label: `${year}-${pad2(month)}`,
    }
  }
  if (type === 'quarter') {
    const start = new Date(year, (quarter - 1) * 3, 1)
    const end = endOfDay(new Date(year, quarter * 3, 0))
    return {
      type,
      start,
      end,
      startStr: formatLocalDateInput(start),
      endStr: formatLocalDateInput(end),
      gran: 'month',
      label: `${year} Q${quarter}`,
    }
  }
  if (type === 'year') {
    const start = new Date(year, 0, 1)
    const end = endOfDay(new Date(year, 11, 31))
    return {
      type,
      start,
      end,
      startStr: formatLocalDateInput(start),
      endStr: formatLocalDateInput(end),
      gran: 'month',
      label: `${year}`,
    }
  }
  if (!customStart || !customEnd || customStart > customEnd) return null
  const start = parseLocalDateTime(`${customStart} 00:00:00`)
  const parsedEnd = parseLocalDateTime(`${customEnd} 00:00:00`)
  if (!start || !parsedEnd) return null
  const end = endOfDay(parsedEnd)
  const days = Math.round((parsedEnd.getTime() - start.getTime()) / MS_PER_DAY) + 1
  const gran: TrendGranularity = days <= 31 ? 'day' : days <= 120 ? 'week' : 'month'
  return {
    type,
    start,
    end,
    startStr: customStart,
    endStr: customEnd,
    gran,
    label: `${customStart} ~ ${customEnd}`,
  }
}

export type TrendBucket = { label: string; start: Date; end: Date }

export function buildPeriodBuckets(
  start: Date,
  end: Date,
  gran: TrendGranularity,
): TrendBucket[] {
  const buckets: TrendBucket[] = []
  if (gran === 'day') {
    for (
      let d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      d <= end;
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
    ) {
      buckets.push({ label: formatLocalDateInput(d), start: new Date(d), end: endOfDay(d) })
    }
    return buckets
  }
  if (gran === 'week') {
    let d = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    while (d <= end) {
      const dow = d.getDay() === 0 ? 7 : d.getDay()
      const weekEnd = endOfDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() + (7 - dow)))
      const bucketEnd = weekEnd > end ? end : weekEnd
      const iso = getIsoWeekInfo(d)
      const label = `W${iso.week} (${formatLocalDateInput(d).slice(5)}~${formatLocalDateInput(bucketEnd).slice(5)})`
      buckets.push({ label, start: new Date(d), end: bucketEnd })
      d = new Date(bucketEnd.getFullYear(), bucketEnd.getMonth(), bucketEnd.getDate() + 1)
    }
    return buckets
  }
  let d = new Date(start.getFullYear(), start.getMonth(), 1)
  while (d <= end) {
    const bucketStart = d < start ? start : d
    const monthEnd = endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0))
    const bucketEnd = monthEnd > end ? end : monthEnd
    buckets.push({
      label: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`,
      start: bucketStart,
      end: bucketEnd,
    })
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  }
  return buckets
}

export function createEmptyFlowAgg(): FlowAgg {
  return {
    total: 0,
    completed: 0,
    onTime: 0,
    late: 0,
    delayed: 0,
    inProgress: 0,
    notStarted: 0,
    responded: 0,
    oneHr: 0,
    respSum: 0,
    leadSum: 0,
    leadCnt: 0,
  }
}

export function addTaskToFlowAgg(agg: FlowAgg, task: RawTask, now: Date = new Date()): FlowAgg {
  agg.total += 1
  const status = deriveTaskStatus(task, now)
  if (status === 'completed_ontime') {
    agg.completed += 1
    agg.onTime += 1
  } else if (status === 'late_completed') {
    agg.completed += 1
    agg.late += 1
  } else if (status === 'delayed_pending') {
    agg.delayed += 1
  } else if (status === 'in_progress') {
    agg.inProgress += 1
  } else {
    agg.notStarted += 1
  }

  if (task.first_response_mins != null && Number.isFinite(Number(task.first_response_mins))) {
    const mins = Number(task.first_response_mins)
    agg.responded += 1
    agg.respSum += mins
    if (mins <= 60) agg.oneHr += 1
  }

  if (status === 'completed_ontime' || status === 'late_completed') {
    const c = parseLocalDateTime(task.createdAt)
    const f = parseLocalDateTime(task.finish_date)
    if (c && f && f.getTime() >= c.getTime()) {
      agg.leadSum += (f.getTime() - c.getTime()) / MS_PER_DAY
      agg.leadCnt += 1
    }
  }
  return agg
}

export function buildUserLookup(
  directory: readonly DirectoryLookupUser[],
): Map<string, DirectoryLookupUser> {
  const map = new Map<string, DirectoryLookupUser>()
  for (const user of directory) {
    if (user.username) map.set(user.username.trim().toLowerCase(), user)
    if (user.fullname) map.set(user.fullname.trim().toLowerCase(), user)
  }
  return map
}

function resolvePersonIdentity(
  raw: string,
  userMap: Map<string, DirectoryLookupUser>,
): PersonIdentity {
  const clean = raw.trim()
  if (!clean) {
    return { key: '__NONE__', username: '—', fullname: '', dept: '' }
  }
  const match = userMap.get(clean.toLowerCase())
  if (match) {
    return {
      key: `u:${match.username.toLowerCase()}`,
      username: match.username,
      fullname: match.fullname || '',
      dept: match.dept || '',
    }
  }
  return { key: `r:${clean.toLowerCase()}`, username: clean, fullname: '', dept: '' }
}

/** Matches legacy `DU_kpiFinalAt`: completed+finish_date -> due_date -> kpi_at || createdAt. */
export function computeKpiFinalAt(task: RawTask): Date | null {
  if (Number(task.progress) === 100 && task.finish_date) {
    const f = parseLocalDateTime(task.finish_date)
    if (f) return f
  }
  if (task.due_date) {
    const d = parseLocalDateTime(task.due_date)
    if (d) return d
  }
  return parseLocalDateTime(task.kpi_at || task.createdAt)
}

/** Matches legacy `DU_kpiCalc` (V16.11.0-r8, basis='final'). */
export function computePeriodicKpiRows(
  tasks: readonly RawTask[],
  start: Date,
  end: Date,
  userMap: Map<string, DirectoryLookupUser>,
  now: Date = new Date(),
): PersonKpiV16Row[] {
  const map = new Map<string, PersonKpiV16Row>()

  for (const task of tasks) {
    const basisDate = computeKpiFinalAt(task)
    if (!inDateRange(basisDate, start, end)) continue

    const assignees = parseAssigneeList(task.assign_person)
    if (assignees.length === 0) continue

    const seen = new Set<string>()
    for (const raw of assignees) {
      const info = resolvePersonIdentity(raw, userMap)
      if (info.key === '__NONE__' || seen.has(info.key)) continue
      seen.add(info.key)

      let row = map.get(info.key)
      if (!row) {
        row = {
          key: info.key,
          username: info.username,
          fullname: info.fullname,
          dept: info.dept,
          total: 0,
          paused: 0,
          completed: 0,
          ontime: 0,
          late: 0,
          pending: 0,
          overdue: 0,
          responded: 0,
          finalRate: 0,
          ontimeRate: 0,
          lateRate: 0,
          responseRate: 0,
          partFinal: 0,
          partOntime: 0,
          score: null,
          grade: getKpiGrade(null),
        }
        map.set(info.key, row)
      }

      if (isTaskPaused(task)) {
        row.paused += 1
        continue
      }

      row.total += 1
      const status = deriveTaskStatus(task, now)
      if (status === 'completed_ontime') {
        row.completed += 1
        row.ontime += 1
      } else if (status === 'late_completed') {
        row.completed += 1
        row.late += 1
      } else {
        row.pending += 1
        if (status === 'delayed_pending') row.overdue += 1
      }

      if (
        task.first_response_mins != null &&
        Number.isFinite(Number(task.first_response_mins)) &&
        Number(task.first_response_mins) <= 60
      ) {
        row.responded += 1
      }
    }
  }

  return Array.from(map.values())
    .filter((r) => r.total > 0 || r.paused > 0)
    .map((r) => {
      const rate = (n: number) => (r.total > 0 ? n / r.total : 0)
      r.finalRate = round1(rate(r.completed) * 100)
      r.ontimeRate = round1(rate(r.ontime) * 100)
      r.lateRate = round1(rate(r.late) * 100)
      r.responseRate = round1(rate(r.responded) * 100)
      r.partFinal = round1(rate(r.completed) * KPI_WEIGHT_FINAL)
      r.partOntime = round1(rate(r.ontime) * KPI_WEIGHT_ONTIME)
      r.score =
        r.total > 0
          ? round1(
              Math.max(
                0,
                Math.min(
                  100,
                  rate(r.completed) * KPI_WEIGHT_FINAL + rate(r.ontime) * KPI_WEIGHT_ONTIME,
                ),
              ),
            )
          : null
      r.grade = getKpiGrade(r.score)
      return r
    })
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || b.total - a.total)
}

/** Matches legacy `DU_wrKpiSummary` (task-weighted overall KPI score). */
export function summarizePeriodicKpiRows(rows: readonly PersonKpiV16Row[]): PeriodicKpiSummary {
  const sum: PeriodicKpiSummary = {
    total: 0,
    completed: 0,
    ontime: 0,
    late: 0,
    pending: 0,
    overdue: 0,
    paused: 0,
    responded: 0,
    people: 0,
    finalRate: 0,
    ontimeRate: 0,
    partFinal: 0,
    partOntime: 0,
    score: null,
    grade: getKpiGrade(null),
  }

  for (const r of rows) {
    sum.total += r.total
    sum.completed += r.completed
    sum.ontime += r.ontime
    sum.late += r.late
    sum.pending += r.pending
    sum.overdue += r.overdue
    sum.paused += r.paused
    sum.responded += r.responded
    if (r.total > 0) sum.people += 1
  }

  const rate = (n: number) => (sum.total > 0 ? n / sum.total : 0)
  sum.finalRate = round1(rate(sum.completed) * 100)
  sum.ontimeRate = round1(rate(sum.ontime) * 100)
  sum.partFinal = round1(rate(sum.completed) * KPI_WEIGHT_FINAL)
  sum.partOntime = round1(rate(sum.ontime) * KPI_WEIGHT_ONTIME)
  sum.score =
    sum.total > 0
      ? round1(
          Math.max(
            0,
            Math.min(
              100,
              rate(sum.completed) * KPI_WEIGHT_FINAL + rate(sum.ontime) * KPI_WEIGHT_ONTIME,
            ),
          ),
        )
      : null
  sum.grade = getKpiGrade(sum.score)
  return sum
}

export function buildPeriodicKpiDataset(options: {
  flowTasks: readonly RawTask[]
  kpiTasks: readonly RawTask[]
  range: ResolvedPeriodicRange
  unit: string
  userMap: Map<string, DirectoryLookupUser>
  now?: Date
}): PeriodicKpiDataset {
  const { flowTasks, kpiTasks, range, unit, userMap, now = new Date() } = options
  const filterUnit = (list: readonly RawTask[]) =>
    unit ? list.filter((t) => sameDept(t.assigned_unit, unit)) : list

  const scopedFlow = filterUnit(flowTasks)
  const scopedKpi = filterUnit(kpiTasks)

  const created = scopedFlow.filter((t) =>
    inDateRange(parseLocalDateTime(t.createdAt), range.start, range.end),
  )
  const finished = scopedFlow.filter(
    (t) =>
      Number(t.progress) === 100 &&
      inDateRange(parseLocalDateTime(t.finish_date), range.start, range.end),
  )

  const totalAgg = createEmptyFlowAgg()
  for (const t of created) addTaskToFlowAgg(totalAgg, t, now)

  const finAgg = createEmptyFlowAgg()
  for (const t of finished) addTaskToFlowAgg(finAgg, t, now)

  const peopleMap = new Map<string, { info: PersonIdentity; agg: FlowAgg }>()
  for (const task of created) {
    const rawList = parseAssigneeList(task.assign_person)
    const keys = rawList.length > 0 ? rawList : ['']
    const seen = new Set<string>()
    for (const raw of keys) {
      const info = resolvePersonIdentity(raw, userMap)
      if (seen.has(info.key)) continue
      seen.add(info.key)
      let entry = peopleMap.get(info.key)
      if (!entry) {
        entry = { info, agg: createEmptyFlowAgg() }
        peopleMap.set(info.key, entry)
      }
      addTaskToFlowAgg(entry.agg, task, now)
    }
  }

  const peopleFlow: PersonFlowRow[] = Array.from(peopleMap.values())
    .map((entry) => ({
      info: entry.info,
      agg: entry.agg,
      ontimeRate: entry.agg.total > 0 ? round1((entry.agg.onTime / entry.agg.total) * 100) : 0,
    }))
    .sort((a, b) => b.ontimeRate - a.ontimeRate || b.agg.total - a.agg.total)

  const topPeople = peopleFlow.filter((p) => p.info.key !== '__NONE__').slice(0, 10)
  const kpiRows = computePeriodicKpiRows(scopedKpi, range.start, range.end, userMap, now)
  const kpiSummary = summarizePeriodicKpiRows(kpiRows)

  return {
    range,
    unit,
    created,
    finished,
    totalAgg,
    finAgg,
    peopleFlow,
    topPeople,
    kpiRows,
    kpiSummary,
  }
}

const AGG_HEADERS = [
  'Tổng NV / 派案数',
  'Đã HT / 已结案',
  'HT đúng hạn / 如期完成',
  'HT trễ / 逾期完成',
  'Quá hạn / 逾期未结',
  'Đang XL / 处理中',
  'Chưa XL / 未处理',
  'Tỷ lệ đúng hạn / 如期结案率',
  'Tỷ lệ HT / 结案率',
  'Tỷ lệ HT trễ / 逾期完成率',
  'Tỷ lệ quá hạn / 逾期未结率',
  'Đạt 1H / 1H响应达标率',
  'TB phản hồi (phút) / 平均首次响应(分)',
  'TB ngày HT / 平均结案天数',
] as const

function flowAggToCells(a: FlowAgg): ExportCellValue[] {
  return [
    a.total,
    a.completed,
    a.onTime,
    a.late,
    a.delayed,
    a.inProgress,
    a.notStarted,
    formatRateText(a.onTime, a.total),
    formatRateText(a.completed, a.total),
    formatRateText(a.late, a.total),
    formatRateText(a.delayed, a.total),
    formatRateText(a.oneHr, a.responded),
    a.responded > 0 ? Math.round(a.respSum / a.responded) : 'N/A',
    a.leadCnt > 0 ? round1(a.leadSum / a.leadCnt) : 'N/A',
  ]
}

function groupFlowAgg(
  tasks: readonly RawTask[],
  extractKeys: (task: RawTask) => string[],
): Array<{ key: string; agg: FlowAgg }> {
  const map = new Map<string, FlowAgg>()
  for (const task of tasks) {
    for (const rawKey of extractKeys(task)) {
      const key = rawKey.trim() || '—'
      let agg = map.get(key)
      if (!agg) {
        agg = createEmptyFlowAgg()
        map.set(key, agg)
      }
      addTaskToFlowAgg(agg, task)
    }
  }
  return Array.from(map.entries())
    .map(([key, agg]) => ({ key, agg }))
    .sort((a, b) => b.agg.total - a.agg.total)
}

/** Exports the full 8-sheet legacy KPI Progress & Statistics Excel workbook. */
export async function exportPeriodicKpi8SheetWorkbook(
  dataset: PeriodicKpiDataset,
  meta: { author: string; scopeLabel: string },
): Promise<void> {
  const { range, created, finished, totalAgg: a, finAgg, peopleFlow, kpiRows, kpiSummary } = dataset
  const stamp = formatLocalDateInput().replace(/-/g, '')

  const summaryRows: ExportCellValue[][] = [
    ['Tên báo cáo / 报表名称', 'Báo cáo tiến độ & thống kê KPI / 派案工作进度暨统计报表', ''],
    ['Chu kỳ / 报表周期', range.label, `${range.startStr} ~ ${range.endStr}`],
    ['Phạm vi / 资料范围', meta.scopeLabel, ''],
    ['Người xuất / 产出人员', meta.author, new Date().toLocaleString()],
    ['', '', ''],
    ['NV giao trong kỳ / 期间派案数', a.total, 'Ngày giao nằm trong kỳ'],
    ['NV HT trong kỳ / 期间结案数', finAgg.total, 'Ngày hoàn thành nằm trong kỳ'],
    ['Đã HT / 已结案', a.completed, 'NV giao trong kỳ đạt 100%'],
    ['HT đúng hạn / 如期完成', a.onTime, 'Ngày HT ≤ Hạn hoặc không hạn'],
    ['HT trễ hạn / 逾期完成', a.late, 'Ngày HT > Hạn'],
    ['Quá hạn chưa HT / 逾期未结', a.delayed, 'Chưa đạt 100% và đã quá hạn'],
    ['Đang XL / 处理中未逾期', a.inProgress, '1~99% chưa quá hạn'],
    ['Chưa XL / 未处理', a.notStarted, '0% chưa quá hạn'],
    ['Tỷ lệ đúng hạn / 如期结案率', formatRateText(a.onTime, a.total), 'HT đúng hạn ÷ NV giao'],
    ['Tỷ lệ HT / 结案率', formatRateText(a.completed, a.total), 'Đã HT ÷ NV giao'],
    ['Tỷ lệ HT trễ / 逾期完成率', formatRateText(a.late, a.total), 'HT trễ ÷ NV giao'],
    ['Tỷ lệ quá hạn / 逾期未结率', formatRateText(a.delayed, a.total), 'Quá hạn ÷ NV giao'],
    ['Đạt 1H / 1H响应达标率', formatRateText(a.oneHr, a.responded), 'Phản hồi đầu ≤ 60 phút'],
    [
      'TB phản hồi (phút) / 平均首次响应(分)',
      a.responded > 0 ? Math.round(a.respSum / a.responded) : 'N/A',
      '',
    ],
    [
      'TB ngày HT / 平均结案天数',
      a.leadCnt > 0 ? round1(a.leadSum / a.leadCnt) : 'N/A',
      'Ngày HT − Ngày giao',
    ],
    ['', '', ''],
    [
      'Tổng NV tính KPI / KPI任务总数',
      kpiSummary.total,
      'Ngày HT cuối trong kỳ (đa người nhận mỗi người 1 kiện; định kỳ từng kỳ; bỏ tạm dừng)',
    ],
    [
      'Tỷ lệ HT cuối / 最终完成率',
      kpiSummary.total > 0 ? `${kpiSummary.finalRate}%` : 'N/A',
      `Đã HT ÷ Tổng NV × 60% = ${kpiSummary.partFinal}`,
    ],
    [
      'Tỷ lệ đúng hạn KPI / 如期率',
      kpiSummary.total > 0 ? `${kpiSummary.ontimeRate}%` : 'N/A',
      `Đúng hạn ÷ Tổng NV × 40% = ${kpiSummary.partOntime}`,
    ],
    [
      'Điểm KPI tổng hợp / 综合KPI分数',
      kpiSummary.score === null ? '-' : kpiSummary.score,
      `${kpiSummary.grade.code} (V16.11.0-r8: HT cuối × 60% + Đúng hạn × 40%)`,
    ],
  ]

  const trendRows: ExportCellValue[][] = buildPeriodBuckets(
    range.start,
    range.end,
    range.gran,
  ).map((b) => {
    const c = created.filter((t) => inDateRange(parseLocalDateTime(t.createdAt), b.start, b.end))
    const f = finished.filter((t) => inDateRange(parseLocalDateTime(t.finish_date), b.start, b.end))
    const fOn = f.filter((t) => deriveTaskStatus(t) === 'completed_ontime').length
    const cDelayed = c.filter((t) => deriveTaskStatus(t) === 'delayed_pending').length
    return [
      b.label,
      c.length,
      cDelayed,
      f.length,
      fOn,
      f.length - fOn,
      formatRateText(fOn, f.length),
    ]
  })

  const unitRows = groupFlowAgg(created, (t) => [t.assigned_unit || '—']).map((g) => [
    g.key,
    ...flowAggToCells(g.agg),
  ])

  const personFlowRows = peopleFlow.map((p, idx) => [
    p.info.key === '__NONE__' ? '-' : idx + 1,
    p.info.username,
    p.info.fullname,
    p.info.dept,
    ...flowAggToCells(p.agg),
  ])

  const personKpiRows = kpiRows.map((r, idx) => [
    idx + 1,
    r.username,
    r.fullname,
    r.dept,
    r.total,
    r.completed,
    r.total > 0 ? `${r.finalRate}%` : 'N/A',
    r.ontime,
    r.total > 0 ? `${r.ontimeRate}%` : 'N/A',
    r.late,
    r.overdue,
    r.paused,
    r.score === null ? '-' : r.score,
    r.grade.code,
  ])

  const typeRows = groupFlowAgg(created, (t) => [t.task_type || '—']).map((g) => [
    g.key,
    ...flowAggToCells(g.agg),
  ])

  const siteRows = groupFlowAgg(created, (t) => {
    const sites = parseSites(t.site)
    return sites.length > 0 ? sites : ['—']
  }).map((g) => [g.key, ...flowAggToCells(g.agg)])

  const detailRows = [...created]
    .sort((x, y) => x.id - y.id)
    .map((t) => [
      t.id,
      t.title,
      parseSites(t.site).join(', '),
      t.task_type,
      t.level,
      t.confidential,
      t.recur_type,
      t.assigned_unit,
      t.assign_person,
      t.reporter,
      t.createdAt,
      t.due_date || '—',
      t.finish_date || '—',
      `${t.progress}%`,
      t.first_response_mins ?? 'N/A',
      deriveTaskStatus(t),
    ])

  await exportMultiSheetWorkbook(
    `KPI_Progress_Report_${range.type}_${range.startStr}_to_${range.endStr}_${stamp}.xlsx`,
    [
      {
        name: 'KPI总览 Tong quan',
        headers: ['Chỉ số / 指标', 'Giá trị / 数值', 'Ghi chú / 说明'],
        colWidths: [34, 38, 44],
        rows: summaryRows,
      },
      {
        name: '期间趋势 Xu huong',
        headers: [
          'Kỳ / 期间',
          'NV giao / 派案数',
          'Trong đó quá hạn / 逾期未结',
          'NV HT / 结案数',
          'HT đúng hạn / 如期',
          'HT trễ / 逾期完成',
          'Tỷ lệ đúng hạn HT / 结案如期率',
        ],
        rows: trendRows,
      },
      {
        name: '受理单位 Bo phan',
        headers: ['BP Nhận / 受理单位', ...AGG_HEADERS],
        rows: unitRows,
      },
      {
        name: '受理人 Nhan vien',
        headers: [
          'Hạng / 排名',
          'Tài khoản / 账号',
          'Họ tên / 姓名',
          'Bộ phận / 部门',
          ...AGG_HEADERS,
        ],
        rows: personFlowRows,
      },
      {
        name: '人员KPI KPI nhan vien',
        headers: [
          'Hạng / 名次',
          'Tài khoản / 账号',
          'Họ tên / 姓名',
          'Bộ phận / 部门',
          'Tổng NV / 任务总数',
          'Đã HT / 已完成',
          'HT cuối % / 最终完成率',
          'Đúng hạn / 如期',
          'Đúng hạn % / 如期率',
          'HT trễ / 逾期完成',
          'Quá hạn / 逾期未结',
          'Tạm dừng / 暂停不计',
          'Điểm KPI / KPI分数',
          'Xếp loại / 等级',
        ],
        rows: personKpiRows,
      },
      {
        name: '案件类型 Loai NV',
        headers: ['Loại NV / 案件类型', ...AGG_HEADERS],
        rows: typeRows,
      },
      {
        name: '厂区 Khu vuc',
        headers: ['Khu vực / 厂区', ...AGG_HEADERS],
        rows: siteRows,
      },
      {
        name: '明细 Chi tiet',
        headers: [
          'ID',
          'Tiêu đề / 标题',
          'Khu vực / 厂区',
          'Loại NV / 类型',
          'Cấp độ / 等级',
          'Bảo mật / 保密',
          'Định kỳ / 周期',
          'BP Nhận / 受理单位',
          'Người nhận / 受理人',
          'Người giao / 指派人',
          'Ngày giao / 派案日',
          'Hạn chót / 期限',
          'Ngày HT / 实际完工',
          'Tiến độ / 进度',
          'Phản hồi (phút) / 首次响应',
          'Trạng thái / 状态',
        ],
        rows: detailRows,
      },
    ],
  )
}
