import { z } from 'zod'

export const RawMessageReplySchema = z
  .object({
    id: z.coerce.number().optional(),
    message_id: z.coerce.number().optional(),
    username: z.string().nullish().transform((v) => v ?? ''),
    fullname: z.string().nullish().transform((v) => v ?? ''),
    content: z.string().nullish().transform((v) => v ?? ''),
    createdAt: z.string().nullish().transform((v) => v ?? ''),
    ip: z.string().nullish().transform((v) => v ?? ''),
  })
  .passthrough()

export type RawMessageReply = z.infer<typeof RawMessageReplySchema>

export const RawMessageSchema = z
  .object({
    id: z.coerce.number(),
    username: z.string().nullish().transform((v) => v ?? ''),
    fullname: z.string().nullish().transform((v) => v ?? ''),
    content: z.string().nullish().transform((v) => v ?? ''),
    createdAt: z.string().nullish().transform((v) => v ?? ''),
    ip: z.string().nullish().transform((v) => v ?? ''),
    replies: z
      .array(RawMessageReplySchema)
      .nullish()
      .transform((v) => v ?? []),
  })
  .passthrough()

export type RawMessage = z.infer<typeof RawMessageSchema>

export const RawMessageListSchema = z.array(RawMessageSchema)

export const MessageCreateFormSchema = z.object({
  content: z.string().trim().min(1, 'messages.validation.contentRequired'),
})

export type MessageCreateFormValues = z.infer<typeof MessageCreateFormSchema>

export const MessageReplyFormSchema = z.object({
  content: z.string().trim().min(1, 'messages.validation.replyRequired'),
})

export type MessageReplyFormValues = z.infer<typeof MessageReplyFormSchema>
