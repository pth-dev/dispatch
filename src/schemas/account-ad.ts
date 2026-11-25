import { z } from 'zod'

export const AdStatusResponseSchema = z.object({
  available: z.boolean().optional().default(false),
  installed: z.boolean().optional().default(false),
  syncing: z.boolean().optional().default(false),
  message: z.string().nullish().transform((v) => v ?? ''),
  nextSyncAt: z.string().nullish().transform((v) => v ?? ''),
  config: z
    .object({
      domain: z.string().nullish().transform((v) => v ?? ''),
      url: z.string().nullish().transform((v) => v ?? ''),
      syncMinutes: z.coerce.number().nullish().transform((v) => v ?? 30),
    })
    .nullish(),
  localAdAccounts: z
    .object({
      total: z.coerce.number().optional().default(0),
      disabled: z.coerce.number().optional().default(0),
    })
    .nullish(),
  lastSync: z
    .object({
      at: z.string().nullish().transform((v) => v ?? ''),
      ok: z.boolean().optional().default(false),
      message: z.string().nullish().transform((v) => v ?? ''),
    })
    .nullish(),
})

export type AdStatusResponse = z.infer<typeof AdStatusResponseSchema>

export const AdUserItemSchema = z.object({
  sam: z.string().nullish().transform((v) => v ?? ''),
  username: z.string().nullish().transform((v) => v ?? ''),
  sAMAccountName: z.string().nullish().transform((v) => v ?? ''),
  upn: z.string().nullish().transform((v) => v ?? ''),
  fullname: z.string().nullish().transform((v) => v ?? ''),
  displayName: z.string().nullish().transform((v) => v ?? ''),
  dept: z.string().nullish().transform((v) => v ?? ''),
  department: z.string().nullish().transform((v) => v ?? ''),
  ou: z.string().nullish().transform((v) => v ?? ''),
  dn: z.string().nullish().transform((v) => v ?? ''),
  mail: z.string().nullish().transform((v) => v ?? ''),
  email: z.string().nullish().transform((v) => v ?? ''),
  title: z.string().nullish().transform((v) => v ?? ''),
  state: z.string().nullish().transform((v) => v ?? ''),
  disabled: z.boolean().optional().default(false),
  expired: z.boolean().optional().default(false),
  locked: z.boolean().optional().default(false),
  exists: z.boolean().optional().default(false),
  linked: z.boolean().optional().default(false),
  localSource: z.string().nullish().transform((v) => v ?? ''),
  localUsername: z.string().nullish().transform((v) => v ?? ''),
  imported: z.boolean().optional().default(false),
})

export type AdUserItem = z.infer<typeof AdUserItemSchema>

export const AdUsersResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  users: z.array(AdUserItemSchema).optional().default([]),
})

export type AdUsersResponse = z.infer<typeof AdUsersResponseSchema>

export const AdImportResponseSchema = z.object({
  success: z.boolean().optional(),
  created: z.coerce.number().optional().default(0),
  linked: z.coerce.number().optional().default(0),
  failed: z.coerce.number().optional().default(0),
  message: z.string().optional(),
})

export type AdImportResponse = z.infer<typeof AdImportResponseSchema>

export const AdSyncLogEntrySchema = z.object({
  createdAt: z.string().nullish().transform((v) => v ?? ''),
  trigger: z.string().nullish().transform((v) => v ?? ''),
  ok: z.boolean().optional().default(false),
  ad_total: z.coerce.number().optional().default(0),
  checked: z.coerce.number().optional().default(0),
  disabled: z.coerce.number().optional().default(0),
  deleted: z.coerce.number().optional().default(0),
  restored: z.coerce.number().optional().default(0),
  message: z.string().nullish().transform((v) => v ?? ''),
})

export type AdSyncLogEntry = z.infer<typeof AdSyncLogEntrySchema>

export const AdSyncLogsResponseSchema = z.object({
  success: z.boolean().optional(),
  logs: z.array(AdSyncLogEntrySchema).optional().default([]),
})

export const AdDiagnoseStepSchema = z
  .union([
    z.boolean().transform((ok) => ({
      ok,
      ms: undefined as number | undefined,
      entries: undefined as number | undefined,
      error: '',
      message: '',
    })),
    z.object({
      ok: z.boolean().optional().default(false),
      ms: z.coerce.number().optional(),
      entries: z.coerce.number().optional(),
      error: z.string().nullish().transform((v) => v ?? ''),
      message: z.string().nullish().transform((v) => v ?? ''),
    }),
  ])
  .nullish()
  .transform((v) => v ?? null)

export type AdDiagnoseStep = z.infer<typeof AdDiagnoseStepSchema>

export const AdDiagnoseDnsSchema = z.object({
  srv: z.array(z.string()).nullish().transform((v) => v ?? []),
  a: z.array(z.string()).nullish().transform((v) => v ?? []),
  lookup: z.array(z.string()).nullish().transform((v) => v ?? []),
  errors: z.record(z.string(), z.string()).nullish().transform((v) => v ?? {}),
})

export const AdDiagnoseResponseSchema = z.object({
  success: z.boolean().optional(),
  result: z
    .object({
      domain: z.string().nullish().transform((v) => v ?? ''),
      baseDN: z.string().nullish().transform((v) => v ?? ''),
      bindUser: z.string().nullish().transform((v) => v ?? ''),
      passwordSet: z.boolean().optional().default(false),
      durationMs: z.coerce.number().optional().default(0),
      goodUrl: z.string().nullish().transform((v) => v ?? ''),
      dns: AdDiagnoseDnsSchema.nullish(),
      tests: z
        .array(
          z.object({
            url: z.string().optional().default(''),
            tcp: AdDiagnoseStepSchema,
            bind: AdDiagnoseStepSchema,
            search: AdDiagnoseStepSchema,
          }),
        )
        .optional()
        .default([]),
      hints: z.array(z.string()).optional().default([]),
    })
    .nullish(),
})

export type AdDiagnoseResponse = z.infer<typeof AdDiagnoseResponseSchema>
