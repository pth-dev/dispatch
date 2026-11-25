import type { ReportPurpose } from '@/schemas/report'

export const reportKeys = {
  all: ['reports'] as const,
  tasks: (purpose: ReportPurpose, start: string, end: string) =>
    [...reportKeys.all, 'tasks', purpose, start, end] as const,
  webreports: () => [...reportKeys.all, 'webreports'] as const,
}
