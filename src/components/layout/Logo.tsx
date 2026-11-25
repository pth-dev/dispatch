import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'

type LogoProps = {
  size?: number
  className?: string
  showText?: boolean
}

export function Logo({ size = 36, className, showText = true }: LogoProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('flex items-center gap-3 select-none', className)}>
      <img
        src="/logo.png"
        alt={showText ? '' : t('app.logoAlt')}
        aria-hidden={showText ? true : undefined}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-contain"
        decoding="async"
      />

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
