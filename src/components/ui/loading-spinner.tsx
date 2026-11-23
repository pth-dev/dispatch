import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils'

export type LoadingSpinnerSize = 'sm' | 'md' | 'lg'

const SIZE_CLASS: Record<LoadingSpinnerSize, string> = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
}

export type LoadingSpinnerProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  size?: LoadingSpinnerSize
  label?: string
}

export function LoadingSpinner({
  ref,
  size = 'md',
  label,
  className,
  ...props
}: LoadingSpinnerProps) {
  const { t } = useTranslation()
  const accessibleLabel = label || t('common.loading')

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      className={cn('flex items-center justify-center', className)}
      {...props}
    >
      <Loader2
        className={cn('animate-spin motion-reduce:animate-none text-primary', SIZE_CLASS[size])}
        aria-hidden="true"
      />
      <span className="sr-only">{accessibleLabel}</span>
    </div>
  )
}
