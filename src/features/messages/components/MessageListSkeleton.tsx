export function MessageListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-border bg-card p-4 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="size-9 motion-safe:animate-pulse rounded-full bg-secondary" />
              <div className="space-y-1.5">
                <div className="h-4 w-36 motion-safe:animate-pulse rounded bg-secondary" />
                <div className="h-3 w-24 motion-safe:animate-pulse rounded bg-secondary" />
              </div>
            </div>
            <div className="h-5 w-24 motion-safe:animate-pulse rounded-md bg-secondary" />
          </div>
          <div className="space-y-1.5">
            <div className="h-4 w-full motion-safe:animate-pulse rounded bg-secondary" />
            <div className="h-4 w-3/4 motion-safe:animate-pulse rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  )
}
