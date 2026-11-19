import { describe, expect, it } from 'vitest'
import en from '@/locales/en/translation.json'
import vi from '@/locales/vi/translation.json'
import zhCN from '@/locales/zh-CN/translation.json'
import { ERROR_STATUS_META, isFullPageError, toErrorStatus } from './error-status'

const LOCALES = { vi, en, 'zh-CN': zhCN } as const
const STATUSES = Object.keys(ERROR_STATUS_META)

function readKey(source: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((current, part) => {
    if (typeof current !== 'object' || current === null) return undefined
    return (current as Record<string, unknown>)[part]
  }, source)
}

describe('ERROR_STATUS_META', () => {
  it('only marks 401/403/404 as full-page', () => {
    const fullPage = STATUSES.filter((status) =>
      isFullPageError(status as keyof typeof ERROR_STATUS_META),
    )

    expect(fullPage.sort()).toEqual(['401', '403', '404'])
  })

  for (const [locale, translations] of Object.entries(LOCALES)) {
    it(`has copy for every status in ${locale}`, () => {
      const missing = STATUSES.flatMap((status) =>
        ['caption', 'title', 'description']
          .map((part) => `errors.status.${status}.${part}`)
          .filter((key) => typeof readKey(translations, key) !== 'string'),
      )

      expect(missing).toEqual([])
    })
  }
})

describe('toErrorStatus', () => {
  it('maps known HTTP statuses', () => {
    expect(toErrorStatus({ status: 403, message: 'Forbidden' })).toBe('403')
    expect(toErrorStatus({ status: '503', message: 'Down' })).toBe('503')
  })

  it('folds unknown 5xx codes into the generic 500 variant', () => {
    expect(toErrorStatus({ status: 599 })).toBe('500')
  })

  it('maps a Response instance', () => {
    expect(toErrorStatus(new Response(null, { status: 401 }))).toBe('401')
  })

  it('maps fetch failures to the network variant', () => {
    expect(toErrorStatus(new TypeError('Failed to fetch'))).toBe('network')
  })

  it('falls back to unknown for unmapped 4xx and arbitrary errors', () => {
    expect(toErrorStatus({ status: 418 })).toBe('unknown')
    expect(toErrorStatus(new Error('boom'))).toBe('unknown')
    expect(toErrorStatus(null)).toBe('unknown')
  })
})
