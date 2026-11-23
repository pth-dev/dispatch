export const accountKeys = {
  all: ['account'] as const,
  scope: () => [...accountKeys.all, 'scope'] as const,
  org: () => [...accountKeys.all, 'org'] as const,
} as const
