import * as React from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/utils/cn'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from './sheet'

export type ResponsiveModalSize = 'md' | 'lg' | 'xl' | 'full'

const DESKTOP_SIZE_CLASS: Record<ResponsiveModalSize, string> = {
  md: 'sm:max-w-xl',
  lg: 'sm:max-w-3xl',
  xl: 'sm:max-w-5xl',
  full: 'sm:max-w-[94vw]',
}

export interface ResponsiveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
  size?: ResponsiveModalSize
  children: React.ReactNode
  className?: string
}

/**
 * Renders a centered Dialog on desktop (>= lg) and a bottom Sheet on mobile (< lg)
 * with sticky header/footer and an independently scrollable body.
 */
export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  footer,
  size = 'lg',
  children,
  className,
}: ResponsiveModalProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          aria-describedby={description ? undefined : undefined}
          className={cn(
            'flex max-h-[92dvh] flex-col gap-0 rounded-t-2xl border-t border-border bg-card p-0',
            className,
          )}
        >
          <SheetHeader className="shrink-0 border-b border-border px-4 py-3.5 pr-12 text-left">
            <SheetTitle className="text-base font-semibold text-foreground">{title}</SheetTitle>
            {description && (
              <SheetDescription className="text-xs text-muted-foreground">
                {description}
              </SheetDescription>
            )}
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>

          {footer && (
            <SheetFooter className="shrink-0 border-t border-border bg-card px-4 py-3">
              {footer}
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={description ? undefined : undefined}
        className={cn(
          'flex max-h-[88dvh] flex-col gap-0 overflow-hidden bg-card p-0',
          DESKTOP_SIZE_CLASS[size],
          className,
        )}
      >
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12 text-left">
          <DialogTitle className="text-lg font-semibold text-foreground">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-xs text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>

        {footer && (
          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-3.5">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
