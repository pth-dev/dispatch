import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import en from '@/locales/en/translation.json'
import vi from '@/locales/vi/translation.json'
import zhCN from '@/locales/zh-CN/translation.json'
import { ADMIN_NAV_ITEMS, MAIN_NAV_ITEMS, type NavItemConfig } from '@/app/nav-config'

type Translations = Record<string, unknown>

const LOCALES: Record<string, Translations> = {
  vi: vi as Translations,
  en: en as Translations,
  'zh-CN': zhCN as Translations,
}

function flattenKeys(source: unknown, prefix = ''): string[] {
  if (typeof source !== 'object' || source === null) return [prefix]

  return Object.entries(source as Record<string, unknown>).flatMap(([key, value]) =>
    flattenKeys(value, prefix ? `${prefix}.${key}` : key),
  )
}

function hasKey(source: unknown, key: string): boolean {
  let current: unknown = source
  for (const part of key.split('.')) {
    if (typeof current !== 'object' || current === null) return false
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' && current.trim().length > 0
}

function collectNavKeys(items: NavItemConfig[]): string[] {
  return items.flatMap((item) => [item.titleKey, ...(item.children ?? []).map((c) => c.titleKey)])
}

const NAV_KEYS = collectNavKeys([...MAIN_NAV_ITEMS, ...ADMIN_NAV_ITEMS])

// Every source module is read as raw text so literal t('...') calls can be
// checked against the bundled translation resources.
const SRC_ROOT = join(process.cwd(), 'src')

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry)
    if (statSync(fullPath).isDirectory()) return listSourceFiles(fullPath)
    if (!/\.(ts|tsx)$/.test(entry) || entry.includes('.test.')) return []
    return [fullPath]
  })
}

const LITERAL_CALL_PATTERNS = [
  /\bt\(\s*'([^'\\]+)'/g,
  /\bt\(\s*"([^"\\]+)"/g,
  /\bt\(\s*`([^`$]+)`/g,
]

function collectLiteralKeys(): string[] {
  const keys = new Set<string>()

  for (const path of listSourceFiles(SRC_ROOT)) {
    const source = readFileSync(path, 'utf8')

    for (const pattern of LITERAL_CALL_PATTERNS) {
      pattern.lastIndex = 0
      for (const match of source.matchAll(pattern)) {
        if (match[1]) keys.add(match[1])
      }
    }
  }

  return [...keys].sort()
}

const LITERAL_KEYS = collectLiteralKeys()

describe('locale resource parity', () => {
  it('defines the same key tree in every locale', () => {
    const reference = flattenKeys(LOCALES.vi).sort()

    for (const [locale, translations] of Object.entries(LOCALES)) {
      expect(flattenKeys(translations).sort(), `keys in ${locale}`).toEqual(reference)
    }
  })

  it('has a non-empty value for every key in every locale', () => {
    for (const [locale, translations] of Object.entries(LOCALES)) {
      const empty = flattenKeys(translations).filter((key) => !hasKey(translations, key))
      expect(empty, `empty values in ${locale}`).toEqual([])
    }
  })
})

describe('translation key coverage', () => {
  it('collects literal t() keys from the source tree', () => {
    expect(LITERAL_KEYS.length).toBeGreaterThan(50)
  })

  for (const [locale, translations] of Object.entries(LOCALES)) {
    it(`resolves every nav config labelKey in ${locale}`, () => {
      const missing = NAV_KEYS.filter((key) => !hasKey(translations, key))
      expect(missing).toEqual([])
    })

    it(`resolves every literal t('...') key in ${locale}`, () => {
      const missing = LITERAL_KEYS.filter((key) => !hasKey(translations, key))
      expect(missing).toEqual([])
    })
  }
})
