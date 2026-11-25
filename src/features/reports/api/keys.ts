import type { ReportPurpose } from '@/schemas/report'

export const reportKeys = {
  all: ['reports'] as const,
  tasks: (
    purpose: ReportPurpose,
    start: string,
    end: string,
    opts?: { includeCycles?: boolean; basis?: 'final' | 'created' },
  ) =>
    [
      ...reportKeys.all,
      'tasks',
      purpose,
      start,
      end,
      opts?.includeCycles ? 'cycles' : 'base',
      opts?.basis ?? 'default',
    ] as const,
  webreports: () => [...reportKeys.all, 'webreports'] as const,
}
