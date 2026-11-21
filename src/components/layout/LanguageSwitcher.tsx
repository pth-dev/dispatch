import { useTranslation } from 'react-i18next'
import { ChevronDown, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LANGUAGE_OPTIONS, type SupportedLocale } from '@/i18n'
import { useAppStore } from '@/app/store'

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const setLocale = useAppStore((s) => s.setLocale)

  const handleLanguageChange = (lang: SupportedLocale) => {
    void i18n.changeLanguage(lang)
    setLocale(lang)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 min-h-[44px] lg:min-h-0 lg:h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          aria-label={t('header.changeLanguage')}
        >
          <Globe className="size-3.5" />
          <span className="uppercase font-semibold text-[11px]">{i18n.language}</span>
          <ChevronDown className="size-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="text-xs">
        {LANGUAGE_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.code}
            onClick={() => handleLanguageChange(opt.code)}
            className={i18n.language === opt.code ? 'bg-primary-soft text-primary font-medium' : ''}
          >
            {t(opt.labelKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
