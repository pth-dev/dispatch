import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle2, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { parseLocalDateTime } from '@/utils/task-domain'
import { toStartOfDay } from '../utils/work-items-domain'
import type { WorkItemBoardRow } from './WorkItemsBoardView'

type WorkItemsGanttViewProps = {
  rows: WorkItemBoardRow[]
  canReport: boolean
  onReportTopic: (topicId: string) => void
}

const MS_PER_DAY = 86_400_000
const DAY_PX_SHORT = 44
const DAY_PX_MEDIUM = 36
const DAY_PX_LONG = 28

function resolveDayPx(totalDays: number): number {
  if (totalDays <= 14) return DAY_PX_SHORT
  if (totalDays <= 30) return DAY_PX_MEDIUM
  return DAY_PX_LONG
}

function formatShortDate(dt: Date): string {
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`
}

export function WorkItemsGanttView({
  rows,
  canReport,
  onReportTopic,
}: WorkItemsGanttViewProps) {
  const { t } = useTranslation()

  const datedRows = rows
    .map((row) => ({
      row,
      startDay: toStartOfDay(row.item.start),
      endDay: toStartOfDay(row.item.end),
    }))
    .filter(
      (entry): entry is { row: WorkItemBoardRow; startDay: Date; endDay: Date } =>
        entry.startDay !== null &&
        entry.endDay !== null &&
        entry.endDay.getTime() >= entry.startDay.getTime(),
    )

  if (datedRows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
        {t('tasks.project.ganttNoDates')}
      </div>
    )
  }

  const firstRow = datedRows[0]
  if (!firstRow) {
    return null
  }

  let minMs = firstRow.startDay.getTime()
  let maxMs = firstRow.endDay.getTime()
  for (const entry of datedRows) {
    if (entry.startDay.getTime() < minMs) minMs = entry.startDay.getTime()
    if (entry.endDay.getTime() > maxMs) maxMs = entry.endDay.getTime()
  }

  const today = toStartOfDay(new Date())
  const totalDays = Math.min(180, Math.max(1, Math.round((maxMs - minMs) / MS_PER_DAY) + 1))
  const dayPx = resolveDayPx(totalDays)
  const timelineWidth = totalDays * dayPx

  const dayHeaders: Date[] = []
  for (let i = 0; i < totalDays; i++) {
    dayHeaders.push(new Date(minMs + i * MS_PER_DAY))
  }

  const todayDiffDays = today ? Math.round((today.getTime() - minMs) / MS_PER_DAY) : -1
  const todayOffset =
    today && todayDiffDays >= 0 && todayDiffDays < totalDays
      ? todayDiffDays * dayPx + dayPx / 2
      : null

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <div className="min-w-max">
        {/* Timeline Header */}
        <div className="flex border-b border-border bg-secondary/40 text-[11px] font-medium text-muted-foreground">
          <div className="sticky left-0 z-10 w-36 sm:w-56 shrink-0 border-r border-border bg-secondary/95 px-3 py-2 text-primary font-semibold">
            {t('tasks.detail.workItemTopic')}
          </div>
          <div className="relative flex" style={{ width: `${timelineWidth}px` }}>
            {dayHeaders.map((dt, idx) => {
              const isWeekend = dt.getDay() === 0 || dt.getDay() === 6
              const labelStep = dayPx >= DAY_PX_SHORT ? 1 : dayPx >= DAY_PX_MEDIUM ? 2 : 3
              const showLabel = idx === 0 || idx % labelStep === 0
              return (
                <div
                  key={dt.getTime()}
                  className={cn(
                    'shrink-0 border-r border-border/50 px-0.5 py-2 text-center whitespace-nowrap tabular-nums',
                    isWeekend && 'bg-muted/50',
                  )}
                  style={{ width: `${dayPx}px` }}
                  title={formatShortDate(dt)}
                >
                  {showLabel ? formatShortDate(dt) : ''}
                </div>
              )
            })}
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border">
          {datedRows.map(({ row, startDay, endDay }) => {
            const { item, originalIndex, remain, stat } = row
            const pg = stat?.topicProgress ?? item.progress ?? 0
            const isDone = pg >= 100
            const isOverdue = remain?.level === 'over' && !isDone

            const leftDays = Math.min(
              totalDays - 1,
              Math.max(0, Math.round((startDay.getTime() - minMs) / MS_PER_DAY)),
            )
            const rawSpanDays = Math.max(
              1,
              Math.round((endDay.getTime() - startDay.getTime()) / MS_PER_DAY) + 1,
            )
            const spanDays = Math.min(totalDays - leftDays, rawSpanDays)
            const barLeft = leftDays * dayPx
            const barWidth = Math.max(dayPx, spanDays * dayPx)

            return (
              <div key={item.id} className="flex items-center text-xs hover:bg-secondary/20">
                <div className="sticky left-0 z-10 flex w-36 sm:w-56 shrink-0 items-center justify-between gap-2 border-r border-border bg-card px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-foreground" title={item.topic}>
                      <span className="mr-1 text-primary tabular-nums">{originalIndex + 1}.</span>
                      {item.topic}
                    </div>
                    <div className="text-[11px] text-muted-foreground tabular-nums">{pg}%</div>
                  </div>
                  {canReport && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      onClick={() => onReportTopic(item.id)}
                      aria-label={t('tasks.project.quickReport')}
                    >
                      <PenLine className="size-3.5 text-primary" aria-hidden="true" />
                    </Button>
                  )}
                </div>

                <div
                  className="relative h-10 shrink-0"
                  style={{ width: `${timelineWidth}px` }}
                >
                  {todayOffset !== null && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 z-10 w-px bg-destructive"
                      style={{ left: `${todayOffset}px` }}
                    />
                  )}

                  <div
                    className={cn(
                      'absolute top-2 h-6 overflow-hidden rounded-md border text-[11px] font-medium',
                      isDone
                        ? 'border-success/40 bg-success/15 text-success'
                        : isOverdue
                          ? 'border-destructive/40 bg-destructive/15 text-destructive'
                          : 'border-primary/40 bg-primary-soft text-primary',
                    )}
                    style={{ left: `${barLeft}px`, width: `${barWidth}px` }}
                    title={`${item.topic} (${pg}%) • ${item.start.slice(0, 10)} ~ ${item.end.slice(0, 10)}`}
                  >
                    <div
                      className={cn(
                        'h-full opacity-30',
                        isDone ? 'bg-success' : isOverdue ? 'bg-destructive' : 'bg-primary',
                      )}
                      style={{ width: `${Math.min(100, Math.max(0, pg))}%` }}
                    />
                    <span className="absolute inset-0 flex items-center gap-1 px-2 truncate tabular-nums">
                      {isDone && <CheckCircle2 className="size-3 shrink-0" aria-hidden="true" />}
                      {isOverdue && (
                        <>
                          <AlertTriangle className="size-3 shrink-0" aria-hidden="true" />
                          <span className="sr-only">{t('tasks.project.warnOverdue')}</span>
                        </>
                      )}
                      <span className="truncate">
                        {isDone ? t('tasks.project.doneShort') : `${pg}%`} • {formatShortDate(endDay)}
                      </span>
                    </span>
                  </div>

                  {/* Report marks */}
                  {stat?.marks.map((mark) => {
                    const markDay = toStartOfDay(parseLocalDateTime(mark.at))
                    if (!markDay) return null
                    const mOffset = Math.round((markDay.getTime() - minMs) / MS_PER_DAY)
                    if (mOffset < 0 || mOffset >= totalDays) return null
                    return (
                      <span
                        key={mark.reportId}
                        title={`${mark.who} • ${mark.at}${mark.progress !== null ? ` (${mark.progress}%)` : ''}`}
                        className="absolute bottom-1 size-2 -translate-x-1/2 rounded-full bg-primary ring-2 ring-card"
                        style={{ left: `${mOffset * dayPx + dayPx / 2}px` }}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
