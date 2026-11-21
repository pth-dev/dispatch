import * as React from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import {
  InlineError,
  PageContainer,
  PageContainerBody,
  PageHeader,
  isFullPageError,
  throwFullPageError,
  toErrorStatus,
} from '@/components/layout'
import { APP_ROUTES } from '@/constants/app-routes'
import { useAppStore } from '@/app/store'
import type { RawTask } from '@/schemas/task'
import {
  canCloneTask,
  canCreateTask,
  canEditTask,
  isComputerRoomUser,
} from '@/utils/permissions'
import { useMyTaskHistory, useTaskById } from '../api/queries'
import { TaskCreateModeBar, type TaskCreateVariant } from '../components/editor/TaskCreateModeBar'
import { TaskEditorForm } from '../components/editor/TaskEditorForm'
import { TaskHistoryCloneDialog } from '../components/editor/TaskHistoryCloneDialog'

function parsePositiveInt(raw: string | null | undefined): number | undefined {
  if (!raw) return undefined
  const num = Number(raw)
  return Number.isInteger(num) && num > 0 ? num : undefined
}

export function TaskCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const user = useAppStore((s) => s.user)
  const editId = parsePositiveInt(id)
  const cloneId = parsePositiveInt(searchParams.get('clone'))
  const rawModeParam = (searchParams.get('mode') ?? '').toLowerCase()
  const hasInvalidEditId = Boolean(id) && !editId
  const mode: 'create' | 'edit' | 'clone' = editId ? 'edit' : cloneId ? 'clone' : 'create'

  const showDailyRepair = isComputerRoomUser(user)
  const initialVariant: 'full' | 'quick' | 'daily' =
    mode === 'create' && rawModeParam === 'quick'
      ? 'quick'
      : mode === 'create' && rawModeParam === 'daily' && showDailyRepair
        ? 'daily'
        : 'full'

  const [variantState, setVariantState] = React.useState<{
    base: 'full' | 'quick' | 'daily'
    current: 'full' | 'quick' | 'daily'
  }>({ base: initialVariant, current: initialVariant })

  const variant: 'full' | 'quick' | 'daily' =
    mode !== 'create'
      ? 'full'
      : variantState.base === initialVariant
        ? variantState.current
        : initialVariant

  const setVariant = (next: 'full' | 'quick' | 'daily') => {
    setVariantState({ base: initialVariant, current: next })
  }

  const [historyOpen, setHistoryOpen] = React.useState(
    mode === 'create' && rawModeParam === 'clone',
  )
  const enterQuickModeRef = React.useRef<(() => void) | null>(null)

  const sourceId = editId ?? cloneId ?? 0
  const {
    data: activeSourceTask,
    isLoading: loadingActive,
    isError,
    error,
    refetch,
  } = useTaskById(sourceId)
  const {
    data: historyTasks = [],
    isLoading: loadingHistory,
    isError: isHistoryError,
    error: historyError,
    refetch: refetchHistory,
  } = useMyTaskHistory(Boolean(cloneId) && !activeSourceTask && !loadingActive)

  const sourceTask =
    activeSourceTask ?? (cloneId ? historyTasks.find((t) => t.id === cloneId) : undefined)
  const loadingSource = loadingActive || (Boolean(cloneId) && !activeSourceTask && loadingHistory)
  const hasSourceError = isError || (Boolean(cloneId) && !activeSourceTask && isHistoryError)
  const activeError = isError ? error : historyError

  if (hasInvalidEditId) {
    throwFullPageError('404')
  }

  if (mode === 'create' && !canCreateTask(user)) {
    throwFullPageError('403')
  }

  const isQuickMode = mode === 'create' && variant === 'quick'
  const isDailyMode = mode === 'create' && variant === 'daily'
  const activeModeVariant: TaskCreateVariant = mode === 'clone' ? 'clone' : variant

  const staticFallbackTitle =
    mode === 'edit' ? t('tasks.detail.edit') : t('tasks.createForm.title')

  const pageTitle =
    sourceId > 0 && (loadingSource || hasSourceError || !sourceTask)
      ? staticFallbackTitle
      : mode === 'edit'
        ? t('tasks.createForm.editTitle', { id: String(sourceTask?.id ?? '') })
        : mode === 'clone'
          ? t('tasks.createForm.cloneTitle', { id: String(sourceTask?.id ?? '') })
          : isQuickMode
            ? t('tasks.createModes.quick')
            : isDailyMode
              ? t('tasks.createModes.dailyRepair')
              : t('tasks.createForm.title')

  const handleSelectFull = () => {
    if (mode === 'clone') {
      navigate(APP_ROUTES.TASK_NEW, { replace: true })
      return
    }
    setVariant('full')
  }

  const handleSelectQuick = () => {
    if (mode === 'clone') {
      navigate(`${APP_ROUTES.TASK_NEW}?mode=quick`, { replace: true })
      return
    }
    enterQuickModeRef.current?.()
    setVariant('quick')
  }

  const handleSelectDailyRepair = () => {
    setVariant('daily')
    navigate(`${APP_ROUTES.TASK_NEW}?mode=daily`, { replace: true })
  }

  const handlePickHistoricalTask = (picked: RawTask) => {
    navigate(`${APP_ROUTES.TASK_NEW}?clone=${picked.id}`, { replace: true })
  }

  const headerSection = (
    <div className="shrink-0 space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground select-none">
        <Link
          to={APP_ROUTES.TASKS}
          className="flex items-center gap-1 hover:text-foreground font-medium"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          <span>{t('tasks.detail.backToList')}</span>
        </Link>
        <span>›</span>
        <span className="font-semibold text-foreground">{pageTitle}</span>
      </div>

      <PageHeader
        title={pageTitle}
        actions={
          mode !== 'edit' ? (
            <TaskCreateModeBar
              activeVariant={activeModeVariant}
              showDailyRepair={showDailyRepair}
              onSelectFull={handleSelectFull}
              onSelectQuick={handleSelectQuick}
              onOpenHistoryPicker={() => setHistoryOpen(true)}
              onSelectDailyRepair={handleSelectDailyRepair}
            />
          ) : undefined
        }
      />
    </div>
  )

  if (sourceId > 0 && loadingSource) {
    return (
      <PageContainer width="narrow">
        {headerSection}
        <PageContainerBody>
          <div role="status" className="space-y-4 animate-pulse">
            <span className="sr-only">{t('common.loading')}</span>
            <div className="h-4 w-48 rounded bg-muted" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-8 h-80 rounded-xl bg-muted" />
              <div className="lg:col-span-4 h-80 rounded-xl bg-muted" />
            </div>
          </div>
        </PageContainerBody>
      </PageContainer>
    )
  }

  if (sourceId > 0 && hasSourceError) {
    const errorStatus = toErrorStatus(activeError)
    if (isFullPageError(errorStatus)) {
      throwFullPageError(errorStatus)
    }
    return (
      <PageContainer width="narrow">
        {headerSection}
        <PageContainerBody>
          <InlineError
            status={errorStatus}
            onRetry={() => {
              void refetch()
              if (cloneId) void refetchHistory()
            }}
          />
        </PageContainerBody>
      </PageContainer>
    )
  }

  if (sourceId > 0 && !sourceTask) {
    throwFullPageError('404')
  }

  if (mode === 'edit' && sourceTask && !canEditTask(user, sourceTask)) {
    throwFullPageError('403')
  }

  if (mode === 'clone' && sourceTask && !canCloneTask(user, sourceTask)) {
    throwFullPageError('403')
  }

  return (
    <PageContainer width="narrow">
      {headerSection}

      <PageContainerBody>
        <TaskEditorForm
          key={`${mode}-${sourceTask?.id ?? initialVariant}`}
          mode={mode}
          sourceTask={sourceTask}
          initialVariant={initialVariant}
          variant={variant}
          onVariantChange={setVariant}
          enterQuickModeRef={enterQuickModeRef}
        />
      </PageContainerBody>

      {mode !== 'edit' && (
        <TaskHistoryCloneDialog
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          onPickTask={handlePickHistoricalTask}
        />
      )}
    </PageContainer>
  )
}

export default TaskCreatePage
