import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http, type ApiError } from '@/services/http'
import {
  IsoCalendarDateSchema,
  SaveTodoResponseSchema,
  TodoResponseSchema,
  type SaveTodoPayload,
  type TodoResponse,
} from '@/schemas/todo'
import { todoKeys } from './keys'

function assertSaveTodoSuccess(raw: unknown): void {
  if (raw === null || raw === undefined || typeof raw !== 'object') {
    return
  }
  const parsed = SaveTodoResponseSchema.safeParse(raw)
  if (!parsed.success) return
  if (parsed.data.success === false) {
    const message =
      parsed.data.message?.trim() ||
      parsed.data.err?.trim() ||
      'Save schedule failed'
    const err: ApiError = {
      status: 400,
      code: parsed.data.code,
      message,
      kind: 'business',
    }
    throw err
  }
}

export function useTodosByDate(date: string) {
  return useQuery({
    queryKey: todoKeys.byDate(date),
    queryFn: async ({ signal }): Promise<TodoResponse> => {
      const raw = await http<unknown>(`/todos?date=${encodeURIComponent(date)}`, { signal })
      if (!raw || typeof raw !== 'object') {
        return { task_data: [] }
      }
      return TodoResponseSchema.parse(raw)
    },
    enabled: IsoCalendarDateSchema.safeParse(date).success,
    staleTime: 30_000,
  })
}

export function useSaveTodos() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SaveTodoPayload) => {
      const raw = await http<unknown>('/todos', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      assertSaveTodoSuccess(raw)
      return payload
    },
    onSuccess: (payload) => {
      queryClient.setQueryData<TodoResponse>(todoKeys.byDate(payload.date), {
        task_data: payload.task_data,
      })
      void queryClient.invalidateQueries({ queryKey: todoKeys.byDate(payload.date) })
    },
  })
}
