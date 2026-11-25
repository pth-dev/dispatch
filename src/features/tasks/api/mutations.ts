import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { SHARED_QUERY_KEYS } from '@/constants/query-keys'
import { http, type ApiError } from '@/services/http'
import {
  AiGenerateReportResponseSchema,
  DeleteAttachmentResponseSchema,
  ReportMutationResponseSchema,
  TaskMutationResponseSchema,
  type AiGenerateReportResponse,
  type DeleteAttachmentResponse,
  type ReportMutationResponse,
  type TaskMutationResponse,
} from '@/schemas/task'
import { taskKeys } from './keys'

function invalidateTaskRelatedQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: taskKeys.list() })
  void queryClient.invalidateQueries({ queryKey: taskKeys.history() })
  void queryClient.invalidateQueries({ queryKey: SHARED_QUERY_KEYS.dashboard })
  void queryClient.invalidateQueries({ queryKey: SHARED_QUERY_KEYS.kpi })
}

type MutationEnvelope = {
  success: boolean
  code?: string | null
  message?: string | null
  err?: string | null
}

/**
 * Legacy backend may return HTTP 200 with `{ success: false, code, message }`.
 * Convert it into a structured business `ApiError` so callers never mistake a
 * rejected operation for success (docs/legacy-analysis/01-api-contract.md).
 */
export function assertMutationSuccess<T extends MutationEnvelope>(parsed: T): T {
  if (!parsed.success) {
    const err: ApiError = {
      status: 400,
      code: parsed.code ?? undefined,
      message: parsed.message || parsed.err || 'Request failed',
      kind: 'business',
    }
    throw err
  }
  return parsed
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData): Promise<TaskMutationResponse> => {
      const raw = await http<unknown>('/tasks', {
        method: 'POST',
        body: formData,
      })
      return assertMutationSuccess(TaskMutationResponseSchema.parse(raw))
    },
    onSuccess: () => {
      invalidateTaskRelatedQueries(queryClient)
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
      return assertMutationSuccess(TaskMutationResponseSchema.parse(raw))
    },
    onSuccess: () => {
      invalidateTaskRelatedQueries(queryClient)
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
      return assertMutationSuccess(TaskMutationResponseSchema.parse(raw))
    },
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: taskKeys.reports(id) })
      invalidateTaskRelatedQueries(queryClient)
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
      return assertMutationSuccess(ReportMutationResponseSchema.parse(raw))
    },
    onSuccess: (data, variables) => {
      invalidateTaskRelatedQueries(queryClient)
      void queryClient.invalidateQueries({ queryKey: taskKeys.reports(variables.taskId) })
      if (data.task_id && data.task_id !== variables.taskId) {
        void queryClient.invalidateQueries({ queryKey: taskKeys.reports(data.task_id) })
      }
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
      return assertMutationSuccess(ReportMutationResponseSchema.parse(raw))
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
      return assertMutationSuccess(DeleteAttachmentResponseSchema.parse(raw))
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.reports(variables.taskId) })
    },
  })
}

export function useGenerateAiReport() {
  return useMutation({
    mutationFn: async ({
      taskId,
      currentProgress,
    }: {
      taskId: number
      currentProgress: number
    }): Promise<AiGenerateReportResponse> => {
      const raw = await http<unknown>(`/tasks/${taskId}/ai-generate-report`, {
        method: 'POST',
        body: JSON.stringify({ currentProgress: String(currentProgress) }),
      })
      return assertMutationSuccess(AiGenerateReportResponseSchema.parse(raw))
    },
  })
}
