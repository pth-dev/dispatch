import * as React from 'react'
import {
  CheckCircle2,
  Inbox,
  ListChecks,
  ListPlus,
  SearchX,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  InlineError,
  PageContainer,
  PageContainerBody,
  isFullPageError,
  throwFullPageError,
  toErrorStatus,
} from '@/components/layout'
import { Button } from '@/components/ui/button'
import type { LessonMarqueeHit } from '@/components/ui/lesson-marquee-banner'
import type { RawTask } from '@/schemas/task'
import { cn } from '@/utils/cn'
import { TodoConfirmDialogs } from '../components/TodoConfirmDialogs'
import { TodoHeaderBar } from '../components/TodoHeaderBar'
import { TodoNoticeBanner } from '../components/TodoNoticeBanner'
import { TodoTaskColumn } from '../components/TodoTaskColumn'
import { TodoTaskRow } from '../components/TodoTaskRow'
import { TodoTimelineSection } from '../components/TodoTimelineSection'
import { useTodoSchedule } from '../hooks/use-todo-schedule'
import type { ScheduledTodoTask } from '../utils/todo-domain'

function TodoLoadingSkeleton({ label }: { label: string }) {
  return (
    <div role="status" className="space-y-4">
      <span className="sr-only">{label}</span>
      <div className="h-16 animate-pulse rounded-xl border border-border bg-card" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-[420px] animate-pulse rounded-xl border border-border bg-card" />
        <div className="h-[420px] animate-pulse rounded-xl border border-border bg-card" />
      </div>
    </div>
  )
}

interface TodoAvailableListProps {
  tasks: readonly RawTask[]
  hasSearch: boolean
  canWrite: boolean
  lessonHitsByTaskId: ReadonlyMap<number, LessonMarqueeHit[]>
  onAdd: (taskId: number) => void
  onDragStartTask: (taskId: number) => void
  onDragEndTask: () => void
}

function TodoAvailableList({
  tasks,
  hasSearch,
  canWrite,
  lessonHitsByTaskId,
  onAdd,
  onDragStartTask,
  onDragEndTask,
}: TodoAvailableListProps) {
  const { t } = useTranslation()

  if (tasks.length === 0) {
    return (
      <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        {hasSearch ? (
          <>
            <SearchX className="size-7 opacity-60" aria-hidden="true" />
            <p>{t('todo.available.emptySearch')}</p>
          </>
        ) : (
          <>
            <CheckCircle2 className="size-7 text-success" aria-hidden="true" />
            <p>{t('todo.available.empty')}</p>
          </>
        )}
      </div>
    )
  }

  return tasks.map((task) => (
    <TodoTaskRow
      key={task.id}
      task={task}
      variant="available"
      canWrite={canWrite}
      lessonHits={lessonHitsByTaskId.get(task.id)}
      onAdd={onAdd}
      onDragStartTask={onDragStartTask}
      onDragEndTask={onDragEndTask}
    />
  ))
}

interface TodoSelectedListProps {
  entries: readonly ScheduledTodoTask[]
  totalCount: number
  selectedIndexById: ReadonlyMap<number, number>
  hasSearch: boolean
  canWrite: boolean
  lessonHitsByTaskId: ReadonlyMap<number, LessonMarqueeHit[]>
  onRemove: (taskId: number) => void
  onReorder: (taskId: number, delta: -1 | 1) => void
  onStartTimeChange: (taskId: number, startTime: string) => void
  onDragStartTask: (taskId: number) => void
  onDragEndTask: () => void
}

function TodoSelectedList({
  entries,
  totalCount,
  selectedIndexById,
  hasSearch,
  canWrite,
  lessonHitsByTaskId,
  onRemove,
  onReorder,
  onStartTimeChange,
  onDragStartTask,
  onDragEndTask,
}: TodoSelectedListProps) {
  const { t } = useTranslation()

  if (entries.length === 0) {
    return (
      <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary-soft/20 p-6 text-center text-sm text-muted-foreground">
        {hasSearch ? (
          <>
            <SearchX className="size-7 opacity-60" aria-hidden="true" />
            <p>{t('todo.selected.emptySearch')}</p>
          </>
        ) : (
          <>
            <ListPlus className="size-7 text-primary/70" aria-hidden="true" />
            <p>{t('todo.selected.empty')}</p>
          </>
        )}
      </div>
    )
  }

  return entries.map((entry) => (
    <TodoTaskRow
      key={entry.task.id}
      task={entry.task}
      variant="selected"
      canWrite={canWrite}
      startTime={entry.startTime}
      index={selectedIndexById.get(entry.task.id) ?? 0}
      totalCount={totalCount}
      lessonHits={lessonHitsByTaskId.get(entry.task.id)}
      onRemove={onRemove}
      onReorder={onReorder}
      onStartTimeChange={onStartTimeChange}
      onDragStartTask={onDragStartTask}
      onDragEndTask={onDragEndTask}
    />
  ))
}

export function TodoPage() {
  const { t } = useTranslation()
  const schedule = useTodoSchedule()
  const [draggingTaskId, setDraggingTaskId] = React.useState<number | null>(null)

  const errorStatus = schedule.error ? toErrorStatus(schedule.error) : null
  if (errorStatus && isFullPageError(errorStatus)) {
    throwFullPageError(errorStatus)
  }

  const selectedCountLabel = schedule.selectedSearch.trim()
    ? `${schedule.filteredSelected.length} / ${schedule.selected.length}`
    : String(schedule.selected.length)

  return (
    <PageContainer>
      <div className="shrink-0">
        <TodoHeaderBar
          selectedDate={schedule.selectedDate}
          today={schedule.today}
          isDirty={schedule.isDirty}
          canWrite={schedule.canWrite}
          isSaving={schedule.isSaving}
          saveDisabled={schedule.isLoading || Boolean(errorStatus)}
          hasSelectedItems={schedule.selected.length > 0}
          onDateChange={schedule.requestDateChange}
          onSave={schedule.requestSave}
          onExportCsv={schedule.handleExportCsv}
        />
      </div>

      <PageContainerBody className="space-y-4">
        {errorStatus ? (
          <InlineError status={errorStatus} onRetry={schedule.refetchAll} />
        ) : (
          <>
            <TodoNoticeBanner />

            {schedule.feedback && (
              <div
                role={schedule.feedback.tone === 'error' ? 'alert' : 'status'}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm',
                  schedule.feedback.tone === 'success'
                    ? 'border-success/30 bg-success/5 text-success'
                    : 'border-destructive/30 bg-destructive/5 text-destructive',
                )}
              >
                <span>{schedule.feedback.message}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={schedule.dismissFeedback}
                  aria-label={t('common.close')}
                >
                  <X className="size-3.5" aria-hidden="true" />
                </Button>
              </div>
            )}

            {schedule.isLoading ? (
              <TodoLoadingSkeleton label={t('common.loading')} />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <TodoTaskColumn
                    title={t('todo.available.title')}
                    subtitle={t('todo.available.subtitle')}
                    countLabel={String(schedule.filteredAvailable.length)}
                    searchValue={schedule.availableSearch}
                    searchPlaceholder={t('todo.available.searchPlaceholder')}
                    onSearchChange={schedule.setAvailableSearch}
                    icon={<Inbox className="size-4" />}
                    accent="neutral"
                    canDrop={schedule.canWrite}
                    isDragActive={draggingTaskId !== null}
                    onDropTask={(taskId) => {
                      setDraggingTaskId(null)
                      schedule.moveByDrop(taskId, 'left')
                    }}
                  >
                    <TodoAvailableList
                      tasks={schedule.filteredAvailable}
                      hasSearch={schedule.availableSearch.trim().length > 0}
                      canWrite={schedule.canWrite}
                      lessonHitsByTaskId={schedule.lessonHitsByTaskId}
                      onAdd={schedule.addTask}
                      onDragStartTask={setDraggingTaskId}
                      onDragEndTask={() => setDraggingTaskId(null)}
                    />
                  </TodoTaskColumn>

                  <TodoTaskColumn
                    title={t('todo.selected.title')}
                    subtitle={t('todo.selected.subtitle')}
                    countLabel={selectedCountLabel}
                    searchValue={schedule.selectedSearch}
                    searchPlaceholder={t('todo.selected.searchPlaceholder')}
                    onSearchChange={schedule.setSelectedSearch}
                    icon={<ListChecks className="size-4" />}
                    accent="primary"
                    canDrop={schedule.canWrite}
                    isDragActive={draggingTaskId !== null}
                    onDropTask={(taskId) => {
                      setDraggingTaskId(null)
                      schedule.moveByDrop(taskId, 'right')
                    }}
                  >
                    <TodoSelectedList
                      entries={schedule.filteredSelected}
                      totalCount={schedule.selected.length}
                      selectedIndexById={schedule.selectedIndexById}
                      hasSearch={schedule.selectedSearch.trim().length > 0}
                      canWrite={schedule.canWrite}
                      lessonHitsByTaskId={schedule.lessonHitsByTaskId}
                      onRemove={schedule.removeTask}
                      onReorder={schedule.reorderTask}
                      onStartTimeChange={schedule.updateStartTime}
                      onDragStartTask={setDraggingTaskId}
                      onDragEndTask={() => setDraggingTaskId(null)}
                    />
                  </TodoTaskColumn>
                </div>

                <TodoTimelineSection
                  tasks={schedule.timelineTasks}
                  lessonHitsByTaskId={schedule.lessonHitsByTaskId}
                />
              </>
            )}
          </>
        )}
      </PageContainerBody>

      <TodoConfirmDialogs
        pendingDateChange={schedule.pendingDateChange}
        onConfirmDateChange={schedule.confirmDateChange}
        onCancelDateChange={schedule.cancelDateChange}
        confirmMissingTimeOpen={schedule.confirmMissingTimeOpen}
        missingTimeCount={schedule.missingTimeCount}
        isSaving={schedule.isSaving}
        onConfirmSaveWithMissingTime={schedule.confirmSaveWithMissingTime}
        onCancelSaveWithMissingTime={schedule.cancelSaveWithMissingTime}
      />
    </PageContainer>
  )
}

export default TodoPage
