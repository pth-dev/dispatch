import * as React from 'react'
import { z } from 'zod'
import { useAppStore } from '@/app/store'

export type TaskViewMode = 'table' | 'card'

export const TASK_COLUMN_IDS = [
  'stt',
  'code',
  'title',
  'department',
  'assignee',
  'dueDate',
  'status',
  'lastReport',
  'taskType',
  'workItems',
  'reqDept',
  'site',
  'level',
  'reporter',
  'actions',
] as const

const TaskColumnIdSchema = z.enum(TASK_COLUMN_IDS)
const TaskColumnIdArraySchema = z.array(z.unknown())

export type TaskColumnId = z.infer<typeof TaskColumnIdSchema>

export const LOCKED_TASK_COLUMNS: ReadonlySet<TaskColumnId> = new Set(['code', 'title'])

export const DEFAULT_HIDDEN_TASK_COLUMNS: readonly TaskColumnId[] = [
  'lastReport',
  'taskType',
  'workItems',
  'reqDept',
  'site',
  'level',
  'reporter',
]

const VIEW_MODE_KEY_PREFIX = 'dispatch_task_view_mode_v1'
const HIDDEN_COLS_KEY_PREFIX = 'dispatch_task_cols_hidden_v1'
const ORDER_COLS_KEY_PREFIX = 'dispatch_task_cols_order_v1'

function scopedKey(prefix: string, username: string | undefined): string {
  return `${prefix}:${(username ?? '').trim().toLowerCase()}`
}

function readViewMode(username: string | undefined): TaskViewMode {
  try {
    const raw = localStorage.getItem(scopedKey(VIEW_MODE_KEY_PREFIX, username))
    return raw === 'card' ? 'card' : 'table'
  } catch {
    return 'table'
  }
}

function parseValidColumnIds(raw: string | null): TaskColumnId[] | null {
  if (raw === null) return null
  try {
    const json: unknown = JSON.parse(raw)
    const arr = TaskColumnIdArraySchema.safeParse(json)
    if (!arr.success) return null
    const valid: TaskColumnId[] = []
    for (const item of arr.data) {
      const parsed = TaskColumnIdSchema.safeParse(item)
      if (parsed.success) valid.push(parsed.data)
    }
    return valid
  } catch {
    return null
  }
}

function readHiddenColumns(username: string | undefined): TaskColumnId[] {
  try {
    const parsed = parseValidColumnIds(
      localStorage.getItem(scopedKey(HIDDEN_COLS_KEY_PREFIX, username)),
    )
    if (parsed === null) return [...DEFAULT_HIDDEN_TASK_COLUMNS]
    return parsed.filter((id) => !LOCKED_TASK_COLUMNS.has(id))
  } catch {
    return [...DEFAULT_HIDDEN_TASK_COLUMNS]
  }
}

function readColumnOrder(username: string | undefined): TaskColumnId[] {
  try {
    const parsed = parseValidColumnIds(
      localStorage.getItem(scopedKey(ORDER_COLS_KEY_PREFIX, username)),
    )
    if (parsed === null) return [...TASK_COLUMN_IDS]

    const seen = new Set<TaskColumnId>()
    const result: TaskColumnId[] = []
    for (const id of parsed) {
      if (!seen.has(id)) {
        seen.add(id)
        result.push(id)
      }
    }
    for (const id of TASK_COLUMN_IDS) {
      if (!seen.has(id)) result.push(id)
    }
    return result
  } catch {
    return [...TASK_COLUMN_IDS]
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore storage errors
  }
}

function isSameColumnList(a: readonly TaskColumnId[], b: readonly TaskColumnId[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}

export function useTaskViewPrefs() {
  const username = useAppStore((s) => s.user?.username)
  const [prevUser, setPrevUser] = React.useState(username)
  const [viewMode, setViewModeState] = React.useState<TaskViewMode>(() => readViewMode(username))
  const [hiddenColumns, setHiddenColumns] = React.useState<TaskColumnId[]>(() =>
    readHiddenColumns(username),
  )
  const [columnOrder, setColumnOrder] = React.useState<TaskColumnId[]>(() =>
    readColumnOrder(username),
  )

  if (prevUser !== username) {
    setPrevUser(username)
    setViewModeState(readViewMode(username))
    setHiddenColumns(readHiddenColumns(username))
    setColumnOrder(readColumnOrder(username))
  }

  const hiddenSet = new Set<TaskColumnId>(hiddenColumns)
  const visibleColumnIds = columnOrder.filter((id) => !hiddenSet.has(id))

  const isDefaultHidden =
    hiddenColumns.length === DEFAULT_HIDDEN_TASK_COLUMNS.length &&
    DEFAULT_HIDDEN_TASK_COLUMNS.every((id) => hiddenSet.has(id))
  const isDefaultColumns = isDefaultHidden && isSameColumnList(columnOrder, TASK_COLUMN_IDS)

  const setViewMode = (mode: TaskViewMode) => {
    setViewModeState(mode)
    writeStorage(scopedKey(VIEW_MODE_KEY_PREFIX, username), mode)
  }

  const toggleColumn = (id: TaskColumnId) => {
    if (LOCKED_TASK_COLUMNS.has(id)) return
    const next = hiddenSet.has(id)
      ? hiddenColumns.filter((col) => col !== id)
      : [...hiddenColumns, id]
    setHiddenColumns(next)
    writeStorage(scopedKey(HIDDEN_COLS_KEY_PREFIX, username), JSON.stringify(next))
  }

  const moveColumn = (id: TaskColumnId, direction: -1 | 1) => {
    const index = columnOrder.indexOf(id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= columnOrder.length) return
    const next = [...columnOrder]
    const current = next[index]
    const swapped = next[target]
    if (!current || !swapped) return
    next[index] = swapped
    next[target] = current
    setColumnOrder(next)
    writeStorage(scopedKey(ORDER_COLS_KEY_PREFIX, username), JSON.stringify(next))
  }

  const resetColumns = () => {
    setHiddenColumns([...DEFAULT_HIDDEN_TASK_COLUMNS])
    setColumnOrder([...TASK_COLUMN_IDS])
    removeStorage(scopedKey(HIDDEN_COLS_KEY_PREFIX, username))
    removeStorage(scopedKey(ORDER_COLS_KEY_PREFIX, username))
  }

  return {
    viewMode,
    hiddenSet,
    columnOrder,
    visibleColumnIds,
    isDefaultColumns,
    setViewMode,
    toggleColumn,
    moveColumn,
    resetColumns,
  }
}
