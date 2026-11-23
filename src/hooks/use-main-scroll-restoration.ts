import * as React from 'react'
import { useLocation, useNavigationType } from 'react-router'

const MAX_SAVED_POSITIONS = 100

function saveScrollPosition(positions: Map<string, number>, key: string, top: number) {
  if (positions.size >= MAX_SAVED_POSITIONS && !positions.has(key)) {
    const oldestKey = positions.keys().next().value
    if (oldestKey !== undefined) {
      positions.delete(oldestKey)
    }
  }
  positions.set(key, top)
}

/**
 * Manages scroll position for the `<main>` scroll container in `AppShell`:
 * - Scrolls to top immediately on `PUSH`/`REPLACE` when `pathname` changes.
 * - Restores saved `scrollTop` on browser `POP` (Back/Forward) navigation.
 * - Preserves current scroll position when only query params change on the same route.
 * - Scrolls to the target element inside `<main>` when a `#hash` anchor is present.
 *
 * Note: For lazy-loaded routes currently suspended on first visit, initial scroll resets to top;
 * subsequent `POP` navigations restore immediately because the route chunk is already loaded.
 */
export function useMainScrollRestoration(
  containerRef: React.RefObject<HTMLElement | null>,
  isReady = true,
) {
  const location = useLocation()
  const navigationType = useNavigationType()

  const scrollPositionsRef = React.useRef<Map<string, number>>(new Map())
  const prevPathnameRef = React.useRef<string>(location.pathname)
  const activeKeyRef = React.useRef<string>(location.key)

  // Continuously track scrollTop for the active history entry
  React.useEffect(() => {
    if (!isReady) return
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      saveScrollPosition(scrollPositionsRef.current, activeKeyRef.current, container.scrollTop)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [containerRef, isReady])

  // Update activeKeyRef and apply scroll reset/restoration synchronously before paint
  // so browser scroll-clamping on shorter routes never overwrites the previous entry's savedTop.
  React.useLayoutEffect(() => {
    activeKeyRef.current = location.key
    const pathnameChanged = prevPathnameRef.current !== location.pathname
    prevPathnameRef.current = location.pathname

    if (!isReady) return
    const container = containerRef.current
    if (!container) return

    if (navigationType === 'POP' && pathnameChanged) {
      const savedTop = scrollPositionsRef.current.get(location.key)
      if (savedTop !== undefined) {
        container.scrollTop = savedTop
        return
      }
    }

    if (location.hash.length > 1) {
      let targetId: string
      try {
        targetId = decodeURIComponent(location.hash.slice(1))
      } catch {
        targetId = location.hash.slice(1)
      }
      const anchor = document.getElementById(targetId)
      if (anchor && container.contains(anchor)) {
        anchor.scrollIntoView({ behavior: 'instant', block: 'start' })
        return
      }
    }

    if (!pathnameChanged) {
      // Carry forward the current scroll position for the new history key (e.g. query param change)
      saveScrollPosition(scrollPositionsRef.current, location.key, container.scrollTop)
      return
    }

    if (navigationType === 'POP') {
      container.scrollTop = scrollPositionsRef.current.get(location.key) ?? 0
      return
    }

    container.scrollTop = 0
    if (typeof window !== 'undefined' && window.scrollY > 0) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [containerRef, isReady, location.hash, location.key, location.pathname, navigationType])
}
