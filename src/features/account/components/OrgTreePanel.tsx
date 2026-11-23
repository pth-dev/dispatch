import * as React from 'react'
import { Network, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type { AccountDeptNode, AccountOrgResponse, AccountScopeResponse } from '@/schemas/account'
import { cn } from '@/utils/cn'
import { normalizeDeptKey, sameDept } from '@/utils/task-domain'
import { formatDeptShortLabel } from '../utils/account-format'

interface OrgTreePanelProps {
  org: AccountOrgResponse
  scope: AccountScopeResponse
}

function OrgTreeRow({
  node,
  isMine,
  isVisible,
  statusLabel,
  membersLabel,
  localSourceLabel,
}: {
  node: AccountDeptNode
  isMine: boolean
  isVisible: boolean
  statusLabel?: string
  membersLabel: string
  localSourceLabel: string
}) {
  const depth = node.path ? Math.min(6, Math.max(0, node.path.split('›').length - 1)) : 0

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 text-xs',
        isMine ? 'bg-primary-soft/60' : isVisible ? 'bg-success/5' : '',
      )}
    >
      {depth > 0 && (
        <span aria-hidden="true" className="shrink-0" style={{ width: `${depth * 14}px` }} />
      )}
      <span
        aria-hidden="true"
        className={cn(
          'size-2 shrink-0 rounded-full',
          isMine ? 'bg-primary' : isVisible ? 'bg-success' : 'bg-muted-foreground/30',
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate font-medium text-foreground">{formatDeptShortLabel(node)}</p>
          {statusLabel && (
            <Badge
              variant="outline"
              className={cn(
                'h-5 px-1.5 text-[10px] font-medium',
                isMine
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-success/30 bg-success/10 text-success',
              )}
            >
              {statusLabel}
            </Badge>
          )}
        </div>
        <p className="truncate text-[11px] text-muted-foreground">
          {node.path || (node.source === 'ad_ou' ? node.ou_dn : localSourceLabel)}
        </p>
      </div>
      <span className="shrink-0 font-medium text-muted-foreground tabular-nums">
        {membersLabel}
      </span>
    </div>
  )
}

export function OrgTreePanel({ org, scope }: OrgTreePanelProps) {
  const { t } = useTranslation()
  const [searchInput, setSearchInput] = React.useState('')
  const deferredQuery = React.useDeferredValue(searchInput.trim().toLowerCase())

  const visibleKeys = new Set(scope.visible.map((item) => normalizeDeptKey(item.value)))
  const filteredItems = org.items.filter((item) => {
    if (!deferredQuery) return true
    const haystack = `${item.label} ${item.path} ${item.value} ${item.ou_dn}`.toLowerCase()
    return haystack.includes(deferredQuery)
  })

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Network className="size-4 text-primary" aria-hidden="true" />
            <span>{t('account.orgTree.title')}</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            {t('account.orgTree.ruleHint', { level: org.rule_level })}
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('account.orgTree.searchPlaceholder')}
            aria-label={t('account.orgTree.searchPlaceholder')}
            className="pl-9"
          />
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto divide-y divide-border rounded-lg border border-border">
        {filteredItems.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">
            {t('account.orgTree.empty')}
          </p>
        ) : (
          filteredItems.map((node) => {
            const isMine = sameDept(node.value, scope.user.dept)
            const isVisible = scope.superlike || visibleKeys.has(normalizeDeptKey(node.value))
            const statusLabel = isMine
              ? t('account.orgTree.legendMine')
              : isVisible
                ? t('account.orgTree.legendVisible')
                : undefined
            return (
              <OrgTreeRow
                key={`${node.source}-${node.value}-${node.ou_dn || node.path}`}
                node={node}
                isMine={isMine}
                isVisible={isVisible}
                statusLabel={statusLabel}
                membersLabel={t('account.orgTree.membersCount', { count: node.members })}
                localSourceLabel={t('account.deptSourceLocal')}
              />
            )
          })
        )}
      </div>
    </section>
  )
}
