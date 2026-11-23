import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { cn } from '@/utils'

const SHOW_THRESHOLD_PX = 320

type ScrollToTopButtonProps = {
  scrollContainerRef: React.RefObject<HTMLElement | null>
  elevated?: boolean
}

export function ScrollToTopButton({
  scrollContainerRef,
  elevated = false,
}: ScrollToTopButtonProps) {
  const { t } = useTranslation()
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const handleScroll = () => {
      setVisible(el.scrollTop > SHOW_THRESHOLD_PX)
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [scrollContainerRef])

  if (!visible) return null

  const handleClick = () => {
    const el = scrollContainerRef.current
    if (!el) return
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleClick}
      aria-label={t('common.scrollToTop')}
      className={cn(
        'fixed right-4 z-30 size-11 rounded-full border-border bg-card/95 text-foreground shadow-md backdrop-blur-xs hover:bg-secondary lg:hidden',
        elevated ? 'bottom-20' : 'bottom-5',
      )}
    >
      <ArrowUp className="size-5" aria-hidden="true" />
    </Button>
  )
}
