import * as React from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
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
import type { TaskCreateVariant } from '../components/editor/TaskCreateModeBar'
import type { TaskEditorVariant } from '../components/editor/TaskEditorForm'

function parsePositiveInt(raw: string | null | undefined): number | undefined {
  if (!raw) return undefined
  const num = Number(raw)
  return Number.isInteger(num) && num > 0 ? num : undefined
}

export function useTaskCreatePage() {
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
  const initialVariant: TaskEditorVariant =
    mode === 'create' && rawModeParam === 'quick'
      ? 'quick'
      : mode === 'create' && rawModeParam === 'daily' && showDailyRepair
        ? 'daily'
        : 'full'

  const [variantState, setVariantState] = React.useState<{
    base: TaskEditorVariant
    current: TaskEditorVariant
  }>({ base: initialVariant, current: initialVariant })

  const variant: TaskEditorVariant =
    mode !== 'create'
      ? 'full'
      : variantState.base === initialVariant
        ? variantState.current
        : initialVariant

  const setVariant = (next: TaskEditorVariant) => {
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
    activeSourceTask ?? (cloneId ? historyTasks.find((item) => item.id === cloneId) : undefined)
  const loadingSource = loadingActive || (Boolean(cloneId) && !activeSourceTask && loadingHistory)
  const hasSourceError = isError || (Boolean(cloneId) && !activeSourceTask && isHistoryError)
  const activeError = isError ? error : historyError

  if (hasInvalidEditId) {
    throwFullPageError('404')
  }

  if (mode === 'create' && !canCreateTask(user)) {
    throwFullPageError('403')
  }

  const errorStatus = toErrorStatus(activeError)
  if (sourceId > 0 && hasSourceError && isFullPageError(errorStatus)) {
    throwFullPageError(errorStatus)
  }

  if (sourceId > 0 && !loadingSource && !hasSourceError && !sourceTask) {
    throwFullPageError('404')
  }

  if (mode === 'edit' && sourceTask && !canEditTask(user, sourceTask)) {
    throwFullPageError('403')
  }

  if (mode === 'clone' && sourceTask && !canCloneTask(user, sourceTask)) {
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

  const handleRetry = () => {
    void refetch()
    if (cloneId) void refetchHistory()
  }

  return {
    mode,
    sourceId,
    sourceTask,
    loadingSource,
    hasSourceError,
    errorStatus,
    initialVariant,
    variant,
    setVariant,
    activeModeVariant,
    showDailyRepair,
    pageTitle,
    historyOpen,
    setHistoryOpen,
    enterQuickModeRef,
    handleSelectFull,
    handleSelectQuick,
    handleSelectDailyRepair,
    handlePickHistoricalTask,
    handleRetry,
  }
}
