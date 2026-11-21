import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { taskKeys } from '../api/keys'
import { checkDuplicateTask } from '../api/queries'

type UseDuplicateTaskCheckOptions = {
  title: string
  dueDate: string
  excludeId?: number
}

const DUP_CHECK_DEBOUNCE_MS = 400

/**
 * Debounced live duplicate check for `(title, dueDay)` against `GET /api/tasks/dup-check`
 * powered by TanStack Query (never `useEffect` for data fetching).
 */
export function useDuplicateTaskCheck({
  title,
  dueDate,
  excludeId,
}: UseDuplicateTaskCheckOptions): string | null {
  const { t } = useTranslation()
  const trimmedTitle = title.trim()
  const dueDay = dueDate.trim().slice(0, 10)
  const rawKey = trimmedTitle && dueDay ? `${trimmedTitle}|${dueDay}` : ''

  const [debounced, setDebounced] = React.useState<{ title: string; due: string; key: string }>({
    title: trimmedTitle,
    due: dueDay,
    key: rawKey,
  })

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced({ title: trimmedTitle, due: dueDay, key: rawKey })
    }, DUP_CHECK_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [trimmedTitle, dueDay, rawKey])

  const enabled = Boolean(debounced.title && debounced.due && debounced.key === rawKey)

  const { data } = useQuery({
    queryKey: taskKeys.dupCheck(debounced.title, debounced.due, excludeId),
    queryFn: ({ signal }) =>
      checkDuplicateTask({
        title: debounced.title,
        due: debounced.due,
        exclude: excludeId,
        signal,
      }),
    enabled,
    staleTime: 15_000,
    retry: false,
  })

  return enabled && data?.duplicate ? t('errors.codes.DUP_TITLE_DUE') : null
}
