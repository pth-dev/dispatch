import { z } from 'zod'

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const KpiPeopleSearchParamsSchema = z.object({
  start: z.string().regex(ISO_DATE_RE).optional(),
  end: z.string().regex(ISO_DATE_RE).optional(),
  basis: z.enum(['final', 'created']).optional(),
  q: z.string().max(200).optional(),
  dept: z.string().max(120).optional(),
})

export const KpiBriefSearchParamsSchema = z.object({
  year: z
    .union([z.literal('all'), z.string().regex(/^\d{4}$/).transform(Number)])
    .optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  person: z.string().max(120).optional(),
  view: z
    .string()
    .refine(
      (v) => v === 'dept' || v === 'me' || v === 'all' || (v.startsWith('d:') && v.length > 2),
    )
    .optional(),
})

export function parseKpiPeopleSearchParams(params: URLSearchParams) {
  const raw = {
    start: params.get('start') || undefined,
    end: params.get('end') || undefined,
    basis: params.get('basis') || undefined,
    q: params.get('q') || undefined,
    dept: params.get('dept') || undefined,
  }
  const parsed = KpiPeopleSearchParamsSchema.safeParse(raw)
  return parsed.success ? parsed.data : {}
}

export function parseKpiBriefSearchParams(params: URLSearchParams) {
  const raw = {
    year: params.get('year') || undefined,
    month: params.get('month') || undefined,
    person: params.get('person') || undefined,
    view: params.get('view') || undefined,
  }
  const parsed = KpiBriefSearchParamsSchema.safeParse(raw)
  return parsed.success ? parsed.data : {}
}
