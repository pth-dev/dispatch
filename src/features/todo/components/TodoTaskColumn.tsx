import * as React from 'react'
import { Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/cn'

interface TodoTaskColumnProps {
  title: string
  subtitle: string
  countLabel: string
  searchValue: string
  searchPlaceholder: string
  onSearchChange: (value: string) => void
  icon: React.ReactNode
  accent?: 'neutral' | 'primary'
  canDrop: boolean
  isDragActive: boolean
  onDropTask: (taskId: number) => void
  children: React.ReactNode
}

export function TodoTaskColumn({
  title,
  subtitle,
  countLabel,
  searchValue,
  searchPlaceholder,
  onSearchChange,
  icon,
  accent = 'neutral',
  canDrop,
  isDragActive,
  onDropTask,
  children,
}: TodoTaskColumnProps) {
  const [isDragOver, setIsDragOver] = React.useState(false)

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!canDrop) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    if (!isDragOver) setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (!canDrop) return
    event.preventDefault()
    setIsDragOver(false)
    const rawId = event.dataTransfer.getData('text/plain')
    const taskId = Number(rawId)
    if (Number.isInteger(taskId) && taskId > 0) {
      onDropTask(taskId)
    }
  }

  return (
    <section
      aria-label={title}
      className={cn(
        'flex min-h-[360px] max-h-[520px] flex-col rounded-xl border bg-card',
        accent === 'primary' ? 'border-primary/30' : 'border-border',
      )}
    >
      <div className="shrink-0 space-y-3 border-b border-border p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-lg',
                accent === 'primary'
                  ? 'bg-primary-soft text-primary'
                  : 'bg-secondary text-muted-foreground',
              )}
              aria-hidden="true"
            >
              {icon}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-foreground">
                {title}
              </h2>
              <p className="truncate text-xs text-muted-foreground">
                {subtitle}
              </p>
            </div>
          </div>

          <Badge
            variant="secondary"
            className={cn(
              'shrink-0 font-semibold',
              accent === 'primary' && 'bg-primary-soft text-primary',
            )}
          >
            {countLabel}
          </Badge>
        </div>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="pl-9"
          />
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex-1 space-y-2.5 overflow-y-auto p-3 transition-colors',
          isDragOver && 'bg-primary-soft/50 ring-2 ring-inset ring-primary/40',
          !isDragOver && isDragActive && 'bg-secondary/40',
        )}
      >
        {children}
      </div>
    </section>
  )
}
