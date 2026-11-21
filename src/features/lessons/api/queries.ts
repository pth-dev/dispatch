import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http, type ApiError } from '@/services/http'
import {
  LessonMutationResponseSchema,
  RawLessonListResponseSchema,
  RawLessonListSchema,
  type RawLesson,
} from '@/schemas/lesson'
import type { RawAttachment } from '@/schemas/task'
import { lessonKeys } from './keys'

export type SaveLessonPayload = {
  topic: string
  keywords: string[]
  content: string
  files: File[]
}

export type UpdateLessonPayload = SaveLessonPayload & {
  id: number
  retainedImages: RawAttachment[]
}

export type LessonMutationResult = {
  id?: number
  note?: string
}

function assertLessonSuccess(raw: unknown): LessonMutationResult {
  const parsed = LessonMutationResponseSchema.safeParse(raw)
  if (!parsed.success) {
    return {}
  }
  const data = parsed.data

  if (data.success === false) {
    const err: ApiError = {
      status: 400,
      code: data.code,
      message:
        data.message && data.message.trim().length > 0
          ? data.message
          : data.err && data.err.trim().length > 0
            ? data.err
            : 'Request failed',
      kind: 'business',
    }
    throw err
  }

  return {
    id: typeof data.id === 'number' && Number.isFinite(data.id) && data.id > 0 ? data.id : undefined,
    note: data.note,
  }
}

function buildLessonFormData(
  payload: SaveLessonPayload,
  retainedImages?: RawAttachment[],
): FormData {
  const fd = new FormData()
  fd.append('topic', payload.topic.trim())
  fd.append('keywords', payload.keywords.join(','))
  fd.append('content', payload.content)
  if (retainedImages) {
    fd.append('retainedImages', JSON.stringify(retainedImages))
  }
  for (const file of payload.files) {
    fd.append('files', file, file.name)
  }
  return fd
}

export function useLessons() {
  return useQuery({
    queryKey: lessonKeys.list(),
    queryFn: async ({ signal }): Promise<RawLesson[]> => {
      const raw = await http<unknown>('/lessons', { signal })
      if (Array.isArray(raw)) {
        return RawLessonListSchema.parse(raw)
      }
      return RawLessonListResponseSchema.parse(raw).list
    },
    staleTime: 30_000,
  })
}

export function useCreateLesson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SaveLessonPayload): Promise<LessonMutationResult> => {
      const raw = await http<unknown>('/lessons', {
        method: 'POST',
        body: buildLessonFormData(payload),
      })
      return assertLessonSuccess(raw)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: lessonKeys.list() })
    },
  })
}

export function useUpdateLesson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateLessonPayload): Promise<LessonMutationResult> => {
      const raw = await http<unknown>(`/lessons/${payload.id}`, {
        method: 'PUT',
        body: buildLessonFormData(payload, payload.retainedImages),
      })
      return assertLessonSuccess(raw)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: lessonKeys.list() })
    },
  })
}

export function useDeleteLesson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const raw = await http<unknown>(`/lessons/${id}`, {
        method: 'DELETE',
      })
      assertLessonSuccess(raw)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: lessonKeys.list() })
    },
  })
}
