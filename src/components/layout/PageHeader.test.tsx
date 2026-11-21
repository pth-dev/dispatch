import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageHeader } from './PageHeader'

describe('PageHeader', () => {
  it('renders title inside an h1 heading', () => {
    render(<PageHeader title="Danh sách nhiệm vụ" />)

    const heading = screen.getByRole('heading', { level: 1, name: 'Danh sách nhiệm vụ' })
    expect(heading).toBeInTheDocument()
  })

  it('renders optional badge, subtitle, and actions when provided', () => {
    render(
      <PageHeader
        title="Bài học kinh nghiệm"
        badge={<span data-testid="header-badge">14</span>}
        subtitle="Ghi nhận quy định vận hành"
        actions={<button type="button">Thêm mới</button>}
      />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Bài học kinh nghiệm' })).toBeInTheDocument()
    expect(screen.getByTestId('header-badge')).toHaveTextContent('14')
    expect(screen.getByText('Ghi nhận quy định vận hành')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thêm mới' })).toBeInTheDocument()
  })
})
