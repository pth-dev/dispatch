import type { DeptItem, SiteItem } from '@/schemas/meta'

export const FALLBACK_REGISTER_DEPTS: readonly DeptItem[] = [
  { value: '資訊部', zh: '电脑室', vn: 'BP. IT', label: '电脑室 / BP. IT' },
  { value: '資材部', zh: '资材部', vn: 'BP. Vật tư', label: '资材部 / BP. Vật tư' },
  { value: '工程部', zh: '工程部', vn: 'BP. Kỹ thuật', label: '工程部 / BP. Kỹ thuật' },
  { value: '製造部', zh: '制造部', vn: 'BP. Sản xuất', label: '制造部 / BP. Sản xuất' },
  { value: '品質部', zh: '品质部', vn: 'BP. Chất lượng', label: '品质部 / BP. Chất lượng' },
  { value: '經管部', zh: '经管部', vn: 'BP. Kinh quản', label: '经管部 / BP. Kinh quản' },
  { value: '管理部', zh: '管理部', vn: 'BP. Hành chính', label: '管理部 / BP. Hành chính' },
  { value: '業務部', zh: '业务部', vn: 'BP. Kinh doanh', label: '业务部 / BP. Kinh doanh' },
]

export const FALLBACK_REGISTER_SITES: readonly SiteItem[] = [
  { value: 'YS', name: '永盛', vn: 'Vĩnh Thịnh', label: 'YS = 永盛 / Vĩnh Thịnh' },
  { value: 'YA', name: '永安（开发中心）', vn: 'Vĩnh An', label: 'YA = 永安 / Vĩnh An' },
  { value: 'YP', name: '样品室', vn: 'Phòng mẫu', label: 'YP = 样品室 / Phòng mẫu' },
  { value: 'WA', name: '唯安', vn: 'Duy An', label: 'WA = 唯安 / Duy An' },
  { value: 'CT', name: '诚泰', vn: 'Thành Thái', label: 'CT = 诚泰 / Thành Thái' },
  { value: 'FS1', name: '富寿1', vn: 'Phú Thọ 1', label: 'FS1 = 富寿1 / Phú Thọ 1' },
  { value: 'FS2', name: '富寿2', vn: 'Phú Thọ 2', label: 'FS2 = 富寿2 / Phú Thọ 2' },
  { value: 'SL', name: '山罗', vn: 'Sơn La', label: 'SL = 山罗 / Sơn La' },
  { value: 'DG', name: '东莞', vn: 'Đông Quản', label: 'DG = 东莞 / Đông Quản' },
]

export const REGISTER_SELECT_CLASS =
  'flex h-11 lg:h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50'

export function formatRegisterOptionLabel(
  item: { value: string; zh?: string | null; name?: string | null; vn?: string | null; label?: string | null },
  lang: string,
  includeCode = false,
): string {
  const isVi = lang.startsWith('vi')
  const isZh = lang.startsWith('zh')
  const primary = isVi ? (item.vn || item.label || item.value) : isZh ? (item.zh || item.name || item.label || item.value) : (item.label || item.value)
  if (includeCode && !primary.startsWith(`${item.value} `)) {
    return `${item.value} — ${primary}`
  }
  return primary
}
