import { z } from 'zod'
import { RawAttachmentSchema, type RawAttachment } from './task'

const WorkRecordAttachmentsSchema = z
  .union([z.string(), z.array(RawAttachmentSchema), z.null()])
  .optional()
  .transform((value): RawAttachment[] => {
    if (!value) return []
    if (Array.isArray(value)) return value
    try {
      const parsed = JSON.parse(value) as unknown
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => RawAttachmentSchema.safeParse(item))
          .filter((r) => r.success)
          .map((r) => r.data)
      }
    } catch {
      // Ignore malformed legacy attachment JSON
    }
    return []
  })

export const WorkRecordSchema = z.object({
  id: z.coerce.number().optional().default(0),
  task_id: z.coerce.number(),
  username: z.string().nullish().transform((v) => v ?? ''),
  fullname: z.string().nullish().transform((v) => v ?? ''),
  title: z.string().nullish().transform((v) => v ?? ''),
  title_vn: z.string().nullish().transform((v) => v ?? ''),
  content: z.string().nullish().transform((v) => v ?? ''),
  progress: z.coerce.number().nullish().transform((v) => v ?? 0),
  attachments: WorkRecordAttachmentsSchema,
  createdAt: z.string().nullish().transform((v) => v ?? ''),
})

export type WorkRecord = z.infer<typeof WorkRecordSchema>
export const WorkRecordListSchema = z.array(WorkRecordSchema)
