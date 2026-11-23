import type { AccountDeptNode } from '@/schemas/account'

export function formatDeptShortLabel(node: Pick<AccountDeptNode, 'label' | 'value'>): string {
  const raw = node.label || node.value
  return raw.split(' / ')[0]?.trim() || node.value
}
