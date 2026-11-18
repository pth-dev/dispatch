import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import { http } from '@/services/http'
import { taskKeys } from './keys'
import type {
  Task,
  TaskListParams,
  TaskListResponse,
  TaskCreateFormValues,
  TaskReassignFormValues,
  TaskApproveFormValues,
  TaskRejectFormValues,
} from '@/schemas/task'
import type { Department } from '@/mocks/data/departments'

export function useTasks(params: TaskListParams) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params.scope) searchParams.set('scope', params.scope)
      if (params.search) searchParams.set('search', params.search)
      if (params.fromDate) searchParams.set('fromDate', params.fromDate)
      if (params.toDate) searchParams.set('toDate', params.toDate)
      if (params.department && params.department !== 'all') {
        searchParams.set('department', params.department)
      }
      if (params.status && (params.status as string) !== 'all') {
        searchParams.set('status', params.status)
      }
      if (params.page) searchParams.set('page', params.page.toString())
      if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString())

      const queryStr = searchParams.toString()
      const path = `/tasks${queryStr ? `?${queryStr}` : ''}`
      return http<TaskListResponse>(path)
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => http<Task>(`/tasks/${id}`),
    enabled: Boolean(id),
  })
}

export function useDepartments() {
  return useQuery({
    queryKey: taskKeys.departments(),
    queryFn: () => http<Department[]>('/departments'),
    staleTime: 5 * 60_000,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: TaskCreateFormValues) =>
      http<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}

export function useApproveTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: TaskApproveFormValues }) =>
      http<Task>(`/tasks/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify(data || {}),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(taskKeys.detail(updated.id), updated)
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}

export function useRejectTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskRejectFormValues }) =>
      http<Task>(`/tasks/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(taskKeys.detail(updated.id), updated)
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}

export function useReassignTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskReassignFormValues }) =>
      http<Task>(`/tasks/${id}/reassign`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(taskKeys.detail(updated.id), updated)
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}
