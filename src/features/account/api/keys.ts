export const accountKeys = {
  all: ['account'] as const,
  scope: () => [...accountKeys.all, 'scope'] as const,
  org: () => [...accountKeys.all, 'org'] as const,
  adminUsers: () => [...accountKeys.all, 'admin-users'] as const,
  adStatus: () => [...accountKeys.all, 'ad-status'] as const,
  adUsers: () => [...accountKeys.all, 'ad-users'] as const,
  adOus: () => [...accountKeys.all, 'ad-ous'] as const,
  adSyncLogs: () => [...accountKeys.all, 'ad-sync-logs'] as const,
  sites: () => [...accountKeys.all, 'sites'] as const,
  archiveInfo: () => [...accountKeys.all, 'archive-info'] as const,
} as const
