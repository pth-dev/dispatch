import { useQuery } from '@tanstack/react-query'
import { http } from '@/services/http'
import {
  RawLessonListResponseSchema,
  RawLessonListSchema,
  type RawLesson,
} from '@/schemas/lesson'

export const lessonKeys = {
  all: ['lessons'] as const,
  list: () => [...lessonKeys.all, 'list'] as const,
}

export function useLessons() {
  return useQuery({
    queryKey: lessonKeys.list(),
    // Shared across Dashboard, TaskList, Todo, and Lessons; let in-flight fetch populate cache.
    queryFn: async (): Promise<RawLesson[]> => {
      const raw = await http<unknown>('/lessons')
      if (Array.isArray(raw)) {
        return RawLessonListSchema.parse(raw)
      }
      return RawLessonListResponseSchema.parse(raw).list
    },
    staleTime: 60_000,
  })
}
