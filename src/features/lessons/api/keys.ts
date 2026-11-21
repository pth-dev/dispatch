export const lessonKeys = {
  all: ['lessons'] as const,
  list: () => [...lessonKeys.all, 'list'] as const,
}
