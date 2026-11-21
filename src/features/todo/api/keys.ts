export const todoKeys = {
  all: ['todos'] as const,
  byDate: (date: string) => [...todoKeys.all, date] as const,
}
