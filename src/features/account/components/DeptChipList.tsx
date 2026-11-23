import { Building2, Globe } from 'lucide-react'
import type { AccountDeptNode } from '@/schemas/account'
import { cn } from '@/utils/cn'
import { formatDeptShortLabel } from '../utils/account-format'

export type DeptChipTone = 'default' | 'primary' | 'success'

const TONE_CLASS: Record<DeptChipTone, string> = {
  default: 'border-border bg-secondary/70 text-foreground',
  primary: 'border-primary bg-primary text-primary-foreground',
  success: 'border-success/30 bg-success/10 text-success',
}

interface DeptChipListProps {
  items: readonly AccountDeptNode[]
  emptyText: string
  getTone?: (item: AccountDeptNode) => DeptChipTone
}

export function DeptChipList({ items, emptyText, getTone }: DeptChipListProps) {
  if (items.length === 0) {
    return <span className="text-xs text-muted-foreground">{emptyText}</span>
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => {
        const tone = getTone ? getTone(item) : 'default'
        const isAd = item.source === 'ad_ou'
        return (
          <span
            key={`${item.source}-${item.value}-${item.ou_dn || item.path}`}
            title={item.path || item.ou_dn || item.label || item.value}
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
              TONE_CLASS[tone],
            )}
          >
            {isAd ? (
              <Globe className="size-3 shrink-0" aria-hidden="true" />
            ) : (
              <Building2 className="size-3 shrink-0" aria-hidden="true" />
            )}
            <span className="truncate max-w-44">{formatDeptShortLabel(item)}</span>
          </span>
        )
      })}
    </div>
  )
}
