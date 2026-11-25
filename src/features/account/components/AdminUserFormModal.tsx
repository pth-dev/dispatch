import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { getDeptDisplayName, getSiteDisplayName, useMetaDepts, useMetaSites } from '@/hooks/use-meta'
import {
  ACCOUNT_STATUSES,
  CreateAdminUserFormSchema,
  EditAdminUserFormSchema,
  type AdminUser,
  type AdminUserFormValues,
} from '@/schemas/account'
import { resolveApiErrorMessage } from '@/services'
import {
  useCreateAdminUser,
  useResetAdminUserPassword,
  useUpdateAdminUser,
} from '../api/admin-users'
import { getAssignableRoles } from '../utils/admin-permissions'

export type AdminNotice = {
  tone: 'success' | 'error' | 'warning'
  text: string
}

type AdminUserFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingUser: AdminUser | null
  onNotify: (notice: AdminNotice) => void
}

const LABEL_CLS = 'block text-xs font-semibold text-foreground'
const SELECT_CLS =
  'h-11 lg:h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30'

export function AdminUserFormModal({
  open,
  onOpenChange,
  editingUser,
  onNotify,
}: AdminUserFormModalProps) {
  const { t, i18n } = useTranslation()
  const actor = useAppStore((s) => s.user)
  const deptsQuery = useMetaDepts()
  const sitesQuery = useMetaSites()
  const createMutation = useCreateAdminUser()
  const updateMutation = useUpdateAdminUser()
  const resetPwdMutation = useResetAdminUserPassword()

  const isEdit = Boolean(editingUser)
  const assignableRoles = getAssignableRoles(actor)

  const form = useForm<AdminUserFormValues>({
    resolver: zodResolver(isEdit ? EditAdminUserFormSchema : CreateAdminUserFormSchema),
    defaultValues: {
      username: editingUser?.username ?? '',
      fullname: editingUser?.fullname ?? '',
      password: '',
      dept: editingUser?.dept || actor?.dept || '',
      site: editingUser?.site || actor?.site || '',
      role: editingUser?.role ?? 'user',
      status: editingUser?.status ?? 'Approved',
    },
  })

  const isBusy =
    createMutation.isPending || updateMutation.isPending || resetPwdMutation.isPending

  const onSubmit = async (values: AdminUserFormValues) => {
    try {
      if (editingUser) {
        await updateMutation.mutateAsync({
          id: editingUser.id,
          data: {
            username: values.username,
            fullname: values.fullname,
            dept: values.dept,
            site: values.site,
            role: values.role,
            status: values.status,
          },
        })
        if (values.password.trim()) {
          await resetPwdMutation.mutateAsync({
            id: editingUser.id,
            newPassword: values.password.trim(),
          })
        }
        onNotify({ tone: 'success', text: t('account.admin.toast.userUpdated') })
      } else {
        await createMutation.mutateAsync({
          username: values.username,
          password: values.password,
          fullname: values.fullname,
          dept: values.dept,
          site: values.site,
          role: values.role,
          status: values.status,
        })
        onNotify({ tone: 'success', text: t('account.admin.toast.userCreated') })
      }
      onOpenChange(false)
    } catch (error) {
      onNotify({ tone: 'error', text: resolveApiErrorMessage(error, t, i18n.language) })
    }
  }

  const depts = deptsQuery.data?.depts ?? []
  const sites = sitesQuery.data?.sites ?? []
  const { errors } = form.formState

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title={isEdit ? t('account.admin.form.editTitle') : t('account.admin.form.createTitle')}
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="admin-user-form" disabled={isBusy}>
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <form
        id="admin-user-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
        noValidate
      >
        <div className="space-y-1.5">
          <label htmlFor="admin-u-username" className={LABEL_CLS}>
            {t('account.admin.fields.username')}
          </label>
          <Input
            id="admin-u-username"
            disabled={isEdit && editingUser?.auth_source === 'ad'}
            aria-invalid={Boolean(errors.username)}
            {...form.register('username')}
          />
          {errors.username?.message && (
            <p className="text-xs text-destructive">{t(errors.username.message)}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="admin-u-fullname" className={LABEL_CLS}>
            {t('account.admin.fields.fullname')}
          </label>
          <Input
            id="admin-u-fullname"
            aria-invalid={Boolean(errors.fullname)}
            {...form.register('fullname')}
          />
          {errors.fullname?.message && (
            <p className="text-xs text-destructive">{t(errors.fullname.message)}</p>
          )}
        </div>

        {editingUser?.auth_source !== 'ad' && (
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="admin-u-password" className={LABEL_CLS}>
              {isEdit
                ? t('account.admin.fields.newPasswordOptional')
                : t('account.admin.fields.password')}
            </label>
            <Input
              id="admin-u-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              {...form.register('password')}
            />
            {errors.password?.message && (
              <p className="text-xs text-destructive">{t(errors.password.message)}</p>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="admin-u-dept" className={LABEL_CLS}>
            {t('common.department')}
          </label>
          <select
            id="admin-u-dept"
            aria-invalid={Boolean(errors.dept)}
            className={SELECT_CLS}
            {...form.register('dept')}
          >
            <option value="">—</option>
            {depts.map((dept) => (
              <option key={dept.value} value={dept.value}>
                {getDeptDisplayName(dept, i18n.language)}
              </option>
            ))}
          </select>
          {errors.dept?.message && (
            <p className="text-xs text-destructive">{t(errors.dept.message)}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="admin-u-site" className={LABEL_CLS}>
            {t('account.admin.fields.site')}
          </label>
          <select
            id="admin-u-site"
            aria-invalid={Boolean(errors.site)}
            className={SELECT_CLS}
            {...form.register('site')}
          >
            <option value="">—</option>
            {sites.map((site) => (
              <option key={site.value} value={site.value}>
                {getSiteDisplayName(site, i18n.language)}
              </option>
            ))}
          </select>
          {errors.site?.message && (
            <p className="text-xs text-destructive">{t(errors.site.message)}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="admin-u-role" className={LABEL_CLS}>
            {t('account.admin.fields.role')}
          </label>
          <select id="admin-u-role" className={SELECT_CLS} {...form.register('role')}>
            {assignableRoles.map((role) => (
              <option key={role} value={role}>
                {t(`role.${role}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="admin-u-status" className={LABEL_CLS}>
            {t('common.status')}
          </label>
          <select id="admin-u-status" className={SELECT_CLS} {...form.register('status')}>
            {ACCOUNT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`account.admin.statuses.${status}`)}
              </option>
            ))}
          </select>
        </div>
      </form>
    </ResponsiveModal>
  )
}
