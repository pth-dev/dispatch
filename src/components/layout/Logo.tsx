import { useTranslation } from 'react-i18next'
import { House } from 'lucide-react'
import { cn } from '@/utils/cn'

interface LogoProps {
  size?: number
  className?: string
  showText?: boolean
}

export function Logo({ size = 36, className, showText = true }: LogoProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('flex items-center gap-3 select-none', className)}>
      <div
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground"
        aria-hidden="true"
      >
        <House className="size-5 stroke-[2.2]" />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="text-base font-semibold text-foreground tracking-tight leading-tight">
            {t('app.name')}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground leading-tight">
            {t('app.version')}
          </span>
        </div>
      )}
    </div>
  )
}
