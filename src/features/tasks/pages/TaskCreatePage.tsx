import { useParams, useSearchParams } from 'react-router'
import {
  InlineError,
  isFullPageError,
  throwFullPageError,
  toErrorStatus,
} from '@/components/layout'
import { useAppStore } from '@/app/store'
import {
  canCloneTask,
  canCreateTask,
  canEditTask,
  isComputerRoomUser,
} from '@/utils/permissions'
import { useMyTaskHistory, useTaskById } from '../api/queries'
import { TaskEditorForm } from '../components/editor/TaskEditorForm'

function parsePositiveInt(raw: string | null | undefined): number | undefined {
  if (!raw) return undefined
  const num = Number(raw)
  return Number.isInteger(num) && num > 0 ? num : undefined
}

export function TaskCreatePage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const user = useAppStore((s) => s.user)
  const editId = parsePositiveInt(id)
  const cloneId = parsePositiveInt(searchParams.get('clone'))
  const rawModeParam = (searchParams.get('mode') ?? '').toLowerCase()
  const hasInvalidEditId = Boolean(id) && !editId
  const mode: 'create' | 'edit' | 'clone' = editId ? 'edit' : cloneId ? 'clone' : 'create'

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

  if (sourceId > 0 && loadingSource) {
    return (
      <div className="flex-1 w-full max-w-[1440px] space-y-4 animate-pulse">
        <div className="h-4 w-48 rounded bg-muted" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 h-80 rounded-xl bg-muted" />
          <div className="lg:col-span-4 h-80 rounded-xl bg-muted" />
        </div>
      </div>
    )
  }

  if (sourceId > 0 && hasSourceError) {
    const errorStatus = toErrorStatus(activeError)
    if (isFullPageError(errorStatus)) {
      throwFullPageError(errorStatus)
    }
    return (
      <InlineError
        status={errorStatus}
        onRetry={() => {
          void refetch()
          if (cloneId) void refetchHistory()
        }}
      />
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

  const initialVariant: 'full' | 'quick' | 'daily' =
    mode === 'create' && rawModeParam === 'quick'
      ? 'quick'
      : mode === 'create' && rawModeParam === 'daily' && isComputerRoomUser(user)
        ? 'daily'
        : 'full'

  return (
    <TaskEditorForm
      key={`${mode}-${sourceTask?.id ?? initialVariant}`}
      mode={mode}
      sourceTask={sourceTask}
      initialVariant={initialVariant}
      openHistoryOnMount={mode === 'create' && rawModeParam === 'clone'}
    />
  )
}

export default TaskCreatePage
