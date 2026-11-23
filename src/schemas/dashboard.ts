import { z } from 'zod'

export const PostGranularitySchema = z.enum(['day', 'week', 'month'])
export type PostGranularity = z.infer<typeof PostGranularitySchema>

export const PostKpiPeriodSchema = z.enum(['month', 'quarter', 'year'])
export type PostKpiPeriod = z.infer<typeof PostKpiPeriodSchema>

export const PostStatsSeriesSchema = z.object({
  label: z.string(),
  username: z.string().nullish(),
  data: z.array(z.coerce.number()),
  total: z.coerce.number(),
})

export type PostStatsSeries = z.infer<typeof PostStatsSeriesSchema>

export const PostStatsRankingRowSchema = z.object({
  rank: z.coerce.number(),
  username: z.string(),
  fullname: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  dept_label: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  posts: z.coerce.number(),
  kpi_total: z.coerce.number(),
  completionRate: z.coerce.number(),
  ontimeRate: z.coerce.number(),
  kpi_score: z.coerce.number().nullable(),
})

export type PostStatsRankingRow = z.infer<typeof PostStatsRankingRowSchema>

export const PostDeptOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  path: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
})

export type PostDeptOption = z.infer<typeof PostDeptOptionSchema>

export const PostStatsResponseSchema = z.object({
  success: z.boolean().optional(),
  level: z.string().optional(),
  gran: PostGranularitySchema.catch('day'),
  dept: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  dept_label: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  sub: z
    .union([z.boolean(), z.number()])
    .nullish()
    .transform((v) => Boolean(v)),
  dept_set: z
    .array(z.string())
    .nullish()
    .transform((v) => v ?? []),
  dept_options: z
    .array(PostDeptOptionSchema)
    .nullish()
    .transform((v) => v ?? []),
  labels: z
    .array(z.string())
    .nullish()
    .transform((v) => v ?? []),
  series: z
    .array(PostStatsSeriesSchema)
    .nullish()
    .transform((v) => v ?? []),
  total_series: z
    .array(z.coerce.number())
    .nullish()
    .transform((v) => v ?? []),
  total: z.coerce
    .number()
    .nullish()
    .transform((v) => v ?? 0),
  ranking: z
    .array(PostStatsRankingRowSchema)
    .nullish()
    .transform((v) => v ?? []),
  kpi_period: z
    .object({
      kind: PostKpiPeriodSchema.catch('month'),
      label: z.string().default(''),
    })
    .optional(),
  kpi_formula: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
})

export type PostStatsResponse = z.infer<typeof PostStatsResponseSchema>
