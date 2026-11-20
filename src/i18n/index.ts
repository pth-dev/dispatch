import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import viTranslation from '@/locales/vi/translation.json'
import enTranslation from '@/locales/en/translation.json'
import zhCNTranslation from '@/locales/zh-CN/translation.json'
import zhTWTranslation from '@/locales/zh-TW/translation.json'

export const SUPPORTED_LOCALES = ['vi', 'en', 'zh-CN', 'zh-TW'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const LOCALE_STORAGE_KEY = 'dieu_phoi_locale'

export function getInitialLocale(): SupportedLocale {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (saved && SUPPORTED_LOCALES.includes(saved as SupportedLocale)) {
      return saved as SupportedLocale
    }
  }
  return 'vi'
}

export function saveLocale(locale: SupportedLocale): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  }
}

const resources = {
  vi: { translation: viTranslation },
  en: { translation: enTranslation },
  'zh-CN': { translation: zhCNTranslation },
  'zh-TW': { translation: zhTWTranslation },
}

const initialLocale = getInitialLocale()

i18n.use(initReactI18next).init({
  resources,
  lng: initialLocale,
  fallbackLng: 'vi',
  interpolation: {
    escapeValue: false,
  },
})

// Auto persist when language changes
i18n.on('languageChanged', (lng) => {
  if (SUPPORTED_LOCALES.includes(lng as SupportedLocale)) {
    saveLocale(lng as SupportedLocale)
  }
})

export default i18n
