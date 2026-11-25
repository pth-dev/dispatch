export const worklogKeys = {
  all: ['worklog'] as const,
  records: (user: string, start: string, end: string) =>
    [...worklogKeys.all, 'records', user, start, end] as const,
  users: () => [...worklogKeys.all, 'users'] as const,
}
