import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import type { AdDiagnoseResponse, AdDiagnoseStep } from '@/schemas/account-ad'

type DiagnoseResultData = NonNullable<AdDiagnoseResponse['result']>
type DiagnoseTestRow = DiagnoseResultData['tests'][number]

function formatDiagnoseStep(step: AdDiagnoseStep): { ok: boolean | null; label: string } {
  if (!step) return { ok: null, label: '—' }
  if (step.ok) {
    if (step.entries != null) return { ok: true, label: 'OK' }
    if (step.ms != null) return { ok: true, label: `${step.ms}ms` }
    return { ok: true, label: 'OK' }
  }
  return { ok: false, label: step.error || step.message || 'ERR' }
}

function getStepToneClass(ok: boolean | null): string {
  if (ok === null) return 'text-muted-foreground'
  return ok ? 'text-success' : 'text-destructive'
}

const DIAGNOSE_COLUMNS: ColumnDef<DiagnoseTestRow, unknown>[] = [
  {
    id: 'url',
    header: 'URL',
    cell: ({ row }) => <span className="font-medium text-foreground">{row.original.url}</span>,
  },
  {
    id: 'tcp',
    header: 'TCP',
    cell: ({ row }) => {
      const step = formatDiagnoseStep(row.original.tcp)
      return <span className={getStepToneClass(step.ok)}>{step.label}</span>
    },
  },
  {
    id: 'bind',
    header: 'Bind',
    cell: ({ row }) => {
      const step = formatDiagnoseStep(row.original.bind)
      return <span className={getStepToneClass(step.ok)}>{step.label}</span>
    },
  },
  {
    id: 'ldap',
    header: 'LDAP',
    cell: ({ row }) => {
      const step = formatDiagnoseStep(row.original.search)
      return <span className={getStepToneClass(step.ok)}>{step.label}</span>
    },
  },
]

export function AdDiagnosePanel({ result }: { result: DiagnoseResultData }) {
  return (
    <div className="rounded-lg border border-border bg-secondary p-3 text-xs space-y-2">
      <div className="font-semibold text-foreground">
        {result.domain} ({result.durationMs}ms) — {result.goodUrl || '—'}
      </div>
      {result.tests.length > 0 && (
        <div className="rounded border border-border bg-card">
          <DataTable
            data={result.tests}
            columns={DIAGNOSE_COLUMNS}
            keyExtractor={(row, idx) => `${row.url}-${idx}`}
            variant="embedded"
            density="compact"
          />
        </div>
      )}
      {result.hints.map((hint, idx) => (
        <p key={idx} className="text-muted-foreground">
          • {hint}
        </p>
      ))}
    </div>
  )
}
