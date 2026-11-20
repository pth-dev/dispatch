import { z } from 'zod'

export const DeptItemSchema = z.object({
  value: z.string(),
  zh: z.string().nullish(),
  vn: z.string().nullish(),
  label: z.string().nullish(),
  source: z.string().nullish(),
  ou_dn: z.string().nullish(),
  active: z.union([z.boolean(), z.number()]).nullish(),
})

export type DeptItem = z.infer<typeof DeptItemSchema>

export const MetaDeptsResponseSchema = z.object({
  depts: z.array(DeptItemSchema),
  allDepts: z.array(DeptItemSchema).optional(),
  roles: z.unknown().optional(),
  secrecy: z.unknown().optional(),
  secrecy_order: z.array(z.number()).optional(),
  dispatch_nature: z.unknown().optional(),
  levels: z.unknown().optional(),
  legacy: z.unknown().optional(),
  otherValue: z.string().optional(),
})

export type MetaDeptsResponse = z.infer<typeof MetaDeptsResponseSchema>

export const SiteItemSchema = z.object({
  value: z.string(),
  name: z.string().nullish(),
  vn: z.string().nullish(),
  label: z.string().nullish(),
  active: z.union([z.boolean(), z.number()]).nullish(),
  builtin: z.union([z.boolean(), z.number()]).nullish(),
})

export type SiteItem = z.infer<typeof SiteItemSchema>

export const MetaSitesResponseSchema = z.object({
  sites: z.array(SiteItemSchema),
  allSites: z.array(SiteItemSchema).optional(),
  otherValue: z.string().optional(),
  roles: z.unknown().optional(),
  secrecy: z.unknown().optional(),
  secrecy_order: z.array(z.number()).optional(),
  dispatch_nature: z.unknown().optional(),
  levels: z.unknown().optional(),
  legacy: z.unknown().optional(),
})

export type MetaSitesResponse = z.infer<typeof MetaSitesResponseSchema>

export const PocketValueItemSchema = z.object({
  id: z.coerce.number(),
  value: z.string(),
})

export type PocketValueItem = z.infer<typeof PocketValueItemSchema>
export const PocketValueListSchema = z.array(PocketValueItemSchema)

export const PocketTypeDetailItemSchema = z.object({
  id: z.coerce.number(),
  kind: z.string(),
  value: z.string(),
})

export type PocketTypeDetailItem = z.infer<typeof PocketTypeDetailItemSchema>
export const PocketTypeDetailListSchema = z.array(PocketTypeDetailItemSchema)

export const PocketContactItemSchema = z.object({
  id: z.coerce.number(),
  contact: z.string(),
  fullname: z.string().nullish(),
  dept: z.string().nullish(),
  source: z.string().nullish(),
  status: z.string().nullish(),
})

export type PocketContactItem = z.infer<typeof PocketContactItemSchema>
export const PocketContactListSchema = z.array(PocketContactItemSchema)
