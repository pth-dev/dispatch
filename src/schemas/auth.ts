import { z } from 'zod'

export const USER_ROLES = [
  'user',
  'admin',
  'superadmin',
  'exec_assistant',
  'exec_vp',
] as const

export const UserRoleSchema = z.enum(USER_ROLES)
export type BackendUserRole = z.infer<typeof UserRoleSchema>

export const MENU_PERM_KEYS = [
  'dashboard',
  'list',
  'messages',
  'learnknow',
  'language',
  'todo',
  'worklog',
  'report_pdf',
  'kpi_report',
  'excel_report',
  'kpi_people',
  'kpi_brief',
  'account',
  'ad',
  'dash_total',
  'dash_dept',
] as const

export const MenuPermKeySchema = z.enum(MENU_PERM_KEYS)
export type MenuPermKey = z.infer<typeof MenuPermKeySchema>

export const MenuPermsRawSchema = z
  .union([z.record(z.string(), z.string()), z.string(), z.null()])
  .optional()
  .transform((value): Record<string, string> | null => {
    if (value == null || value === '') return null
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value) as unknown
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const record: Record<string, string> = {}
          for (const [k, v] of Object.entries(parsed)) {
            if (typeof v === 'string') record[k] = v
          }
          return record
        }
        return null
      } catch {
        return null
      }
    }
    return value
  })

const ExtraDeptsRawSchema = z
  .union([z.array(z.string()), z.string(), z.null()])
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
      // Fallback for comma/pipe delimited legacy strings
    }
    return value
      .split(/[,，、|;]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  })
  .optional()

export const SessionUserSchema = z.object({
  id: z.coerce.number().optional(),
  username: z.string().min(1),
  fullname: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  dept: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  extra_depts: ExtraDeptsRawSchema,
  site: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  role: UserRoleSchema.catch('user'),
  status: z.string().nullish(),
  auth_source: z
    .enum(['local', 'ad'])
    .nullish()
    .transform((v) => v ?? 'local'),
  email: z.string().nullish(),
  title: z.string().nullish(),
  dept_source: z.string().nullish(),
  dept_ou_dn: z.string().nullish(),
  ad_dn: z.string().nullish(),
  menu_perms: MenuPermsRawSchema,
  is_computer_room: z
    .union([z.boolean(), z.number()])
    .nullish()
    .transform((v) => Boolean(v)),
})

export type SessionUser = z.infer<typeof SessionUserSchema>

export const LoginFormSchema = z.object({
  username: z.string().trim().min(1, 'login.validation.usernameRequired'),
  password: z.string().min(1, 'login.validation.passwordRequired'),
  remember: z.boolean(),
})

export type LoginFormValues = z.infer<typeof LoginFormSchema>

export const SITE_OTHER_VALUE = '__OTHER__'
const INVALID_SITE_OTHER_CHARS = /[,，;、|/]/

export const RegisterFormSchema = z
  .object({
    username: z.string().trim().min(1, 'login.validation.usernameRequired'),
    password: z.string().min(1, 'login.validation.passwordRequired'),
    fullname: z.string().trim().min(1, 'register.validation.fullnameRequired'),
    dept: z.string().trim().min(1, 'register.validation.deptRequired'),
    site: z.string().trim().min(1, 'register.validation.siteRequired'),
    siteOther: z.string().trim().max(40, 'register.validation.siteOtherMax'),
  })
  .superRefine((data, ctx) => {
    if (data.site !== SITE_OTHER_VALUE) return
    if (!data.siteOther) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['siteOther'],
        message: 'register.validation.siteOtherRequired',
      })
      return
    }
    if (INVALID_SITE_OTHER_CHARS.test(data.siteOther)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['siteOther'],
        message: 'register.validation.siteOtherInvalid',
      })
    }
  })

export type RegisterFormValues = z.infer<typeof RegisterFormSchema>

export const LoginResponseSchema = z.object({
  success: z.boolean(),
  user: SessionUserSchema.optional(),
  token: z.string().optional(),
  remember_token: z.string().optional(),
  remember_days: z.number().optional(),
  message: z.string().optional(),
})

export type LoginResponse = z.infer<typeof LoginResponseSchema>

export const SessionVerifyResponseSchema = z.object({
  success: z.boolean(),
  user: SessionUserSchema,
})

export type SessionVerifyResponse = z.infer<typeof SessionVerifyResponseSchema>

export const SessionResumeResponseSchema = z.object({
  success: z.boolean(),
  user: SessionUserSchema.optional(),
  token: z.string().optional(),
  remember_days: z.number().optional(),
  message: z.string().optional(),
})

export type SessionResumeResponse = z.infer<typeof SessionResumeResponseSchema>

export const UpdatePasswordFormSchema = z
  .object({
    oldPassword: z.string().min(1, 'profile.validation.oldPasswordRequired'),
    newPassword: z.string().min(6, 'profile.validation.newPasswordMin'),
    confirmPassword: z.string().min(1, 'profile.validation.confirmPasswordRequired'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'profile.validation.passwordMismatch',
  })

export type UpdatePasswordFormValues = z.infer<typeof UpdatePasswordFormSchema>

export const SimpleMutationResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
})

export type SimpleMutationResponse = z.infer<typeof SimpleMutationResponseSchema>

export const DirectoryUserSchema = z.object({
  username: z.string(),
  fullname: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  dept: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  site: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  auth_source: z.string().nullish(),
  status: z.string().nullish(),
})

export type DirectoryUser = z.infer<typeof DirectoryUserSchema>
export const DirectoryUserListSchema = z.array(DirectoryUserSchema)
