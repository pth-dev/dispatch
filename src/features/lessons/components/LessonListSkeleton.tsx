const SKELETON_ROWS = [0, 1, 2, 3]

export function LessonListSkeleton() {
  return (
    <div className="space-y-2.5 p-3" aria-busy="true">
      {SKELETON_ROWS.map((row) => (
        <div
          key={row}
          className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
        >
          <div className="size-12 shrink-0 rounded-md bg-secondary motion-safe:animate-pulse" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-secondary motion-safe:animate-pulse" />
            <div className="flex gap-1.5">
              <div className="h-4 w-14 rounded bg-secondary motion-safe:animate-pulse" />
              <div className="h-4 w-16 rounded bg-secondary motion-safe:animate-pulse" />
            </div>
            <div className="h-3 w-1/2 rounded bg-secondary motion-safe:animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
