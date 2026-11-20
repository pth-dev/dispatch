import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/services/http'
import { useAppStore } from '@/app/store'
import type { SessionUser } from '@/schemas/auth'
import {
  DeleteAttachmentResponseSchema,
  DupCheckResponseSchema,
  RawReportListSchema,
  RawTaskListSchema,
  ReportMutationResponseSchema,
  TaskMutationResponseSchema,
  type DeleteAttachmentResponse,
  type DupCheckResponse,
  type RawReport,
  type RawTask,
  type ReportMutationResponse,
  type TaskListParams,
  type TaskMutationResponse,
  type TaskScopeCounts,
} from '@/schemas/task'
import {
  deriveTaskStatus,
  isTaskPaused,
  parseAssigneeList,
  parseReqDepts,
  sameDept,
} from '@/utils/task-domain'
import { taskKeys } from './keys'
import {
  fetchMetaDepts,
  fetchMetaSites,
  fetchPocketTaskTypes,
  fetchUserDirectory,
} from './meta'

function matchesAssignee(task: RawTask, user: SessionUser | null): boolean {
  if (!user) return false
  const assignees = parseAssigneeList(task.assign_person)
  const uname = user.username.trim().toLowerCase()
  const fname = user.fullname.trim().toLowerCase()
  return assignees.some((a) => {
    const lower = a.trim().toLowerCase()
    return lower === uname || (fname.length > 0 && lower === fname)
  })
}

function matchesCreator(task: RawTask, user: SessionUser | null): boolean {
  if (!user) return false
  return task.reporter.trim().toLowerCase() === user.username.trim().toLowerCase()
}

function extractDateOnly(dt: string | null | undefined): string {
  if (!dt) return ''
  return dt.trim().slice(0, 10)
}

export type FilteredTaskPage = {
  items: RawTask[]
  total: number
  counts: TaskScopeCounts
}

/**
 * Pure client-side scope counting, filtering, sorting, and pagination over the
 * full `GET /api/tasks` cache (docs/DEVIATIONS.md §9.2).
 */
export function filterAndPaginateTasks(
  tasks: RawTask[],
  params: TaskListParams,
  user: SessionUser | null,
  now: Date = new Date(),
): FilteredTaskPage {
  let mine = 0
  let created = 0
  for (const t of tasks) {
    if (matchesAssignee(t, user)) mine += 1
    if (matchesCreator(t, user)) created += 1
  }

  const counts: TaskScopeCounts = {
    mine,
    created,
    all: tasks.length,
  }

  const keyword = params.search?.trim().toLowerCase() ?? ''

  const filtered = tasks
    .filter((task) => {
      if (params.scope === 'mine' && !matchesAssignee(task, user)) return false
      if (params.scope === 'created' && !matchesCreator(task, user)) return false

      if (keyword) {
        const idStr = `#${task.id}`
        const haystack = [
          idStr,
          String(task.id),
          task.title,
          task.title_vn ?? '',
          task.assign_person ?? '',
          task.assigned_unit ?? '',
          task.reporter_name ?? '',
          task.reporter,
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(keyword)) return false
      }

      if (params.fromDate || params.toDate) {
        const dueDay = extractDateOnly(task.due_date)
        const createdDay = extractDateOnly(task.createdAt)
        const refDay = dueDay || createdDay
        if (params.fromDate && refDay && refDay < params.fromDate) return false
        if (params.toDate && refDay && refDay > params.toDate) return false
      }

      if (params.department) {
        const matchesAssigned = sameDept(task.assigned_unit, params.department)
        const matchesReq = parseReqDepts(task.req_depts, task.req_dept).some((d) =>
          sameDept(d, params.department),
        )
        if (!matchesAssigned && !matchesReq) return false
      }

      if (params.status) {
        if (params.status === 'paused') {
          if (!isTaskPaused(task)) return false
        } else if (deriveTaskStatus(task, now) !== params.status) {
          return false
        }
      }

      return true
    })
    .sort((a, b) => b.id - a.id)

  const total = filtered.length
  const start = (params.page - 1) * params.pageSize
  const items = filtered.slice(start, start + params.pageSize)

  return { items, total, counts }
}

export function useAllTasks() {
  return useQuery({
    queryKey: taskKeys.list(),
    queryFn: async ({ signal }): Promise<RawTask[]> => {
      const raw = await http<unknown>('/tasks', { signal })
      return RawTaskListSchema.parse(raw)
    },
    staleTime: 30_000,
  })
}

export function useTaskList(params: TaskListParams) {
  const user = useAppStore((s) => s.user)
  const query = useAllTasks()
  const pageData = query.data ? filterAndPaginateTasks(query.data, params, user) : undefined

  return {
    ...query,
    data: pageData,
  }
}

export function useTaskById(taskId: number) {
  const query = useAllTasks()
  const task =
    Number.isFinite(taskId) && taskId > 0
      ? query.data?.find((item) => item.id === taskId)
      : undefined

  return {
    ...query,
    data: task,
  }
}

export function useTaskReports(taskId: number) {
  return useQuery({
    queryKey: taskKeys.reports(taskId),
    queryFn: async ({ signal }): Promise<RawReport[]> => {
      const raw = await http<unknown>(`/tasks/${taskId}/reports`, { signal })
      return RawReportListSchema.parse(raw)
    },
    enabled: Number.isFinite(taskId) && taskId > 0,
    staleTime: 15_000,
  })
}

export function useMetaDepts() {
  return useQuery({
    queryKey: taskKeys.metaDepts(),
    queryFn: ({ signal }) => fetchMetaDepts(signal),
    staleTime: 10 * 60_000,
  })
}

export function useMetaSites() {
  return useQuery({
    queryKey: taskKeys.metaSites(),
    queryFn: ({ signal }) => fetchMetaSites(signal),
    staleTime: 10 * 60_000,
  })
}

export function useUserDirectory() {
  return useQuery({
    queryKey: taskKeys.directory(),
    queryFn: ({ signal }) => fetchUserDirectory(signal),
    staleTime: 5 * 60_000,
  })
}

export function usePocketTaskTypes() {
  return useQuery({
    queryKey: taskKeys.pocketTaskTypes(),
    queryFn: ({ signal }) => fetchPocketTaskTypes(signal),
    staleTime: 5 * 60_000,
  })
}

export async function checkDuplicateTask(params: {
  title: string
  due: string
  exclude?: number
  signal?: AbortSignal
}): Promise<DupCheckResponse> {
  const search = new URLSearchParams()
  search.set('title', params.title)
  search.set('due', params.due)
  if (params.exclude && params.exclude > 0) {
    search.set('exclude', String(params.exclude))
  }
  const raw = await http<unknown>(`/tasks/dup-check?${search.toString()}`, {
    signal: params.signal,
  })
  return DupCheckResponseSchema.parse(raw)
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData): Promise<TaskMutationResponse> => {
      const raw = await http<unknown>('/tasks', {
        method: 'POST',
        body: formData,
      })
      return TaskMutationResponseSchema.parse(raw)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.list() })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      formData,
    }: {
      id: number
      formData: FormData
    }): Promise<TaskMutationResponse> => {
      const raw = await http<unknown>(`/tasks/${id}`, {
        method: 'PUT',
        body: formData,
      })
      return TaskMutationResponseSchema.parse(raw)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.list() })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number): Promise<TaskMutationResponse> => {
      const raw = await http<unknown>(`/tasks/${id}`, {
        method: 'DELETE',
      })
      return TaskMutationResponseSchema.parse(raw)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.list() })
    },
  })
}

export function useSubmitReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      taskId,
      formData,
    }: {
      taskId: number
      formData: FormData
    }): Promise<ReportMutationResponse> => {
      const raw = await http<unknown>(`/tasks/${taskId}/reports`, {
        method: 'POST',
        body: formData,
      })
      return ReportMutationResponseSchema.parse(raw)
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.list() })
      void queryClient.invalidateQueries({ queryKey: taskKeys.reports(variables.taskId) })
    },
  })
}

export function useUpdateReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      reportId,
      content,
    }: {
      taskId: number
      reportId: number
      content: string
    }): Promise<ReportMutationResponse> => {
      const raw = await http<unknown>(`/reports/${reportId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      })
      return ReportMutationResponseSchema.parse(raw)
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.reports(variables.taskId) })
    },
  })
}

export function useDeleteReportAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      reportId,
      path,
    }: {
      taskId: number
      reportId: number
      path: string
    }): Promise<DeleteAttachmentResponse> => {
      const raw = await http<unknown>(
        `/reports/${reportId}/attachments?path=${encodeURIComponent(path)}`,
        { method: 'DELETE' },
      )
      return DeleteAttachmentResponseSchema.parse(raw)
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.reports(variables.taskId) })
    },
  })
}
