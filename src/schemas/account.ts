import { z } from 'zod'
import { UserRoleSchema } from './auth'

export const AccountDeptNodeSchema = z.object({
  value: z.string(),
  label: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  source: z
    .string()
    .nullish()
    .transform((v) => v ?? 'local'),
  path: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  ou_dn: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  members: z.coerce
    .number()
    .nullish()
    .transform((v) => v ?? 0),
})

export type AccountDeptNode = z.infer<typeof AccountDeptNodeSchema>

export const AccountScopeUserSchema = z.object({
  username: z.string(),
  fullname: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  role: UserRoleSchema.catch('user'),
  auth_source: z
    .enum(['local', 'ad'])
    .nullish()
    .transform((v) => v ?? 'local'),
  dept: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  dept_label: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  dept_source: z
    .string()
    .nullish()
    .transform((v) => v ?? 'local'),
  own_ou_path: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  ad_dn: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  rule_dept: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  rule_path: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
})

export type AccountScopeUser = z.infer<typeof AccountScopeUserSchema>

export const AccountScopeResponseSchema = z.object({
  success: z.boolean().optional(),
  note: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  superlike: z
    .union([z.boolean(), z.number()])
    .nullish()
    .transform((v) => Boolean(v)),
  rule_level: z.coerce
    .number()
    .nullish()
    .transform((v) => v ?? 1),
  user: AccountScopeUserSchema,
  extra_depts: z
    .array(AccountDeptNodeSchema)
    .nullish()
    .transform((v) => v ?? []),
  sub_depts: z
    .array(AccountDeptNodeSchema)
    .nullish()
    .transform((v) => v ?? []),
  view_depts: z
    .array(AccountDeptNodeSchema)
    .nullish()
    .transform((v) => v ?? []),
  visible: z
    .array(AccountDeptNodeSchema)
    .nullish()
    .transform((v) => v ?? []),
})

export type AccountScopeResponse = z.infer<typeof AccountScopeResponseSchema>

export const AccountOrgResponseSchema = z.object({
  success: z.boolean().optional(),
  rule_level: z.coerce
    .number()
    .nullish()
    .transform((v) => v ?? 1),
  items: z
    .array(AccountDeptNodeSchema)
    .nullish()
    .transform((v) => v ?? []),
  assignable: z.array(z.string()).nullish(),
})

export type AccountOrgResponse = z.infer<typeof AccountOrgResponseSchema>
