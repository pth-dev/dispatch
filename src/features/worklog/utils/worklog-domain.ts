import type { WorkRecord } from '@/schemas/worklog'
import {
  formatLocalDateInput,
  getQuickDateRange,
  type QuickDateRange,
} from '@/utils/date-range'
import { exportMultiSheetWorkbook } from '@/utils/export-table'

export type WorklogQuickRange = QuickDateRange
export { formatLocalDateInput, getQuickDateRange as getWorklogQuickRange }

export type WorklogDayBucket = {
  date: string
  records: WorkRecord[]
}

export type WorklogSummary = {
  totalRecords: number
  uniqueTasks: number
  activeDays: number
  groups: WorklogDayBucket[]
}

export function groupWorkRecordsByDate(records: readonly WorkRecord[]): WorklogSummary {
  const byDate = new Map<string, WorkRecord[]>()
  const taskIds = new Set<number>()

  for (const record of records) {
    taskIds.add(record.task_id)
    const dateKey = record.createdAt.split(/[ T]/)[0] || '—'
    const bucket = byDate.get(dateKey)
    if (bucket) {
      bucket.push(record)
    } else {
      byDate.set(dateKey, [record])
    }
  }

  const groups: WorklogDayBucket[] = Array.from(byDate.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, list]) => ({ date, records: list }))

  return {
    totalRecords: records.length,
    uniqueTasks: taskIds.size,
    activeDays: groups.length,
    groups,
  }
}

export async function exportWorklogExcel(
  records: readonly WorkRecord[],
  start: string,
  end: string,
): Promise<void> {
  if (records.length === 0) return
  await exportMultiSheetWorkbook(`Work_Records_${start}_to_${end}.xlsx`, [
    {
      name: 'Work_Records',
      headers: [
        'Ngày / 日期',
        'Thời gian / 时间',
        'Tài khoản / 账号',
        'Người báo cáo / 填写人',
        'ID Nhiệm vụ / 任务编号',
        'Tiêu đề / 任务标题',
        'Tiêu đề VN / 任务标题(越)',
        'Tiến độ / 进度',
        'Nội dung báo cáo / 工作产出内容',
      ],
      colWidths: [12, 10, 16, 20, 12, 36, 36, 12, 64],
      rows: records.map((r) => {
        const [datePart = '', timePart = ''] = r.createdAt.split(/[ T]/)
        return [
          datePart,
          timePart.slice(0, 8),
          r.username,
          r.fullname,
          r.task_id,
          r.title,
          r.title_vn,
          `${r.progress}%`,
          r.content,
        ]
      }),
    },
  ])
}
