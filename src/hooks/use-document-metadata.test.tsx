import i18n from '@/i18n'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resolveDocumentTitle, useDocumentMetadata } from './use-document-metadata'

function MetadataHarness() {
  useDocumentMetadata()
  return (
    <div>
      <Link to="/dashboard">Go Dashboard</Link>
      <Link to="/tasks/42">Go Task Detail</Link>
      <Link to="/tasks/42/edit">Go Task Edit</Link>
    </div>
  )
}

function seedHeadMetaTags() {
  const tags: Array<{ attr: 'name' | 'property'; key: string }> = [
    { attr: 'name', key: 'description' },
    { attr: 'property', key: 'og:title' },
    { attr: 'property', key: 'og:description' },
    { attr: 'name', key: 'twitter:title' },
    { attr: 'name', key: 'twitter:description' },
  ]

  for (const { attr, key } of tags) {
    const meta = document.createElement('meta')
    meta.setAttribute(attr, key)
    meta.setAttribute('content', '')
    document.head.appendChild(meta)
  }
}

describe('resolveDocumentTitle', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('vi')
  })

  it('resolves static routes, dynamic task routes, and fallback titles', () => {
    const t = i18n.t.bind(i18n)

    expect(resolveDocumentTitle('/dashboard', t)).toBe('Tổng Dashboard · Điều Phối')
    expect(resolveDocumentTitle('/login', t)).toBe('Đăng nhập hệ thống · Điều Phối')
    expect(resolveDocumentTitle('/tasks/new', t)).toBe('Thêm nhiệm vụ mới · Điều Phối')
    expect(resolveDocumentTitle('/tasks/42', t)).toBe('Chi tiết nhiệm vụ #42 · Điều Phối')
    expect(resolveDocumentTitle('/tasks/42/edit', t)).toBe('Chỉnh sửa nhiệm vụ #42 · Điều Phối')
    expect(resolveDocumentTitle('/', t)).toBe('Điều Phối — Hệ thống điều phối song ngữ Trung - Việt')
    expect(resolveDocumentTitle('/unknown-path', t)).toBe(
      'Điều Phối — Hệ thống điều phối song ngữ Trung - Việt',
    )
  })
})

describe('useDocumentMetadata', () => {
  beforeEach(async () => {
    document.head.innerHTML = ''
    document.title = ''
    seedHeadMetaTags()
    await i18n.changeLanguage('vi')
  })

  afterEach(async () => {
    await i18n.changeLanguage('vi')
  })

  it('updates document title, html lang, and meta tags on route and language changes', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="*" element={<MetadataHarness />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(document.documentElement.lang).toBe('vi')
    expect(document.title).toBe('Đăng nhập hệ thống · Điều Phối')
    expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
      'content',
      i18n.t('app.description'),
    )
    expect(document.head.querySelector('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'Đăng nhập hệ thống · Điều Phối',
    )
    expect(document.head.querySelector('meta[name="twitter:title"]')).toHaveAttribute(
      'content',
      'Đăng nhập hệ thống · Điều Phối',
    )

    await user.click(screen.getByRole('link', { name: 'Go Dashboard' }))
    expect(document.title).toBe('Tổng Dashboard · Điều Phối')

    await user.click(screen.getByRole('link', { name: 'Go Task Detail' }))
    expect(document.title).toBe('Chi tiết nhiệm vụ #42 · Điều Phối')

    await user.click(screen.getByRole('link', { name: 'Go Task Edit' }))
    expect(document.title).toBe('Chỉnh sửa nhiệm vụ #42 · Điều Phối')

    await act(async () => {
      await i18n.changeLanguage('en')
    })

    expect(document.documentElement.lang).toBe('en')
    expect(document.title).toBe(`${i18n.t('tasks.createForm.editTitle', { id: '42' })} · Điều Phối`)
    expect(document.head.querySelector('meta[property="og:description"]')).toHaveAttribute(
      'content',
      i18n.t('app.description'),
    )
    expect(document.head.querySelector('meta[name="twitter:description"]')).toHaveAttribute(
      'content',
      i18n.t('app.description'),
    )
  })
})
