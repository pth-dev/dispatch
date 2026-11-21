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
