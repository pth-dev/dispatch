import { z } from 'zod'

const SAFE_RELATIVE_PATH_RE = /^\/(?!\/)/

export function sanitizeDownloadUrl(raw: string | null | undefined): string {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return ''
  if (SAFE_RELATIVE_PATH_RE.test(trimmed)) return trimmed
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString()
    }
  } catch {
    // Reject malformed or unsupported schemes (e.g. javascript:, data:)
  }
  return ''
}

export const AdminSiteSchema = z.object({
  code: z.string(),
  name: z.string().nullish().transform((v) => v ?? ''),
  vn: z.string().nullish().transform((v) => v ?? ''),
  label: z.string().nullish().transform((v) => v ?? ''),
  active: z
    .union([z.boolean(), z.number()])
    .nullish()
    .transform((v) => (v == null ? true : Boolean(v))),
})

export type AdminSite = z.infer<typeof AdminSiteSchema>

export const AdminSitesResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  sites: z.array(AdminSiteSchema).optional().default([]),
})

export const CreateSiteFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'account.system.sites.validation.codeRequired')
    .max(20, 'account.system.sites.validation.codeMax'),
  name: z
    .string()
    .trim()
    .min(1, 'account.system.sites.validation.nameRequired')
    .max(60, 'account.system.sites.validation.nameMax'),
  vn: z.string().trim().max(80, 'account.system.sites.validation.vnMax'),
})

export type CreateSiteFormValues = z.infer<typeof CreateSiteFormSchema>

export const OuRulePlanItemSchema = z.object({
  username: z.string(),
  fullname: z.string().nullish().transform((v) => v ?? ''),
  from_label: z.string().nullish().transform((v) => v ?? ''),
  to: z.string().nullish().transform((v) => v ?? ''),
  path: z.string().nullish().transform((v) => v ?? ''),
  unchanged: z.boolean().optional().default(false),
})

export type OuRulePlanItem = z.infer<typeof OuRulePlanItemSchema>

export const OuRuleResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  total: z.coerce.number().optional().default(0),
  changes: z.coerce.number().optional().default(0),
  applied: z.coerce.number().optional().default(0),
  failed: z.coerce.number().optional().default(0),
  plan: z.array(OuRulePlanItemSchema).optional().default([]),
})

export type OuRuleResponse = z.infer<typeof OuRuleResponseSchema>

export const ArchiveHistoryItemSchema = z.object({
  name: z.string().nullish().transform((v) => v ?? ''),
  path: z.string().nullish().transform((v) => v ?? ''),
  sizeBytes: z.coerce.number().optional().default(0),
  createdAt: z.string().nullish().transform((v) => v ?? ''),
  downloadUrl: z
    .string()
    .nullish()
    .transform((v) => sanitizeDownloadUrl(v)),
})

export type ArchiveHistoryItem = z.infer<typeof ArchiveHistoryItemSchema>

export const ArchiveInfoResponseSchema = z.object({
  defaultPath: z.string().nullish().transform((v) => v ?? ''),
  uploadsDir: z.string().nullish().transform((v) => v ?? ''),
  dbPath: z.string().nullish().transform((v) => v ?? ''),
  history: z.array(ArchiveHistoryItemSchema).optional().default([]),
})

export type ArchiveInfoResponse = z.infer<typeof ArchiveInfoResponseSchema>

export const ArchiveRunFormSchema = z.object({
  targetPath: z.string().trim().min(1, 'account.system.archive.validation.pathRequired'),
  format: z.enum(['zip', 'folder']),
  includeMessages: z.boolean(),
  includeTodos: z.boolean(),
  includeUsers: z.boolean(),
})

export type ArchiveRunFormValues = z.infer<typeof ArchiveRunFormSchema>

export const ArchiveRunResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  name: z.string().nullish().transform((v) => v ?? ''),
  path: z.string().nullish().transform((v) => v ?? ''),
  sizeBytes: z.coerce.number().optional().default(0),
  downloadUrl: z
    .string()
    .nullish()
    .transform((v) => sanitizeDownloadUrl(v)),
})

export type ArchiveRunResponse = z.infer<typeof ArchiveRunResponseSchema>
