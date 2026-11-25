import { z } from 'zod'
import { MenuPermsRawSchema, UserRoleSchema } from './auth'

const StringListRawSchema = z
  .union([z.array(z.string()), z.string(), z.null()])
  .optional()
  .transform((value): string[] => {
    if (value == null || value === '') return []
    if (Array.isArray(value)) {
      return value.map((item) => item.trim()).filter(Boolean)
    }
    try {
      const parsed = JSON.parse(value) as unknown
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
      }
    } catch {
      // Fallback for pipe/comma-separated legacy strings
    }
    return value
      .split(/[,，、|;]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  })

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

// ── Phase 4A: Admin Users, Menu Perms, Extra Depts, Auth Source & Merge ──

export const ACCOUNT_STATUSES = ['Approved', 'Pending', 'Disabled'] as const
export const AccountStatusSchema = z.enum(ACCOUNT_STATUSES)
export type AccountStatus = z.infer<typeof AccountStatusSchema>

export const AdminUserSchema = z.object({
  id: z.coerce.number(),
  username: z.string(),
  fullname: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  dept: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  extra_depts: StringListRawSchema,
  view_depts: StringListRawSchema,
  site: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  role: UserRoleSchema.catch('user'),
  status: z
    .string()
    .nullish()
    .transform((v) => v ?? 'Pending'),
  auth_source: z
    .enum(['local', 'ad'])
    .nullish()
    .transform((v) => v ?? 'local'),
  email: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  title: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  dept_source: z
    .string()
    .nullish()
    .transform((v) => v ?? 'local'),
  dept_ou_dn: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  ad_dn: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  menu_perms: MenuPermsRawSchema,
  extra_depts_editable: z.boolean().optional(),
  createdAt: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  last_login: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
})

export type AdminUser = z.infer<typeof AdminUserSchema>
export const AdminUserListSchema = z.array(AdminUserSchema)

export const AdminUserFormSchema = z.object({
  username: z.string().trim().min(1, 'account.admin.validation.usernameRequired'),
  fullname: z.string().trim().min(1, 'account.admin.validation.fullnameRequired'),
  password: z.string(),
  dept: z.string().trim().min(1, 'account.admin.validation.deptRequired'),
  site: z.string().trim().min(1, 'account.admin.validation.siteRequired'),
  role: UserRoleSchema,
  status: z.string().min(1),
})

export type AdminUserFormValues = z.infer<typeof AdminUserFormSchema>

export const CreateAdminUserFormSchema = AdminUserFormSchema.refine(
  (data) => data.password.trim().length >= 6,
  {
    path: ['password'],
    message: 'account.admin.validation.passwordMin',
  },
)

export const EditAdminUserFormSchema = AdminUserFormSchema.refine(
  (data) => data.password.trim().length === 0 || data.password.trim().length >= 6,
  {
    path: ['password'],
    message: 'account.admin.validation.passwordMin',
  },
)

export const ConvertToAdFormSchema = z.object({
  ad_sam: z.string().trim().min(1, 'account.admin.validation.usernameRequired'),
  use_ad_username: z.boolean(),
})

export type ConvertToAdFormValues = z.infer<typeof ConvertToAdFormSchema>

export const ConvertToLocalFormSchema = z.object({
  password: z.string().trim().min(6, 'account.admin.validation.passwordMin'),
  enable: z.boolean(),
})

export type ConvertToLocalFormValues = z.infer<typeof ConvertToLocalFormSchema>

export const MergeAccountFormSchema = z.object({
  fromUsername: z.string().trim().min(1, 'account.admin.validation.usernameRequired'),
  disableSource: z.boolean(),
})

export type MergeAccountFormValues = z.infer<typeof MergeAccountFormSchema>

export const SimpleAdminMutationSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  site_created: z.boolean().optional(),
  changed: z.coerce.number().optional(),
  skipped: z.coerce.number().optional(),
})

export type SimpleAdminMutation = z.infer<typeof SimpleAdminMutationSchema>

export const BatchUsersResponseSchema = z.object({
  success: z.boolean().optional(),
  updated: z.coerce.number().optional().default(0),
  message: z.string().optional(),
  site_created: z.boolean().optional(),
  results: z
    .array(
      z.object({
        id: z.coerce.number().optional(),
        username: z.string().optional(),
        ok: z.boolean().optional(),
        message: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
})

export type BatchUsersResponse = z.infer<typeof BatchUsersResponseSchema>

export const AuthSourceResponseSchema = z.object({
  success: z.boolean().optional(),
  conflict: z.boolean().optional(),
  existing: z
    .object({
      id: z.coerce.number(),
      username: z.string(),
    })
    .optional(),
  message: z.string().optional(),
})

export type AuthSourceResponse = z.infer<typeof AuthSourceResponseSchema>

export const MergePreviewResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  from: z
    .object({
      username: z.string(),
      auth_source: z.string().optional(),
    })
    .optional(),
  to: z
    .object({
      username: z.string(),
    })
    .optional(),
  counts: z.record(z.string(), z.coerce.number()).optional().default({}),
})

export type MergePreviewResponse = z.infer<typeof MergePreviewResponseSchema>
