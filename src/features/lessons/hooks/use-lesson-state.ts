import { useSearchParams } from 'react-router'
import type { LessonListFilter } from '../utils/lesson-domain'

export type LessonPanelMode = 'empty' | 'view' | 'create' | 'edit'

function parseFilter(raw: string | null): LessonListFilter {
  if (raw === 'hit' || raw === 'mine') return raw
  return 'all'
}

function parseSelectedId(raw: string | null): number {
  const parsed = Number(raw)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0
}

export function useLessonState() {
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedId = parseSelectedId(searchParams.get('id'))
  const rawMode = searchParams.get('mode')
  const isLegacyNew = searchParams.get('new') === '1'
  const filter = parseFilter(searchParams.get('filter'))
  const search = searchParams.get('q') ?? ''

  let panelMode: LessonPanelMode = 'empty'
  if (rawMode === 'create' || isLegacyNew) {
    panelMode = 'create'
  } else if (rawMode === 'edit' && selectedId > 0) {
    panelMode = 'edit'
  } else if (selectedId > 0) {
    panelMode = 'view'
  }

  const updateParams = (mutator: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams)
    mutator(next)
    setSearchParams(next, { replace: true })
  }

  const selectLesson = (id: number) => {
    updateParams((next) => {
      next.set('id', String(id))
      next.delete('mode')
      next.delete('new')
    })
  }

  const openCreate = () => {
    updateParams((next) => {
      next.set('mode', 'create')
      next.delete('new')
    })
  }

  const openEdit = (id: number) => {
    updateParams((next) => {
      next.set('id', String(id))
      next.set('mode', 'edit')
      next.delete('new')
    })
  }

  const closeEditor = (fallbackId?: number) => {
    updateParams((next) => {
      next.delete('mode')
      next.delete('new')
      const targetId = fallbackId ?? selectedId
      if (targetId > 0) {
        next.set('id', String(targetId))
      } else {
        next.delete('id')
      }
    })
  }

  const clearSelection = () => {
    updateParams((next) => {
      next.delete('id')
      next.delete('mode')
      next.delete('new')
    })
  }

  const setFilter = (nextFilter: LessonListFilter) => {
    updateParams((next) => {
      if (nextFilter === 'all') next.delete('filter')
      else next.set('filter', nextFilter)
    })
  }

  const setSearch = (nextSearch: string) => {
    updateParams((next) => {
      if (nextSearch.trim().length === 0) next.delete('q')
      else next.set('q', nextSearch)
    })
  }

  const resetFilters = () => {
    updateParams((next) => {
      next.delete('filter')
      next.delete('q')
    })
  }

  const hasActiveFilters = filter !== 'all' || search.trim().length > 0

  return {
    selectedId,
    panelMode,
    filter,
    search,
    hasActiveFilters,
    selectLesson,
    openCreate,
    openEdit,
    closeEditor,
    clearSelection,
    setFilter,
    setSearch,
    resetFilters,
  }
}
