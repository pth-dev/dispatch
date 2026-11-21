import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { MessageScope } from '../utils/message-format'

type MessageToolbarProps = {
  scope: MessageScope
  search: string
  allCount: number
  mineCount: number
  onScopeChange: (scope: MessageScope) => void
  onSearchChange: (search: string) => void
}

export function MessageToolbar({
  scope,
  search,
  allCount,
  mineCount,
  onScopeChange,
  onSearchChange,
}: MessageToolbarProps) {
  const { t } = useTranslation()

  const tabs: { value: MessageScope; label: string; count: number }[] = [
    { value: 'all', label: t('messages.scope.all'), count: allCount },
    { value: 'mine', label: t('messages.scope.mine'), count: mineCount },
  ]

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Tabs
        value={scope}
        onValueChange={(value) => onScopeChange(value === 'mine' ? 'mine' : 'all')}
      >
        <TabsList
          aria-label={t('messages.scope.ariaLabel')}
          className="h-auto rounded-full border border-border bg-card p-1 gap-1"
        >
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="h-11 lg:h-8 rounded-full px-3.5 text-sm font-medium text-foreground cursor-pointer border-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <span>{tab.label}</span>
              <span className="text-xs opacity-80">{tab.count}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="relative w-full sm:max-w-xs">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('messages.search.placeholder')}
          aria-label={t('messages.search.placeholder')}
          className="bg-card pl-9 pr-11 lg:pr-9"
        />
        {search.length > 0 && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label={t('messages.search.clear')}
            className="absolute right-0 lg:right-1.5 top-1/2 -translate-y-1/2 inline-flex size-11 lg:size-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
