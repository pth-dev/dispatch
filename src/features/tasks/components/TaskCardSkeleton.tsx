import { Card } from '@/components/ui/card'

const INFO_ROW_INDICES = [0, 1, 2, 3] as const

export function TaskCardSkeleton() {
  return (
    <div data-testid="task-card-skeleton" className="h-full" aria-hidden="true">
      <Card className="h-full p-3.5 gap-2 animate-pulse motion-reduce:animate-none">
        {/* 1. Meta row */}
        <div className="flex h-card-row items-center justify-between gap-2">
          <div className="h-3.5 w-28 rounded bg-muted" />
          <div className="h-3.5 w-24 rounded bg-muted" />
        </div>

        {/* 2. Title (2 lines reserved) */}
        <div className="flex h-card-title flex-col justify-center gap-1.5">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-3/4 rounded bg-muted" />
        </div>

        {/* 3. Sub row */}
        <div className="flex h-card-row items-center justify-between gap-2">
          <div className="h-3.5 w-32 rounded bg-muted" />
          <div className="h-3.5 w-14 rounded bg-muted" />
        </div>

        {/* 4. Info block (4 fixed rows) */}
        <div className="border-t border-border pt-2 space-y-1.5">
          {INFO_ROW_INDICES.map((idx) => (
            <div key={idx} className="flex h-card-row items-center justify-between gap-2">
              <div className="h-3.5 w-24 rounded bg-muted" />
              <div className="h-3.5 w-28 rounded bg-muted" />
            </div>
          ))}
        </div>

        {/* 5. Progress row */}
        <div className="flex h-card-row items-center gap-2.5">
          <div className="h-1 flex-1 rounded-full bg-muted" />
          <div className="h-3.5 w-8 rounded bg-muted" />
        </div>

        {/* 6. Action row (44px mobile, 36px desktop) */}
        <div className="mt-auto pt-0.5">
          <div className="h-11 lg:h-9 w-full rounded-md bg-muted" />
        </div>
      </Card>
    </div>
  )
}
