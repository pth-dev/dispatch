import { useSearchParams } from 'react-router'
import type { MessageScope } from '../utils/message-format'

function parseScope(raw: string | null): MessageScope {
  return raw === 'mine' ? 'mine' : 'all'
}

export function useMessageFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const scope = parseScope(searchParams.get('scope'))
  const search = searchParams.get('q') ?? ''

  const setScope = (nextScope: MessageScope) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (nextScope === 'all') next.delete('scope')
        else next.set('scope', nextScope)
        return next
      },
      { replace: true },
    )
  }

  const setSearch = (nextSearch: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (nextSearch.trim().length === 0) next.delete('q')
        else next.set('q', nextSearch)
        return next
      },
      { replace: true },
    )
  }

  const resetFilters = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('scope')
        next.delete('q')
        return next
      },
      { replace: true },
    )
  }

  const hasActiveFilters = scope !== 'all' || search.trim().length > 0

  return {
    scope,
    search,
    hasActiveFilters,
    setScope,
    setSearch,
    resetFilters,
  }
}
