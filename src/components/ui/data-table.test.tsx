import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { DataTable, type ColumnDef } from './data-table'

type Row = {
  id: string
  name: string
}

const columns: ColumnDef<Row>[] = [
  { id: 'name', header: 'Name', cell: ({ row }) => row.original.name },
]

const keyExtractor = (row: Row) => row.id

describe('DataTable', () => {
  it('renders skeleton rows while loading', () => {
    const { container } = render(
      <DataTable data={[]} columns={columns} keyExtractor={keyExtractor} isLoading />,
    )

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    expect(screen.queryByText('Empty')).not.toBeInTheDocument()
  })

  it('renders the empty message when there are no rows', () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        keyExtractor={keyExtractor}
        emptyMessage="Nothing here"
      />,
    )

    expect(screen.getAllByText('Nothing here')[0]).toBeInTheDocument()
  })

  it('renders rows when data is present', () => {
    render(
      <DataTable
        data={[{ id: '1', name: 'First task' }]}
        columns={columns}
        keyExtractor={keyExtractor}
      />,
    )

    expect(screen.getByText('First task')).toBeInTheDocument()
  })

  it('renders expandable sub-component when key is in expandedKeys', () => {
    render(
      <DataTable
        data={[{ id: '1', name: 'First task' }]}
        columns={columns}
        keyExtractor={keyExtractor}
        expandedKeys={new Set(['1'])}
        renderSubComponent={(item) => <div>Sub details for {item.name}</div>}
      />,
    )

    expect(screen.getByText('Sub details for First task')).toBeInTheDocument()
  })

  it('paginates rows when enablePagination is true and data exceeds initialPageSize', async () => {
    const user = userEvent.setup()
    const rows: Row[] = Array.from({ length: 12 }, (_, idx) => ({
      id: String(idx + 1),
      name: `Person ${idx + 1}`,
    }))

    render(
      <DataTable
        data={rows}
        columns={columns}
        keyExtractor={keyExtractor}
        enablePagination
        initialPageSize={10}
      />,
    )

    expect(screen.getByText('Person 1')).toBeInTheDocument()
    expect(screen.getByText('Person 10')).toBeInTheDocument()
    expect(screen.queryByText('Person 11')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '2' }))

    expect(screen.getByText('Person 11')).toBeInTheDocument()
    expect(screen.getByText('Person 12')).toBeInTheDocument()
    expect(screen.queryByText('Person 1')).not.toBeInTheDocument()
  })

  it('replaces the table with the inline error block', () => {
    render(
      <DataTable
        data={[{ id: '1', name: 'First task' }]}
        columns={columns}
        keyExtractor={keyExtractor}
        error={<p>Inline failure</p>}
      />,
    )

    expect(screen.getByText('Inline failure')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByText('First task')).not.toBeInTheDocument()
  })
})
