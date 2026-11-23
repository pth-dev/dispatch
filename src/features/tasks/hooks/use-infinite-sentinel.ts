import * as React from 'react'

type UseInfiniteSentinelOptions = {
  enabled: boolean
  onLoadMore: () => void
  reobserveKey?: number
  rootMargin?: string
}

export function useInfiniteSentinel({
  enabled,
  onLoadMore,
  reobserveKey,
  rootMargin = '240px',
}: UseInfiniteSentinelOptions) {
  const sentinelRef = React.useRef<HTMLDivElement | null>(null)
  const onLoadMoreRef = React.useRef(onLoadMore)

  React.useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  }, [onLoadMore])

  React.useEffect(() => {
    if (!enabled) return
    const target = sentinelRef.current
    if (!target || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMoreRef.current()
        }
      },
      { rootMargin },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [enabled, reobserveKey, rootMargin])

  return sentinelRef
}
