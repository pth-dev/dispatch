import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SHARED_QUERY_KEYS } from '@/constants/query-keys'

export const AUTO_REFRESH_INTERVAL_MS = 180_000
export const AUTO_REFRESH_DEFER_MS = 20_000

/**
 * Returns true when focus is currently inside an editable control so auto-refresh
 * defers rather than interrupting typing or form interaction.
 */
export function isUserTypingInDocument(doc: Document = document): boolean {
  const el = doc.activeElement as HTMLElement | null
  if (!el) return false
  if (el.isContentEditable) return true
  const tag = el.tagName.toUpperCase()
  if (tag === 'TEXTAREA' || tag === 'SELECT') {
    return !((el as HTMLTextAreaElement).readOnly || (el as HTMLTextAreaElement).disabled)
  }
  if (tag === 'INPUT') {
    const inp = el as HTMLInputElement
    const type = (inp.type || 'text').toLowerCase()
    const nonText = new Set(['button', 'submit', 'reset', 'checkbox', 'radio', 'file'])
    return !nonText.has(type) && !inp.readOnly && !inp.disabled
  }
  return false
}

/**
 * Legacy-parity 3-minute idle-aware auto-refresh:
 * - Only runs when authenticated and tab is visible.
 * - Defers by 20s if the user is actively typing in a form field.
 * - Quietly invalidates active task/dashboard/kpi queries without disrupting scroll or focus.
 */
export function useAutoRefresh(enabled: boolean): void {
  const queryClient = useQueryClient()

  React.useEffect(() => {
    if (!enabled) return

    let deferTimer: number | null = null

    const runRefresh = () => {
      if (document.visibilityState !== 'visible') return
      if (isUserTypingInDocument(document)) {
        if (deferTimer !== null) window.clearTimeout(deferTimer)
        deferTimer = window.setTimeout(runRefresh, AUTO_REFRESH_DEFER_MS)
        return
      }
      void queryClient.invalidateQueries({
        queryKey: SHARED_QUERY_KEYS.tasks,
        refetchType: 'active',
      })
      void queryClient.invalidateQueries({
        queryKey: SHARED_QUERY_KEYS.dashboard,
        refetchType: 'active',
      })
      void queryClient.invalidateQueries({
        queryKey: SHARED_QUERY_KEYS.kpi,
        refetchType: 'active',
      })
    }

    const intervalId = window.setInterval(runRefresh, AUTO_REFRESH_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
      if (deferTimer !== null) {
        window.clearTimeout(deferTimer)
      }
    }
  }, [enabled, queryClient])
}
