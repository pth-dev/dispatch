export type QuickDateRange = 'today' | 'week' | 'month' | 'quarter' | 'year'

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatLocalDateInput(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function getQuickDateRange(
  range: QuickDateRange,
  now: Date = new Date(),
): { start: string; end: string } {
  const year = now.getFullYear()
  const month = now.getMonth()
  if (range === 'today') {
    const today = formatLocalDateInput(now)
    return { start: today, end: today }
  }
  if (range === 'week') {
    const day = now.getDay()
    const diffToMon = day === 0 ? -6 : 1 - day
    const start = new Date(year, month, now.getDate() + diffToMon)
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)
    return { start: formatLocalDateInput(start), end: formatLocalDateInput(end) }
  }
  if (range === 'month') {
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0)
    return { start: formatLocalDateInput(start), end: formatLocalDateInput(end) }
  }
  if (range === 'quarter') {
    const qStartMonth = Math.floor(month / 3) * 3
    const start = new Date(year, qStartMonth, 1)
    const end = new Date(year, qStartMonth + 3, 0)
    return { start: formatLocalDateInput(start), end: formatLocalDateInput(end) }
  }
  return {
    start: formatLocalDateInput(new Date(year, 0, 1)),
    end: formatLocalDateInput(new Date(year, 11, 31)),
  }
}
