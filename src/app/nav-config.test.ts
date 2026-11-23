import { describe, expect, it } from 'vitest'
import en from '@/locales/en/translation.json'
import vi from '@/locales/vi/translation.json'
import zhCN from '@/locales/zh-CN/translation.json'
import zhTW from '@/locales/zh-TW/translation.json'
import {
  ADMIN_NAV_ITEMS,
  MAIN_NAV_ITEMS,
  getDefaultLandingRoute,
  type NavItemConfig,
} from './nav-config'
import { APP_ROUTES } from '@/constants/app-routes'

const LOCALES = {
  vi,
  en,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
} as const

function hasKey(source: unknown, key: string): boolean {
  let current: unknown = source
  for (const part of key.split('.')) {
    if (typeof current !== 'object' || current === null) return false
    current = (current as Record<string, unknown>)[part]
  }
  return current !== undefined
}

function collectTitleKeys(items: NavItemConfig[]): string[] {
  return items.flatMap((item) => [item.titleKey, ...(item.children ?? []).map((c) => c.titleKey)])
}

const NAV_ITEMS = [...MAIN_NAV_ITEMS, ...ADMIN_NAV_ITEMS]
const TITLE_KEYS = collectTitleKeys(NAV_ITEMS)

describe('nav config i18n', () => {
  it('declares at least one item', () => {
    expect(TITLE_KEYS.length).toBeGreaterThan(0)
  })

  for (const [locale, translations] of Object.entries(LOCALES)) {
    it(`resolves every nav labelKey in ${locale}`, () => {
      const missing = TITLE_KEYS.filter((key) => !hasKey(translations, key))

      expect(missing).toEqual([])
    })
  }
})

describe('getDefaultLandingRoute', () => {
  it('returns first readable route when user lacks list permission', () => {
    const route = getDefaultLandingRoute({
      username: 'staff1',
      role: 'user',
      menu_perms: { list: '', todo: 'sr', messages: '', learnknow: '' },
    })
    expect(route).toBe(APP_ROUTES.TODO)
  })

  it('falls back to profile when user has no readable menu items', () => {
    const route = getDefaultLandingRoute({
      username: 'staff2',
      role: 'user',
      menu_perms: { list: 's', todo: '', messages: '', learnknow: '' },
    })
    expect(route).toBe(APP_ROUTES.PROFILE)
  })
})
