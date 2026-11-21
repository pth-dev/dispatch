import { BookOpen, Plus, Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { RawLesson } from '@/schemas/lesson'
import type { LessonListFilter } from '../utils/lesson-domain'
import { LessonListItem } from './LessonListItem'
import { LessonListSkeleton } from './LessonListSkeleton'

type LessonListPanelProps = {
  lessons: readonly RawLesson[]
  totalCount: number
  isLoading: boolean
  selectedId: number
  isCreating: boolean
  filter: LessonListFilter
  search: string
  hasActiveFilters: boolean
  canWrite: boolean
  hitCountById: ReadonlyMap<number, number>
  openHitCountById: ReadonlyMap<number, number>
  onSelect: (id: number) => void
  onFilterChange: (filter: LessonListFilter) => void
  onSearchChange: (value: string) => void
  onResetFilters: () => void
  onCreate: () => void
}

const FILTER_OPTIONS: readonly LessonListFilter[] = ['all', 'hit', 'mine']

export function LessonListPanel({
  lessons,
  totalCount,
  isLoading,
  selectedId,
  isCreating,
  filter,
  search,
  hasActiveFilters,
  canWrite,
  hitCountById,
  openHitCountById,
  onSelect,
  onFilterChange,
  onSearchChange,
  onResetFilters,
  onCreate,
}: LessonListPanelProps) {
  const { t } = useTranslation()

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-border bg-card lg:min-h-0 lg:flex-1">
      <div className="shrink-0 space-y-2.5 border-b border-border p-3.5">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('lessons.searchPlaceholder')}
            aria-label={t('lessons.searchPlaceholder')}
            className="h-11 pr-9 pl-9 lg:h-10"
          />
          {search.length > 0 && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label={t('lessons.actions.clearSearch')}
              className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {FILTER_OPTIONS.map((option) => {
            const active = filter === option
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => onFilterChange(option)}
                className={`h-8 rounded-lg border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {t(`lessons.filters.${option}`)}
              </button>
            )
          })}
          <span className="ml-auto text-xs font-medium text-muted-foreground">
            {lessons.length} / {totalCount}
          </span>
        </div>
      </div>

      <div className="bg-secondary/20 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:scrollbar-gutter-stable">
        {isLoading ? (
          <LessonListSkeleton />
        ) : lessons.length === 0 ? (
          <div className="space-y-3 px-5 py-12 text-center">
            <BookOpen className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">
              {hasActiveFilters ? t('lessons.empty.filtered') : t('lessons.empty.all')}
            </p>
            {hasActiveFilters ? (
              <Button type="button" variant="outline" size="sm" onClick={onResetFilters}>
                {t('lessons.empty.clearFilters')}
              </Button>
            ) : (
              canWrite && (
                <Button type="button" size="sm" onClick={onCreate}>
                  <Plus className="size-4" aria-hidden="true" />
                  <span>{t('lessons.actions.createFirst')}</span>
                </Button>
              )
            )}
          </div>
        ) : (
          <div className="space-y-2.5 p-3">
            {lessons.map((lesson) => (
              <LessonListItem
                key={lesson.id}
                lesson={lesson}
                selected={!isCreating && lesson.id === selectedId}
                hitCount={hitCountById.get(lesson.id) ?? 0}
                openHitCount={openHitCountById.get(lesson.id) ?? 0}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
