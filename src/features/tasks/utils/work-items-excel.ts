import {
  WORK_ITEMS_MAX,
  WORK_ITEMS_RULES,
  type WorkItem,
  type WorkItemsRule,
} from '@/schemas/task'
import { createBlankWorkItem } from './work-items-domain'

type XlsxModule = typeof import('xlsx')

let xlsxLoader: Promise<XlsxModule> | null = null

async function loadXlsx(): Promise<XlsxModule> {
  if (!xlsxLoader) {
    xlsxLoader = import('xlsx')
  }
  return xlsxLoader
}

const EXCEL_COLUMNS = [
  { key: 'no', header: '序号 / STT', width: 6 },
  { key: 'topic', header: '子工作主题 / Chủ đề công việc con *', width: 30 },
  { key: 'content', header: '工作内容 / Nội dung công việc', width: 40 },
  { key: 'risk', header: '应注意事项与风险 / Lưu ý & rủi ro', width: 34 },
  { key: 'owner_ou', header: '责任OU / OU phụ trách', width: 16 },
  { key: 'owner', header: '责任人 / Người phụ trách', width: 22 },
  { key: 'agent', header: '代理人 / Người thay thế', width: 22 },
  { key: 'start', header: '起 / Bắt đầu', width: 20 },
  { key: 'end', header: '迄 / Kết thúc', width: 20 },
  { key: 'deduct', header: '手动扣除日 / Ngày trừ thêm', width: 14 },
] as const

const RULE_LABELS: Record<WorkItemsRule, string> = {
  none: '不自动扣除 / Không tự trừ',
  sun: '自动扣除星期日 / Tự trừ Chủ nhật',
  satsun: '自动扣除星期六・日 / Tự trừ Thứ 7・Chủ nhật',
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function formatDateTimeForExcel(raw: string | Date): string {
  if (!raw) return ''
  if (raw instanceof Date) {
    if (Number.isNaN(raw.getTime())) return ''
    return `${raw.getFullYear()}-${pad2(raw.getMonth() + 1)}-${pad2(raw.getDate())} ${pad2(raw.getHours())}:${pad2(raw.getMinutes())}`
  }
  return raw.replace('T', ' ').slice(0, 16)
}

function buildFileStamp(now: Date = new Date()): string {
  return `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}_${pad2(now.getHours())}${pad2(now.getMinutes())}`
}

function sanitizeFileName(base: string): string {
  const cleaned = base
    .replace(/[\\/:*?"<>|\r\n]+/g, ' ')
    .trim()
    .replace(/[_\s]+$/, '')
    .slice(0, 60)
  return `${cleaned || 'WorkItems'}_${buildFileStamp()}.xlsx`
}

function toExcelRow(item: WorkItem, index: number): Record<string, string | number> {
  return {
    [EXCEL_COLUMNS[0].header]: index + 1,
    [EXCEL_COLUMNS[1].header]: item.topic || '',
    [EXCEL_COLUMNS[2].header]: item.content || '',
    [EXCEL_COLUMNS[3].header]: item.risk || '',
    [EXCEL_COLUMNS[4].header]: item.owner_ou || '',
    [EXCEL_COLUMNS[5].header]: item.owner || '',
    [EXCEL_COLUMNS[6].header]: item.agent || '',
    [EXCEL_COLUMNS[7].header]: formatDateTimeForExcel(item.start),
    [EXCEL_COLUMNS[8].header]: formatDateTimeForExcel(item.end),
    [EXCEL_COLUMNS[9].header]: Number(item.deduct) || 0,
  }
}

function buildWorkbookSheets(
  XLSX: XlsxModule,
  items: WorkItem[],
  rule: WorkItemsRule,
  includeSample: boolean,
  defaultOwner = '',
  defaultOu = '',
) {
  const workbook = XLSX.utils.book_new()
  let rows = items.map(toExcelRow)

  if (includeSample || rows.length === 0) {
    const now = new Date()
    const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 0)
    const d1 = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + 2, 17, 0)
    const d2 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate() + 1, 8, 0)
    const d3 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate() + 4, 17, 0)

    const sampleItems: WorkItem[] = [
      {
        ...createBlankWorkItem(defaultOu),
        topic: '【范例】需求确认 / [Ví dụ] Xác nhận yêu cầu',
        content: '访谈需求单位、确认规格 / Phỏng vấn đơn vị yêu cầu',
        risk: '需求变更 / Thay đổi yêu cầu',
        owner_ou: defaultOu,
        owner: defaultOwner,
        start: formatDateTimeForExcel(d0),
        end: formatDateTimeForExcel(d1),
      },
      {
        ...createBlankWorkItem(defaultOu),
        topic: '【范例】系统开发 / [Ví dụ] Phát triển hệ thống',
        content: '程序撰写与测试 / Lập trình & kiểm thử',
        risk: '进度延误 / Chậm tiến độ',
        owner_ou: defaultOu,
        owner: defaultOwner,
        start: formatDateTimeForExcel(d2),
        end: formatDateTimeForExcel(d3),
      },
    ]
    rows = sampleItems.map(toExcelRow)
  }

  const workSheet = XLSX.utils.json_to_sheet(rows)
  workSheet['!cols'] = EXCEL_COLUMNS.map((c) => ({ wch: c.width }))
  XLSX.utils.book_append_sheet(workbook, workSheet, '工作专区 WorkItems')

  const settingsSheet = XLSX.utils.json_to_sheet([
    {
      '设置项目 / Mục': '扣除日规则 / Quy tắc ngày trừ',
      '值 / Giá trị': rule,
      '说明 / Ghi chú': WORK_ITEMS_RULES.map((r) => `${r} = ${RULE_LABELS[r]}`).join(' ; '),
    },
  ])
  settingsSheet['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 90 }]
  XLSX.utils.book_append_sheet(workbook, settingsSheet, '设置 Settings')

  const guideLines = [
    '1. 请勿更改「工作专区 WorkItems」第一列栏位标题与顺序 / Không đổi tiêu đề và thứ tự cột',
    '2. 子工作主题为必填；【范例】/[Ví dụ] 开头之列上传时自动略过 / Chủ đề bắt buộc; dòng [Ví dụ] tự bỏ qua',
    '3. 起 / 迄格式：YYYY-MM-DD HH:mm（只填日期 → 起 08:00、迄 17:00）/ Định dạng ngày giờ',
    '4. 责任人 / 代理人：填写账号或姓名 / Nhập tài khoản hoặc họ tên',
    '5. 手动扣除日：0~999，可 0.5 / Ngày trừ thêm: 0~999',
    '6. 扣除日规则于「设置 Settings」页填写：none / sun / satsun / Quy tắc ngày trừ ở trang Settings',
    `7. 最多 ${WORK_ITEMS_MAX} 项子工作 / Tối đa ${WORK_ITEMS_MAX} mục`,
  ]
  const guideSheet = XLSX.utils.json_to_sheet(
    guideLines.map((line) => ({ '说明 / Hướng dẫn': line })),
  )
  guideSheet['!cols'] = [{ wch: 100 }]
  XLSX.utils.book_append_sheet(workbook, guideSheet, '说明 Hướng dẫn')

  return workbook
}

export async function downloadWorkItemsTemplate(
  rule: WorkItemsRule = 'sun',
  defaultOwner = '',
  defaultOu = '',
): Promise<void> {
  const XLSX = await loadXlsx()
  const wb = buildWorkbookSheets(XLSX, [], rule, true, defaultOwner, defaultOu)
  XLSX.writeFile(wb, sanitizeFileName('WorkItems_Template_Mau_du_an'))
}

export async function exportWorkItemsExcel(
  items: WorkItem[],
  rule: WorkItemsRule,
  baseTitle = '',
): Promise<void> {
  const XLSX = await loadXlsx()
  const validItems = items.filter((it) => it.topic.trim().length > 0)
  const wb = buildWorkbookSheets(XLSX, validItems, rule, false)
  const prefix = baseTitle.trim() ? `WorkItems_${baseTitle.trim()}` : 'WorkItems'
  XLSX.writeFile(wb, sanitizeFileName(prefix))
}

type ColumnKey = (typeof EXCEL_COLUMNS)[number]['key']

const HEADER_MATCHERS: ReadonlyArray<[ColumnKey, RegExp]> = [
  ['no', /^(序号|序號|stt|no\.?|#|编号|編號)/],
  ['topic', /子工作主[题題]|chủđềcôngviệccon|chủđềcon|^主[题題]|^chủđề|^topic/],
  ['content', /工作[内內]容|nộidung|^content/],
  ['risk', /[风風][险險]|注意事[项項]|rủiro|lưuý|^risk/],
  ['deduct', /扣除|ngàytrừ|^deduct/],
  ['owner_ou', /[责責]任ou|ouphụtrách|^ou/],
  ['owner', /[责責]任人|ngườiphụtrách|phụtrách|^owner/],
  ['agent', /代理人|ngườithaythế|thaythế|^agent/],
  ['start', /^起|bắtđầu|^start/],
  ['end', /^迄|kếtthúc|^end/],
]

function mapHeaderRow(row: unknown[]): Partial<Record<ColumnKey, number>> | null {
  if (!Array.isArray(row)) return null
  const map: Partial<Record<ColumnKey, number>> = {}
  row.forEach((cell, colIndex) => {
    const normalized = String(cell ?? '')
      .normalize('NFC')
      .replace(/\s+/g, '')
      .toLowerCase()
    if (!normalized) return
    const match = HEADER_MATCHERS.find(([key, re]) => map[key] === undefined && re.test(normalized))
    if (match) {
      map[match[0]] = colIndex
    }
  })
  return map.topic !== undefined ? map : null
}

function parseExcelDateTimeCell(
  value: unknown,
  isEnd: boolean,
  XLSX: XlsxModule,
): string {
  if (value === null || value === undefined || value === '') return ''
  const buildLocalIso = (y: number, mo: number, d: number, H: number, M: number): string => {
    const dt = new Date(y, mo - 1, d, H, M)
    if (Number.isNaN(dt.getTime()) || dt.getFullYear() !== y || dt.getMonth() !== mo - 1) return ''
    return `${y}-${pad2(mo)}-${pad2(d)}T${pad2(H)}:${pad2(M)}`
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return ''
    return buildLocalIso(
      value.getFullYear(),
      value.getMonth() + 1,
      value.getDate(),
      value.getHours(),
      value.getMinutes(),
    )
  }

  if (typeof value === 'number' && Number.isFinite(value) && XLSX.SSF) {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (!parsed) return ''
    const dateOnly = Math.abs(value - Math.floor(value)) < 1e-9
    return buildLocalIso(
      parsed.y,
      parsed.m,
      parsed.d,
      dateOnly ? (isEnd ? 17 : 8) : parsed.H,
      dateOnly ? 0 : parsed.M,
    )
  }

  const text = String(value)
    .trim()
    .replace(/[年月/.]/g, '-')
    .replace(/日/g, ' ')
    .replace(/\s+/g, ' ')
  const match = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})(?:\s*T?\s*(\d{1,2})[:：](\d{2}))?/)
  if (!match) return ''
  return buildLocalIso(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    match[4] !== undefined ? Math.min(23, Number(match[4])) : isEnd ? 17 : 8,
    match[5] !== undefined ? Math.min(59, Number(match[5])) : 0,
  )
}

export type ParsedWorkItemsExcel = {
  items: WorkItem[]
  rule: WorkItemsRule | null
  skippedSamples: number
  truncatedCount: number
  warnings: string[]
}

export async function parseWorkItemsArrayBuffer(
  buffer: ArrayBuffer,
  defaultOu = '',
): Promise<ParsedWorkItemsExcel> {
  const XLSX = await loadXlsx()
  const wb = XLSX.read(buffer, { type: 'array', cellDates: false })

  let rows: unknown[][] | null = null
  let headerIdx = -1
  let colMap: Partial<Record<ColumnKey, number>> | null = null

  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name]
    if (!sheet) continue
    const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: true,
      defval: '',
    })
    for (let i = 0; i < Math.min(15, sheetRows.length); i++) {
      const candidate = sheetRows[i]
      if (!candidate) continue
      const mapped = mapHeaderRow(candidate)
      if (mapped) {
        rows = sheetRows
        headerIdx = i
        colMap = mapped
        break
      }
    }
    if (rows) break
  }

  if (!rows || !colMap) {
    const first = wb.SheetNames[0]
    const firstSheet = first ? wb.Sheets[first] : undefined
    rows = firstSheet
      ? XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
          header: 1,
          raw: true,
          defval: '',
        })
      : []
    headerIdx = 0
    colMap = {}
    EXCEL_COLUMNS.forEach((c, i) => {
      colMap![c.key] = i
    })
  }

  let detectedRule: WorkItemsRule | null = null
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name]
    if (!sheet) continue
    const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: true,
      defval: '',
    })
    const ruleRow = sheetRows.find(
      (r) =>
        Array.isArray(r) &&
        /扣除日[规規][则則]|quytắcngàytrừ/.test(
          String(r[0] ?? '')
            .normalize('NFC')
            .replace(/\s+/g, '')
            .toLowerCase(),
        ),
    )
    if (ruleRow) {
      const rawRule = String(ruleRow[1] ?? '')
        .trim()
        .toLowerCase()
      if ((WORK_ITEMS_RULES as readonly string[]).includes(rawRule)) {
        detectedRule = rawRule as WorkItemsRule
      } else if (/六|thứ ?7|sat/.test(rawRule)) {
        detectedRule = 'satsun'
      } else if (/日|chủ ?nhật|sun/.test(rawRule)) {
        detectedRule = 'sun'
      } else if (/不|none|không/.test(rawRule)) {
        detectedRule = 'none'
      }
      break
    }
  }

  const items: WorkItem[] = []
  const warnings: string[] = []
  let skippedSamples = 0
  let truncatedCount = 0

  const getCell = (row: unknown[], key: ColumnKey): unknown => {
    const idx = colMap?.[key]
    return idx === undefined ? '' : row[idx]
  }

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] ?? []
    const topic = String(getCell(row, 'topic') ?? '').trim()
    if (!topic) continue
    if (/^[【[]\s*(范例|範例|示例|ví dụ|example)/i.test(topic)) {
      skippedSamples += 1
      continue
    }

    if (items.length >= WORK_ITEMS_MAX) {
      truncatedCount += 1
      continue
    }

    const rawStart = getCell(row, 'start')
    const rawEnd = getCell(row, 'end')
    const start = parseExcelDateTimeCell(rawStart, false, XLSX)
    const end = parseExcelDateTimeCell(rawEnd, true, XLSX)

    if ((String(rawStart ?? '').trim() && !start) || (String(rawEnd ?? '').trim() && !end)) {
      warnings.push(`#${i + 1}: invalid date`)
    } else if (start && end && end < start) {
      warnings.push(`#${i + 1}: end before start`)
    }

    const ou = String(getCell(row, 'owner_ou') ?? '').trim()
    const deductNum = Number(getCell(row, 'deduct'))
    const item = createBlankWorkItem(defaultOu)
    item.topic = topic.slice(0, 120)
    item.content = String(getCell(row, 'content') ?? '').slice(0, 4000)
    item.risk = String(getCell(row, 'risk') ?? '').slice(0, 4000)
    item.owner_ou = (ou || defaultOu).slice(0, 128)
    item.owner = String(getCell(row, 'owner') ?? '')
      .trim()
      .slice(0, 128)
    item.agent = String(getCell(row, 'agent') ?? '')
      .trim()
      .slice(0, 128)
    item.start = start
    item.end = end
    item.deduct = Number.isFinite(deductNum)
      ? Math.max(0, Math.min(999, Math.round(deductNum * 2) / 2))
      : 0

    items.push(item)
  }

  return {
    items,
    rule: detectedRule,
    skippedSamples,
    truncatedCount,
    warnings,
  }
}

export async function parseWorkItemsExcelFile(
  file: File,
  defaultOu = '',
): Promise<ParsedWorkItemsExcel> {
  const buffer = await file.arrayBuffer()
  return parseWorkItemsArrayBuffer(buffer, defaultOu)
}
