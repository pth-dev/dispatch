import i18n from '@/i18n'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { Logo } from './Logo'

describe('Logo', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('vi')
  })
  it('renders /logo.png as decorative when showText is true by default', () => {
    const { container } = render(<Logo size={40} />)

    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img).toHaveAttribute('src', '/logo.png')
    expect(img).toHaveAttribute('alt', '')
    expect(img).toHaveAttribute('aria-hidden', 'true')
    expect(img).toHaveAttribute('width', '40')
    expect(img).toHaveAttribute('height', '40')
    expect(screen.getByText('Điều Phối')).toBeInTheDocument()
  })

  it('uses localized alt text when showText is false', () => {
    render(<Logo showText={false} size={32} />)

    const img = screen.getByRole('img', { name: 'Logo Điều Phối Shingtak' })
    expect(img).toHaveAttribute('src', '/logo.png')
    expect(img).not.toHaveAttribute('aria-hidden')
    expect(img).toHaveAttribute('width', '32')
    expect(img).toHaveAttribute('height', '32')
    expect(screen.queryByText('Điều Phối')).not.toBeInTheDocument()
  })
})
