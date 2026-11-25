import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Sidebar } from './Sidebar'
import { useAppStore } from '@/app/store'
import type { SessionUser } from '@/schemas/auth'
import { APP_ROUTES } from '@/constants/app-routes'

function makeUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    username: 'staff1',
    fullname: 'Staff One',
    dept: '資訊部',
    site: 'YS',
    role: 'user',
    auth_source: 'local',
    menu_perms: null,
    is_computer_room: false,
    ...overrides,
  }
}

function renderSidebar(initialPath: string = APP_ROUTES.DASHBOARD) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Sidebar />
    </MemoryRouter>,
  )
}

describe('Sidebar grouping', () => {
  beforeEach(() => {
    useAppStore.setState({
      user: makeUser(),
      authStatus: 'authenticated',
      navGroupExpanded: {},
    })
  })

  it('renders semantic section headers and collapses KPI group by default on unrelated routes', () => {
    renderSidebar(APP_ROUTES.TASKS)

    expect(screen.getByText('Điều hành')).toBeInTheDocument()
    expect(screen.getByText('Công việc')).toBeInTheDocument()
    expect(screen.getByText('Phân tích & Hệ thống')).toBeInTheDocument()

    const kpiToggle = screen.getByRole('button', { name: 'KPI & Báo cáo' })
    expect(kpiToggle).toHaveAttribute('aria-expanded', 'false')
    expect(kpiToggle).not.toHaveAttribute('aria-controls')
    expect(screen.queryByRole('link', { name: 'Bảng KPI nhân viên' })).not.toBeInTheDocument()

    fireEvent.click(kpiToggle)
    expect(kpiToggle).toHaveAttribute('aria-expanded', 'true')
    expect(kpiToggle).toHaveAttribute('aria-controls', 'sidebar-group-kpi-group')
    expect(screen.getByRole('link', { name: 'Bảng KPI nhân viên' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Bảng quản lý KPI' })).toBeInTheDocument()
  })

  it('auto-expands KPI group on active child route and allows manual collapse', () => {
    renderSidebar(APP_ROUTES.KPI_BRIEF)

    const kpiToggle = screen.getByRole('button', { name: 'KPI & Báo cáo' })
    expect(kpiToggle).toHaveAttribute('aria-expanded', 'true')

    const kpiBriefLink = screen.getByRole('link', { name: 'Bảng quản lý KPI' })
    expect(kpiBriefLink).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Bảng KPI nhân viên' })).not.toHaveAttribute(
      'aria-current',
    )

    fireEvent.click(kpiToggle)
    expect(kpiToggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: 'Bảng quản lý KPI' })).not.toBeInTheDocument()
  })

  it('renders disabled button for show-only child permission inside group and when auto-unwrapped', () => {
    useAppStore.setState({
      user: makeUser({
        menu_perms: {
          kpi_people: 's',
          kpi_brief: 'sr',
        },
      }),
    })

    const { unmount } = renderSidebar(APP_ROUTES.KPI_BRIEF)
    const disabledChild = screen.getByRole('button', { name: 'Bảng KPI nhân viên' })
    expect(disabledChild).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('link', { name: 'Bảng quản lý KPI' })).toBeInTheDocument()
    unmount()

    useAppStore.setState({
      user: makeUser({
        menu_perms: {
          kpi_people: 's',
          kpi_brief: '',
        },
      }),
    })

    renderSidebar(APP_ROUTES.TASKS)
    expect(screen.queryByRole('button', { name: 'KPI & Báo cáo' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bảng KPI nhân viên' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('auto-unwraps collapsible group when only one child is permitted', () => {
    useAppStore.setState({
      user: makeUser({
        menu_perms: {
          kpi_people: 'sr',
          kpi_brief: '',
        },
      }),
    })

    renderSidebar(APP_ROUTES.TASKS)

    expect(screen.queryByRole('button', { name: 'KPI & Báo cáo' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Bảng KPI nhân viên' })).toBeInTheDocument()
  })

  it('hides an entire section when none of its items are visible', () => {
    useAppStore.setState({
      user: makeUser({
        menu_perms: {
          dashboard: '',
          dash_dept: '',
        },
      }),
    })

    renderSidebar(APP_ROUTES.TASKS)

    expect(screen.queryByText('Điều hành')).not.toBeInTheDocument()
    expect(screen.getByText('Công việc')).toBeInTheDocument()
  })
})
