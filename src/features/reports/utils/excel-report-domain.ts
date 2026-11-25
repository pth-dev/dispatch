import type { RawTask } from '@/schemas/task'
import { formatLocalDateInput } from '@/utils/date-range'
import { exportMultiSheetWorkbook, type ExportCellValue } from '@/utils/export-table'
import {
  deriveTaskStatus,
  parseAssigneeList,
  parseReqDepts,
  parseSites,
  parseWorkItems,
  sameDept,
} from '@/utils/task-domain'
import {
  addTaskToFlowAgg,
  createEmptyFlowAgg,
  formatRateText,
  type DirectoryLookupUser,
  type FlowAgg,
  type PersonIdentity,
} from './periodic-kpi-domain'

export type ExcelScopeType = 'ALL' | 'DEPT' | 'PERSON'
export const EMPTY_DEPT_KEY = '__NONE__'

export type EfficiencyPersonRow = {
  info: PersonIdentity
  agg: FlowAgg
  ontimeRate: number
  tasks: RawTask[]
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

function round1(v: number): number {
  return Math.round(v * 10) / 10
}

function aggToCells(a: FlowAgg): ExportCellValue[] {
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

function resolveUser(raw: string, userMap: Map<string, DirectoryLookupUser>): PersonIdentity {
  const clean = raw.trim()
  if (!clean) {
    return { key: EMPTY_DEPT_KEY, username: '—', fullname: '', dept: '' }
  }
  const u = userMap.get(clean.toLowerCase())
  if (u) {
    return {
      key: `u:${u.username.toLowerCase()}`,
      username: u.username,
      fullname: u.fullname || '',
      dept: u.dept || '',
    }
  }
  return { key: `r:${clean.toLowerCase()}`, username: clean, fullname: '', dept: '' }
}

export function filterProgressTasks(
  tasks: readonly RawTask[],
  options: {
    scopeType: ExcelScopeType
    selectedDepts: ReadonlySet<string>
    selectedUsers: ReadonlySet<string>
    extraKeyword: string
    userMap: Map<string, DirectoryLookupUser>
  },
): RawTask[] {
  const { scopeType, selectedDepts, selectedUsers, extraKeyword, userMap } = options
  if (scopeType === 'ALL') return [...tasks]

  if (scopeType === 'DEPT') {
    if (selectedDepts.size === 0) return []
    return tasks.filter((task) => {
      const unit = (task.assigned_unit || '').trim()
      if (!unit) return selectedDepts.has(EMPTY_DEPT_KEY)
      for (const picked of selectedDepts) {
        if (picked !== EMPTY_DEPT_KEY && sameDept(unit, picked)) return true
      }
      return false
    })
  }

  const keywords = extraKeyword
    .split(/[,，;；]+/)
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean)

  if (selectedUsers.size === 0 && keywords.length === 0) return []

  return tasks.filter((task) => {
    const assignees = parseAssigneeList(task.assign_person)
    for (const raw of assignees) {
      const info = resolveUser(raw, userMap)
      if (selectedUsers.has(info.username.toLowerCase())) return true
    }
    if (keywords.length > 0) {
      const hay = `${task.assign_person || ''} ${task.title || ''}`.toLowerCase()
      return keywords.some((kw) => hay.includes(kw))
    }
    return false
  })
}

export function buildEfficiencyDataset(
  tasks: readonly RawTask[],
  dimension: 'assignee' | 'reporter',
  unit: string,
  userMap: Map<string, DirectoryLookupUser>,
): { scoped: RawTask[]; totalAgg: FlowAgg; people: EfficiencyPersonRow[] } {
  const scoped = unit ? tasks.filter((t) => sameDept(t.assigned_unit, unit)) : [...tasks]
  const totalAgg = createEmptyFlowAgg()
  const byPerson = new Map<string, { info: PersonIdentity; agg: FlowAgg; tasks: RawTask[] }>()

  for (const task of scoped) {
    addTaskToFlowAgg(totalAgg, task)
    const rawPeople =
      dimension === 'reporter'
        ? [task.reporter || '']
        : parseAssigneeList(task.assign_person).length > 0
          ? parseAssigneeList(task.assign_person)
          : ['']

    const seen = new Set<string>()
    for (const raw of rawPeople) {
      const info = resolveUser(raw, userMap)
      if (seen.has(info.key)) continue
      seen.add(info.key)
      let entry = byPerson.get(info.key)
      if (!entry) {
        entry = { info, agg: createEmptyFlowAgg(), tasks: [] }
        byPerson.set(info.key, entry)
      }
      addTaskToFlowAgg(entry.agg, task)
      entry.tasks.push(task)
    }
  }

  const people: EfficiencyPersonRow[] = Array.from(byPerson.values())
    .map((e) => ({
      info: e.info,
      agg: e.agg,
      ontimeRate: e.agg.total > 0 ? round1((e.agg.onTime / e.agg.total) * 100) : 0,
      tasks: e.tasks,
    }))
    .sort((a, b) => {
      if (a.info.key === EMPTY_DEPT_KEY) return 1
      if (b.info.key === EMPTY_DEPT_KEY) return -1
      return b.ontimeRate - a.ontimeRate || b.agg.total - a.agg.total
    })

  return { scoped, totalAgg, people }
}

/** Legacy 3-sheet Integrated Progress Excel (`KPI_Report`, `Dashboard`, `Info`). */
export async function exportProgress3SheetWorkbook(
  tasks: readonly RawTask[],
  meta: {
    start: string
    end: string
    scopeLabel: string
    targetLabel: string
    author: string
    userMap: Map<string, DirectoryLookupUser>
  },
): Promise<void> {
  if (tasks.length === 0) return
  const stamp = formatLocalDateInput().replace(/-/g, '')

  const kpiRows: ExportCellValue[][] = tasks.map((t) => {
    const assignees = parseAssigneeList(t.assign_person).map((r) => resolveUser(r, meta.userMap))
    const reporter = resolveUser(t.reporter || '', meta.userMap)
    const workItemsText = (parseWorkItems(t.work_items)?.items ?? [])
      .map((w) => w.topic)
      .filter(Boolean)
      .join(' | ')
    const allReportsText =
      typeof t.all_reports === 'string' && t.all_reports.trim()
        ? t.all_reports
        : typeof t.last_report === 'string'
          ? t.last_report
          : ''
    const respMins = t.first_response_mins
    const oneHrStatus =
      respMins == null ? 'N/A' : Number(respMins) <= 60 ? 'Đạt (<1h)' : 'Trễ (>1h)'

    const typeDetailText =
      typeof t.type_detail === 'string'
        ? t.type_detail
        : t.type_detail && typeof t.type_detail === 'object'
          ? Object.entries(t.type_detail)
              .map(([k, vals]) => `${k}: ${vals.join(', ')}`)
              .join(' | ')
          : ''

    return [
      t.id,
      t.title,
      allReportsText,
      parseSites(t.site).join(', '),
      parseReqDepts(t.req_depts, t.req_dept).join(', '),
      t.req_contact || '',
      t.task_type || '',
      t.install_req || '',
      typeDetailText,
      workItemsText,
      t.level || '',
      t.risk_status || '',
      t.cost_estimate || '',
      t.assigned_unit || '',
      assignees.map((a) => a.username).join('、'),
      assignees
        .map((a) => a.fullname)
        .filter(Boolean)
        .join('、'),
      reporter.fullname ? `${reporter.username} / ${reporter.fullname}` : reporter.username,
      t.createdAt || '',
      t.due_date || '',
      t.finish_date || '',
      `${t.progress}%`,
      respMins ?? 'N/A',
      oneHrStatus,
      deriveTaskStatus(t),
    ]
  })

  const deptMap = new Map<string, FlowAgg>()
  const personMap = new Map<string, { label: string; agg: FlowAgg }>()
  const totalAgg = createEmptyFlowAgg()

  for (const t of tasks) {
    addTaskToFlowAgg(totalAgg, t)
    const unitKey = (t.assigned_unit || '').trim() || '—'
    const dAgg = deptMap.get(unitKey) ?? createEmptyFlowAgg()
    addTaskToFlowAgg(dAgg, t)
    deptMap.set(unitKey, dAgg)

    const seen = new Set<string>()
    for (const raw of parseAssigneeList(t.assign_person)) {
      const info = resolveUser(raw, meta.userMap)
      if (seen.has(info.key)) continue
      seen.add(info.key)
      const label = info.fullname ? `${info.username} / ${info.fullname}` : info.username
      const entry = personMap.get(info.key) ?? { label, agg: createEmptyFlowAgg() }
      addTaskToFlowAgg(entry.agg, t)
      personMap.set(info.key, entry)
    }
  }

  const dashRows: ExportCellValue[][] = [
    ['[Theo bộ phận nhận / 按受理单位]', ...Array(AGG_HEADERS.length).fill('')],
    ...Array.from(deptMap.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([k, agg]) => [k, ...aggToCells(agg)]),
    ['', ...Array(AGG_HEADERS.length).fill('')],
    ['[Theo nhân sự / 按受理人]', ...Array(AGG_HEADERS.length).fill('')],
    ...Array.from(personMap.values())
      .sort((a, b) => b.agg.total - a.agg.total)
      .map((entry) => [entry.label, ...aggToCells(entry.agg)]),
    ['', ...Array(AGG_HEADERS.length).fill('')],
    ['TỔNG CỘNG / 合计', ...aggToCells(totalAgg)],
  ]

  await exportMultiSheetWorkbook(`Progress_Report_${meta.start}_to_${meta.end}_${stamp}.xlsx`, [
    {
      name: 'KPI_Report',
      headers: [
        'ID',
        'Tiêu đề / 标题',
        'Lịch sử báo cáo / 全部动态回报',
        'Khu vực / 厂区',
        'BP Yêu cầu / 需求单位',
        'Liên hệ / 联系窗口',
        'Loại NV / 案件类型',
        'Y/C cài đặt / 安装需求',
        'Chi tiết loại / 类型细项',
        'Dự án・Công việc con / 子工作',
        'Cấp độ / 等级',
        'Rủi ro / 风险',
        'Ước tính chi phí / 预估成本',
        'BP Nhận / 受理单位',
        'TK người nhận / 受理人账号',
        'Tên người nhận / 受理人姓名',
        'Người giao / 指派人',
        'Ngày tạo / 派案日',
        'Hạn chót / 期限',
        'Ngày HT / 完工日',
        'Tiến độ / 进度',
        'Phản hồi (phút) / 首次响应',
        '[KPI] Phản hồi <1h',
        '[KPI] Trạng thái hạn',
      ],
      rows: kpiRows,
    },
    {
      name: '仪表板 Dashboard',
      headers: ['Phân loại / 分类', ...AGG_HEADERS],
      rows: dashRows,
    },
    {
      name: '报表资讯 Info',
      headers: ['Mục / 项目', 'Giá trị / 内容'],
      colWidths: [28, 52],
      rows: [
        ['Khoảng thời gian / 统计区间', `${meta.start} ~ ${meta.end}`],
        ['Phạm vi / 权限范围', meta.scopeLabel],
        ['Đối tượng chọn / 筛选对象', meta.targetLabel],
        ['Số nhiệm vụ / 任务笔数', tasks.length],
        ['Người xuất / 产出人员', meta.author],
        ['Thời gian xuất / 产出时间', new Date().toLocaleString()],
      ],
    },
  ])
}

/** Legacy 4-sheet Efficiency Excel (`Hieu suat`, `Qua han`, `Chi tiet`, `Ghi chu`). */
export async function exportEfficiency4SheetWorkbook(
  dataset: { scoped: RawTask[]; totalAgg: FlowAgg; people: EfficiencyPersonRow[] },
  meta: {
    dimension: 'assignee' | 'reporter'
    start: string
    end: string
    scopeLabel: string
    author: string
  },
): Promise<void> {
  if (dataset.people.length === 0) return
  const stamp = formatLocalDateInput().replace(/-/g, '')

  const rankRows: ExportCellValue[][] = [
    ...dataset.people.map((p, idx) => [
      p.info.key === EMPTY_DEPT_KEY ? '-' : idx + 1,
      p.info.username,
      p.info.fullname,
      p.info.dept || '—',
      ...aggToCells(p.agg),
    ]),
    ['', 'TỔNG CỘNG / 合计', '', '', ...aggToCells(dataset.totalAgg)],
  ]

  const detailHeaders = [
    'Nhân sự / 人员',
    'ID',
    'Tiêu đề / 标题',
    'Khu vực / 厂区',
    'Loại NV / 类型',
    'Cấp độ / 等级',
    'Bảo mật / 保密',
    'BP Yêu cầu / 需求单位',
    'BP Nhận / 受理单位',
    'Người nhận / 受理人',
    'Người giao / 指派人',
    'Ngày giao / 派案日',
    'Hạn chót / 期限',
    'Ngày HT / 完工日',
    'Tiến độ / 进度',
    'Phản hồi (phút)',
    'Trạng thái KPI',
  ]

  const toDetailRow = (personLabel: string, t: RawTask): ExportCellValue[] => [
    personLabel,
    t.id,
    t.title,
    parseSites(t.site).join(', '),
    t.task_type || '',
    t.level || '',
    t.confidential,
    parseReqDepts(t.req_depts, t.req_dept).join(', '),
    t.assigned_unit || '',
    t.assign_person || '',
    t.reporter || '',
    t.createdAt || '',
    t.due_date || '',
    t.finish_date || '',
    `${t.progress}%`,
    t.first_response_mins ?? 'N/A',
    deriveTaskStatus(t),
  ]

  const overdueRows: ExportCellValue[][] = []
  const allDetailRows: ExportCellValue[][] = []
  for (const p of dataset.people) {
    const label = p.info.fullname ? `${p.info.username} / ${p.info.fullname}` : p.info.username
    for (const t of p.tasks) {
      allDetailRows.push(toDetailRow(label, t))
      const st = deriveTaskStatus(t)
      if (st === 'delayed_pending' || st === 'late_completed') {
        overdueRows.push(toDetailRow(label, t))
      }
    }
  }

  await exportMultiSheetWorkbook(`Efficiency_${meta.dimension}_${meta.start}_to_${meta.end}_${stamp}.xlsx`, [
    {
      name: '效率 Hieu suat',
      headers: ['Hạng / 排名', 'Tài khoản / 账号', 'Họ tên / 姓名', 'Bộ phận / 部门', ...AGG_HEADERS],
      rows: rankRows,
    },
    { name: '逾期清单 Qua han', headers: detailHeaders, rows: overdueRows },
    { name: '明细 Chi tiet', headers: detailHeaders, rows: allDetailRows },
    {
      name: '指标说明 Ghi chu',
      headers: ['Mục / 说明项', 'Nội dung / 内容'],
      colWidths: [28, 60],
      rows: [
        ['Chiều đánh giá / 统计维度', meta.dimension === 'reporter' ? 'Người giao / 指派人' : 'Người nhận / 受理人'],
        ['Khoảng ngày giao / 派案区间', `${meta.start} ~ ${meta.end}`],
        ['Phạm vi / 资料范围', meta.scopeLabel],
        ['Tỷ lệ đúng hạn / 如期结案率', 'HT đúng hạn ÷ Tổng NV (đa người nhận mỗi người tính 1 kiện)'],
        ['Đạt 1H / 1H响应率', 'Phản hồi đầu ≤ 60 phút ÷ Số NV đã phản hồi'],
        ['Người xuất / 产出人员', meta.author],
        ['Thời gian xuất / 产出时间', new Date().toLocaleString()],
      ],
    },
  ])
}
