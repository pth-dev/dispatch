import * as React from 'react'

export function useTitleTruncation(title: string) {
  const ref = React.useRef<HTMLAnchorElement | null>(null)
  const [isTruncated, setIsTruncated] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    let active = true
    const measure = () => {
      if (!active || !ref.current) return
      const next = ref.current.scrollHeight > ref.current.clientHeight + 1
      setIsTruncated((prev) => (prev === next ? prev : next))
    }

    queueMicrotask(measure)

    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure)
      observer.observe(el)
    }

    window.addEventListener('resize', measure)
    if (typeof document !== 'undefined' && 'fonts' in document) {
      void document.fonts.ready.then(measure)
    }

    return () => {
      active = false
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [title])

  return { ref, isTruncated }
}
