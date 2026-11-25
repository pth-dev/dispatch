import { z } from 'zod'

export const ReportPurposeSchema = z.enum(['pdf', 'kpi', 'progress', 'efficiency'])
export type ReportPurpose = z.infer<typeof ReportPurposeSchema>

export const WebReportItemSchema = z.object({
  id: z.coerce.number(),
  title: z.string().nullish().transform((v) => v ?? ''),
  report_no: z.string().nullish().transform((v) => v ?? ''),
  file_base: z.string().nullish().transform((v) => v ?? ''),
  lang: z.string().nullish().transform((v) => v ?? 'bi'),
  subject: z.string().nullish().transform((v) => v ?? ''),
  subject_label: z.string().nullish().transform((v) => v ?? ''),
  range_start: z.string().nullish().transform((v) => v ?? ''),
  range_end: z.string().nullish().transform((v) => v ?? ''),
  total: z.coerce.number().optional().default(0),
  size_bytes: z.coerce.number().optional().default(0),
  createdAt: z.string().nullish().transform((v) => v ?? ''),
})

export type WebReportItem = z.infer<typeof WebReportItemSchema>

export const WebReportListResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  items: z.array(WebReportItemSchema).optional().default([]),
})

export const WebReportSaveResponseSchema = z.object({
  success: z.boolean().optional(),
  id: z.coerce.number().optional(),
  message: z.string().optional(),
})

export const OfficeFileItemSchema = z.object({
  task_id: z.coerce.number(),
  name: z.string().nullish().transform((v) => v ?? ''),
  path: z.string().nullish().transform((v) => v ?? ''),
  ext: z.string().nullish().transform((v) => v ?? ''),
  source: z.string().nullish().transform((v) => v ?? ''),
  size: z.coerce.number().optional().default(0),
  exists: z.boolean().optional().default(true),
  hidden: z.boolean().optional().default(false),
})

export type OfficeFileItem = z.infer<typeof OfficeFileItemSchema>

export const OfficeFilesResponseSchema = z
  .object({
    success: z.boolean().optional(),
    message: z.string().optional(),
    items: z.array(OfficeFileItemSchema).optional(),
    files: z.array(OfficeFileItemSchema).optional(),
  })
  .transform((raw) => ({
    success: raw.success,
    message: raw.message,
    files: raw.items ?? raw.files ?? [],
  }))
