import { z } from 'zod'
import { RawAttachmentSchema } from './task'

export const LESSON_TOPIC_MAX = 200
export const LESSON_KEYWORD_MAX = 30
export const LESSON_KEYWORD_CHAR_MAX = 40
export const LESSON_IMAGE_MAX_MB = 20
export const LESSON_IMAGE_MAX_FILES = 20

export const RawLessonSchema = z.object({
  id: z.coerce.number(),
  topic: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  keywords: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  keyword_list: z.array(z.string()).nullish(),
  content: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  images: z.union([z.string(), z.array(RawAttachmentSchema)]).nullish(),
  dept: z.string().nullish(),
  created_by: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  created_name: z.string().nullish(),
  createdAt: z.string().nullish(),
  updated_by: z.string().nullish(),
  updatedAt: z.string().nullish(),
})
export type RawLesson = z.infer<typeof RawLessonSchema>

export const RawLessonListSchema = z.array(RawLessonSchema)

export const RawLessonListResponseSchema = z.object({
  list: RawLessonListSchema.default([]),
})

export const LessonMutationResponseSchema = z
  .object({
    success: z.boolean().optional(),
    id: z.coerce.number().optional(),
    message: z.string().optional(),
    err: z.string().optional(),
    code: z.string().optional(),
    note: z.string().optional(),
  })
  .passthrough()

export const LessonFormSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(1, 'lessons.validation.topicRequired')
    .max(LESSON_TOPIC_MAX, 'lessons.validation.topicMax'),
  keywords: z
    .array(z.string().trim().min(1).max(LESSON_KEYWORD_CHAR_MAX))
    .min(1, 'lessons.validation.keywordsRequired')
    .max(LESSON_KEYWORD_MAX, 'lessons.validation.keywordsMax'),
  content: z.string(),
})
export type LessonFormValues = z.infer<typeof LessonFormSchema>
