import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { checkDuplicateTask } from '../api/queries'

interface UseDuplicateTaskCheckOptions {
  title: string
  dueDate: string
  excludeId?: number
}

/**
 * Debounced live duplicate check for `(title, dueDay)` against `GET /api/tasks/dup-check`.
 */
export function useDuplicateTaskCheck({
  title,
  dueDate,
  excludeId,
}: UseDuplicateTaskCheckOptions): string | null {
  const { t } = useTranslation()
  const [dupMatchKey, setDupMatchKey] = React.useState<string | null>(null)

  const trimmedTitle = title.trim()
  const dueDay = dueDate.trim().slice(0, 10)
  const currentDupKey = trimmedTitle && dueDay ? `${trimmedTitle}|${dueDay}` : ''

  React.useEffect(() => {
    if (!trimmedTitle || !dueDay) return

    const targetKey = `${trimmedTitle}|${dueDay}`
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void checkDuplicateTask({
        title: trimmedTitle,
        due: dueDay,
        exclude: excludeId,
        signal: controller.signal,
      })
        .then((res) => {
          setDupMatchKey(res.duplicate ? targetKey : null)
        })
        .catch(() => {
          // Non-blocking live check
        })
    }, 400)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [trimmedTitle, dueDay, excludeId])

  return currentDupKey && dupMatchKey === currentDupKey ? t('errors.codes.DUP_TITLE_DUE') : null
}
