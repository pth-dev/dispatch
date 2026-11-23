import * as React from 'react'

const ALWAYS_SHOW_TOP_PX = 32
const HIDE_AFTER_TOP_PX = 64
const SCROLL_DELTA_PX = 8
const MIN_SCROLLABLE_RANGE_PX = 160

/**
 * Tracks vertical scroll direction on a scrollable container so desktop Card View
 * can collapse the FilterBar while scrolling down and immediately reveal it when
 * scrolling up (while keeping ScopeTabs pinned).
 */
export function useScrollHideFilter(enabled: boolean) {
  const [hidden, setHidden] = React.useState(false)
  const [prevEnabled, setPrevEnabled] = React.useState(enabled)
  const lastScrollTopRef = React.useRef(0)

  if (prevEnabled !== enabled) {
    setPrevEnabled(enabled)
    if (hidden) {
      setHidden(false)
    }
  }

  const handleScroll = (event: React.UIEvent<HTMLElement>) => {
    if (!enabled) return
    const el = event.currentTarget
    const currentTop = el.scrollTop
    const delta = currentTop - lastScrollTopRef.current

    if (currentTop <= ALWAYS_SHOW_TOP_PX) {
      lastScrollTopRef.current = currentTop
      setHidden(false)
      return
    }

    if (Math.abs(delta) < SCROLL_DELTA_PX) {
      return
    }

    lastScrollTopRef.current = currentTop
    if (delta > 0 && currentTop > HIDE_AFTER_TOP_PX) {
      const scrollableRange = el.scrollHeight - el.clientHeight
      if (scrollableRange > MIN_SCROLLABLE_RANGE_PX) {
        setHidden(true)
      }
    } else if (delta < 0) {
      setHidden(false)
    }
  }

  const showFilter = () => {
    lastScrollTopRef.current = 0
    setHidden(false)
  }

  return {
    filterHidden: enabled && hidden,
    handleScroll,
    showFilter,
  }
}
