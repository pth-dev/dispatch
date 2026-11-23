import * as React from 'react'
import { Eye, GitBranch, IdCard } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AccountScopeResponse } from '@/schemas/account'
import { sameDept } from '@/utils/task-domain'
import { DeptChipList } from './DeptChipList'

interface AccountScopeCardsProps {
  scope: AccountScopeResponse
}

function ScopeRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-2 text-xs last:border-b-0 sm:flex-row sm:items-start sm:gap-3">
      <span className="shrink-0 font-medium text-muted-foreground sm:w-28">{label}</span>
      <div className="min-w-0 flex-1 font-medium text-foreground break-words">{children}</div>
    </div>
  )
}

export function AccountScopeCards({ scope }: AccountScopeCardsProps) {
  const { t } = useTranslation()
  const { user } = scope

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <section className="rounded-xl border border-border bg-card p-4 space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <IdCard className="size-4 text-primary" aria-hidden="true" />
          <span>{t('account.cards.myAccount')}</span>
        </h2>
        <div>
          <ScopeRow label={t('profile.username')}>{user.username}</ScopeRow>
          <ScopeRow label={t('profile.fullname')}>{user.fullname || '—'}</ScopeRow>
          <ScopeRow label={t('profile.role')}>{t(`role.${user.role}`)}</ScopeRow>
          <ScopeRow label={t('profile.authSource')}>
            {user.auth_source === 'ad' ? t('account.authSourceAd') : t('profile.authLocal')}
          </ScopeRow>
          <ScopeRow label={t('profile.department')}>
            <span>{user.dept_label || user.dept || '—'}</span>
            <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
              ({user.dept_source === 'ad_ou' ? t('account.deptSourceAd') : t('account.deptSourceLocal')})
            </span>
          </ScopeRow>
          <ScopeRow label={t('account.fields.extraDepts')}>
            <DeptChipList
              items={scope.extra_depts}
              emptyText={t('account.emptyAdminAssigned')}
              getTone={() => 'success'}
            />
          </ScopeRow>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <GitBranch className="size-4 text-primary" aria-hidden="true" />
          <span>{t('account.cards.myOu')}</span>
        </h2>
        <div>
          <ScopeRow label={t('account.fields.ownOu')}>{user.own_ou_path || '—'}</ScopeRow>
          <ScopeRow label={t('account.fields.adDn')}>
            <span className="font-normal text-muted-foreground">{user.ad_dn || '—'}</span>
          </ScopeRow>
          <ScopeRow label={t('account.fields.namingRule')}>
            {user.rule_dept ? (
              <div className="space-y-0.5">
                <p>
                  {t('account.ouRuleValue', { level: scope.rule_level, dept: user.rule_dept })}
                </p>
                {user.rule_path && (
                  <p className="text-[11px] font-normal text-muted-foreground">{user.rule_path}</p>
                )}
              </div>
            ) : (
              '—'
            )}
          </ScopeRow>
          <ScopeRow label={t('account.fields.subOus')}>
            <DeptChipList items={scope.sub_depts} emptyText="—" />
          </ScopeRow>
          <ScopeRow label={t('account.fields.viewDepts')}>
            <DeptChipList
              items={scope.view_depts}
              emptyText={t('account.emptyAdminAssigned')}
              getTone={() => 'success'}
            />
          </ScopeRow>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Eye className="size-4 text-success" aria-hidden="true" />
          <span>{t('account.cards.visibleScope')}</span>
        </h2>

        {scope.superlike ? (
          <p className="text-sm font-medium text-primary">
            {scope.note || t('account.superlikeScopeNote')}
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('account.visibleScopeDesc')}
            </p>
            <DeptChipList
              items={scope.visible}
              emptyText="—"
              getTone={(item) => (sameDept(item.value, user.dept) ? 'primary' : 'default')}
            />
            <p className="text-[11px] text-muted-foreground">{t('account.confidentialRuleNote')}</p>
          </div>
        )}
      </section>
    </div>
  )
}
