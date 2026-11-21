/**
 * Legacy-aligned standard task types, priority levels, and risk options.
 * Values sent to the backend MUST match these exact strings to keep legacy
 * SQLite reporting & KPI aggregation consistent (`Dispatch-utils.js:L569-L603`).
 */
export const STANDARD_TASK_TYPES: readonly string[] = [
  '網路類 / Mạng lưới',
  '系統類 / Hệ thống',
  'Outlook / Outlook',
  'Ultraviewer連線問題 / Lỗi kết nối Ultraviewer',
  '資安問題 / Vấn đề bảo mật',
  '資安事件 / Sự cố bảo mật',
  '備份資料 / Sao lưu dữ liệu',
  '開發程式 / Lập trình phát triển',
  '安装电脑 / Cài đặt máy tính',
  '维修电脑设备 / Sửa chữa thiết bị máy tính',
  '开发系统 / Phát triển hệ thống',
  '维护数据库 / Bảo trì cơ sở dữ liệu',
  'CCTV维修 / Sửa chữa CCTV',
  'ALC事务 / Công việc ALC',
  '合理化规章制度 / Hợp lý hóa quy chế',
]

export const CUSTOM_TASK_TYPE_VALUE = '__CUSTOM__'

export const LEVEL_OPTIONS: readonly string[] = [
  '一般件 (指定时间内完成) / Thường (Hoàn thành trong thời gian quy định, KS nghiêm ngặt)',
  '急件 (6小时完成) / Gấp (6 giờ)',
  '特急件 (1小时内完成) / Rất gấp (1 giờ)',
]

export const DEFAULT_TASK_LEVEL = LEVEL_OPTIONS[0]!

export const RISK_OPTIONS: readonly string[] = [
  '無 / Không',
  '低 / Thấp',
  '中 / Trung bình',
  '高 / Cao',
]

export const DEFAULT_RISK_STATUS = RISK_OPTIONS[0]!

export const MAX_ASSIGNEES = 20

export const SELECT_FIELD_CLASS =
  'w-full h-11 lg:h-10 rounded-md border border-border bg-card px-3 text-xs text-foreground outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20'

export function isStandardTaskType(value: string): boolean {
  const trimmed = value.trim()
  return STANDARD_TASK_TYPES.includes(trimmed)
}

/**
 * Formats a bilingual `"中文 / Tiếng Việt"` catalog value for the active UI
 * language while preserving the canonical raw value for backend submission.
 */
export function formatBilingualOption(raw: string, language: string): string {
  const parts = raw.split(/\s+\/\s+/)
  if (parts.length < 2) return raw
  const zhPart = parts[0]!.trim()
  const viPart = parts.slice(1).join(' / ').trim()
  if (zhPart.toLowerCase() === viPart.toLowerCase()) {
    return viPart
  }
  const lang = language.toLowerCase()
  if (lang.startsWith('zh')) return zhPart
  if (lang.startsWith('vi')) return viPart
  return `${viPart} (${zhPart})`
}
