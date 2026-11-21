import * as React from 'react'
import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store'
import { useAllTasks } from '@/hooks/use-tasks'
import { useLessons } from '@/hooks/use-lessons'
import type { TodoItem } from '@/schemas/todo'
import { resolveApiErrorMessage } from '@/services/http'
import { canWriteMenu } from '@/utils/permissions'
import { toLocalDateString } from '@/utils/task-domain'
import { buildTaskLessonHitsMap } from '@/utils/lesson-match'
import { useSaveTodos, useTodosByDate } from '../api/queries'
import {
  downloadTodoCsv,
  getMyUnfinishedTasks,
  isValidIsoDate,
  matchesTodoQuery,
  sortTimelineTasks,
  splitTodoTasks,
} from '../utils/todo-domain'

export interface TodoFeedback {
  tone: 'success' | 'error'
  message: string
}

export function useTodoSchedule() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const user = useAppStore((s) => s.user)

  const today = toLocalDateString(new Date())
  const rawDate = searchParams.get('date')
  const selectedDate = isValidIsoDate(rawDate) ? rawDate : today

  const [draftByDate, setDraftByDate] = React.useState<{
    date: string
    items: TodoItem[]
  } | null>(null)
  const [availableSearch, setAvailableSearch] = React.useState('')
  const [selectedSearch, setSelectedSearch] = React.useState('')
  const [pendingDateChange, setPendingDateChange] = React.useState<string | null>(null)
  const [confirmMissingTimeOpen, setConfirmMissingTimeOpen] = React.useState(false)
  const [feedback, setFeedback] = React.useState<TodoFeedback | null>(null)

  const tasksQuery = useAllTasks()
  const todosQuery = useTodosByDate(selectedDate)
  const lessonsQuery = useLessons()
  const saveMutation = useSaveTodos()

  const canWrite = canWriteMenu(user, 'todo')
  const allTasks = tasksQuery.data ?? []
  const lessons = lessonsQuery.data ?? []
  const unfinishedTasks = getMyUnfinishedTasks(allTasks, user)

  const isDirty = draftByDate !== null && draftByDate.date === selectedDate
  const activeSavedItems = isDirty
    ? draftByDate.items
    : (todosQuery.data?.task_data ?? [])

  const { selected, available } = splitTodoTasks(unfinishedTasks, activeSavedItems)
  const selectedIndexById = new Map<number, number>()
  selected.forEach((entry, idx) => {
    selectedIndexById.set(entry.task.id, idx)
  })
  const filteredAvailable = available.filter((task) =>
    matchesTodoQuery(task, availableSearch),
  )
  const filteredSelected = selected.filter((entry) =>
    matchesTodoQuery(entry.task, selectedSearch),
  )
  const timelineTasks = sortTimelineTasks(unfinishedTasks)
  const lessonHitsByTaskId = buildTaskLessonHitsMap(unfinishedTasks, lessons)

  const missingTimeCount = selected.filter((entry) => !entry.startTime).length

  const updateDraft = (updater: (current: TodoItem[]) => TodoItem[]) => {
    if (!canWrite) return
    const baseItems: TodoItem[] = selected.map((entry) => ({
      id: entry.task.id,
      start_time: entry.startTime,
    }))
    setDraftByDate({
      date: selectedDate,
      items: updater(baseItems),
    })
  }

  const addTask = (taskId: number) => {
    updateDraft((items) => {
      if (items.some((item) => item.id === taskId)) return items
      return [...items, { id: taskId, start_time: '' }]
    })
  }

  const removeTask = (taskId: number) => {
    updateDraft((items) => items.filter((item) => item.id !== taskId))
  }

  const reorderTask = (taskId: number, delta: -1 | 1) => {
    setSelectedSearch('')
    updateDraft((items) => {
      const idx = items.findIndex((item) => item.id === taskId)
      const targetIdx = idx + delta
      if (idx < 0 || targetIdx < 0 || targetIdx >= items.length) return items
      const next = [...items]
      const currentItem = next[idx]
      const swapItem = next[targetIdx]
      if (!currentItem || !swapItem) return items
      next[idx] = swapItem
      next[targetIdx] = currentItem
      return next
    })
  }

  const updateStartTime = (taskId: number, startTime: string) => {
    updateDraft((items) =>
      items.map((item) =>
        item.id === taskId ? { ...item, start_time: startTime } : item,
      ),
    )
  }

  const moveByDrop = (taskId: number, target: 'left' | 'right') => {
    if (target === 'right') {
      addTask(taskId)
    } else {
      removeTask(taskId)
    }
  }

  const applyDateChange = (nextDate: string) => {
    if (!isValidIsoDate(nextDate)) return
    setDraftByDate(null)
    setPendingDateChange(null)
    const nextParams = new URLSearchParams(searchParams)
    if (nextDate === today) {
      nextParams.delete('date')
    } else {
      nextParams.set('date', nextDate)
    }
    setSearchParams(nextParams, { replace: true })
  }

  const requestDateChange = (nextDate: string) => {
    if (!isValidIsoDate(nextDate) || nextDate === selectedDate) return
    if (isDirty) {
      setPendingDateChange(nextDate)
      return
    }
    applyDateChange(nextDate)
  }

  const performSave = () => {
    const taskData: TodoItem[] = selected.map((entry) => ({
      id: entry.task.id,
      start_time: entry.startTime,
    }))
    setFeedback(null)
    saveMutation.mutate(
      { date: selectedDate, task_data: taskData },
      {
        onSuccess: () => {
          setDraftByDate(null)
          setConfirmMissingTimeOpen(false)
          setFeedback({ tone: 'success', message: t('todo.toast.saveSuccess') })
        },
        onError: (error) => {
          setConfirmMissingTimeOpen(false)
          setFeedback({
            tone: 'error',
            message:
              resolveApiErrorMessage(error, t, i18n.language) ||
              t('todo.toast.saveError'),
          })
        },
      },
    )
  }

  const isLoading = tasksQuery.isLoading || todosQuery.isLoading
  const loadError = tasksQuery.error ?? todosQuery.error

  const requestSave = () => {
    if (!canWrite || saveMutation.isPending || isLoading || Boolean(loadError)) return
    if (missingTimeCount > 0) {
      setConfirmMissingTimeOpen(true)
      return
    }
    performSave()
  }

  const handleExportCsv = () => {
    if (selected.length === 0) {
      setFeedback({ tone: 'error', message: t('todo.toast.exportEmpty') })
      return
    }
    downloadTodoCsv(
      selected,
      selectedDate,
      user?.username ?? 'user',
      {
        startTime: t('todo.csv.startTime'),
        taskId: t('todo.csv.taskId'),
        title: t('todo.csv.title'),
        titleVn: t('todo.csv.titleVn'),
        site: t('todo.csv.site'),
        level: t('todo.csv.level'),
        progress: t('todo.csv.progress'),
        dueDate: t('todo.csv.dueDate'),
        reqDept: t('todo.csv.reqDept'),
      },
      {
        timeUnset: t('todo.timeUnset'),
        noDueDate: t('todo.noDueDate'),
      },
    )
    setFeedback({ tone: 'success', message: t('todo.toast.exportSuccess') })
  }

  return {
    today,
    selectedDate,
    canWrite,
    isDirty,
    feedback,
    dismissFeedback: () => setFeedback(null),
    isLoading,
    error: loadError,
    refetchAll: () => {
      void tasksQuery.refetch()
      void todosQuery.refetch()
    },
    isSaving: saveMutation.isPending,
    available,
    selected,
    selectedIndexById,
    filteredAvailable,
    filteredSelected,
    timelineTasks,
    lessonHitsByTaskId,
    missingTimeCount,
    availableSearch,
    setAvailableSearch,
    selectedSearch,
    setSelectedSearch,
    addTask,
    removeTask,
    reorderTask,
    updateStartTime,
    moveByDrop,
    requestDateChange,
    pendingDateChange,
    confirmDateChange: () => {
      if (pendingDateChange) applyDateChange(pendingDateChange)
    },
    cancelDateChange: () => setPendingDateChange(null),
    requestSave,
    confirmMissingTimeOpen,
    confirmSaveWithMissingTime: performSave,
    cancelSaveWithMissingTime: () => setConfirmMissingTimeOpen(false),
    handleExportCsv,
  }
}
