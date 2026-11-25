import * as React from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'

export type ToastTone = 'success' | 'error' | 'info'

export type ToastItem = {
  id: number
  tone: ToastTone
  message: string
}

type ToastListener = () => void

const TOAST_DURATION_MS = 4000
const MAX_VISIBLE_TOASTS = 5
let nextToastId = 1
let toastItems: ToastItem[] = []
const listeners = new Set<ToastListener>()
const timers = new Map<number, number>()

function emit() {
  for (const listener of listeners) {
    listener()
  }
}

function clearToastTimer(id: number): void {
  const timer = timers.get(id)
  if (timer !== undefined) {
    window.clearTimeout(timer)
    timers.delete(id)
  }
}

export function dismissToast(id: number): void {
  clearToastTimer(id)
  const next = toastItems.filter((item) => item.id !== id)
  if (next.length === toastItems.length) return
  toastItems = next
  emit()
}

function pushToast(tone: ToastTone, message: string): number {
  const id = nextToastId++
  const overflowCount = Math.max(0, toastItems.length + 1 - MAX_VISIBLE_TOASTS)
  if (overflowCount > 0) {
    for (const evicted of toastItems.slice(0, overflowCount)) {
      clearToastTimer(evicted.id)
    }
  }
  toastItems = [...toastItems.slice(overflowCount), { id, tone, message }]
  emit()
  if (typeof window !== 'undefined') {
    timers.set(
      id,
      window.setTimeout(() => dismissToast(id), TOAST_DURATION_MS),
    )
  }
  return id
}

export const toast = {
  success: (message: string) => pushToast('success', message),
  error: (message: string) => pushToast('error', message),
  info: (message: string) => pushToast('info', message),
  dismiss: dismissToast,
}

function subscribe(listener: ToastListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return toastItems
}

const TONE_ICON_CLASS: Record<ToastTone, string> = {
  success: 'text-success',
  error: 'text-destructive',
  info: 'text-primary',
}

function ToastIcon({ tone }: { tone: ToastTone }) {
  const cls = cn('size-4 shrink-0', TONE_ICON_CLASS[tone])
  if (tone === 'success') return <CheckCircle2 className={cls} aria-hidden="true" />
  if (tone === 'error') return <AlertCircle className={cls} aria-hidden="true" />
  return <Info className={cls} aria-hidden="true" />
}

function ToastCard({ item, closeLabel }: { item: ToastItem; closeLabel: string }) {
  return (
    <div
      role={item.tone === 'error' ? 'alert' : 'status'}
      className="pointer-events-auto flex items-start gap-2.5 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground"
    >
      <ToastIcon tone={item.tone} />
      <span className="min-w-0 flex-1 break-words text-xs font-medium leading-5">
        {item.message}
      </span>
      <button
        type="button"
        aria-label={closeLabel}
        onClick={() => dismissToast(item.id)}
        className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}

/**
 * Global floating toast viewport (flat shadcn/ui card style, semantic tokens only).
 */
export function Toaster() {
  const { t } = useTranslation()
  const items = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const closeLabel = t('common.close')

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2 sm:left-auto sm:right-4 sm:w-full sm:max-w-sm print:hidden"
    >
      {items.map((item) => (
        <ToastCard key={item.id} item={item} closeLabel={closeLabel} />
      ))}
    </div>
  )
}
