import type { AdDiagnoseResponse, AdDiagnoseStep } from '@/schemas/account-ad'

type DiagnoseResultData = NonNullable<AdDiagnoseResponse['result']>

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

export function AdDiagnosePanel({ result }: { result: DiagnoseResultData }) {
  return (
    <div className="rounded-lg border border-border bg-secondary p-3 text-xs space-y-2">
      <div className="font-semibold text-foreground">
        {result.domain} ({result.durationMs}ms) — {result.goodUrl || '—'}
      </div>
      {result.tests.length > 0 && (
        <div className="overflow-x-auto rounded border border-border bg-card">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary text-left font-semibold text-primary">
                <th className="px-2 py-1.5">URL</th>
                <th className="px-2 py-1.5">TCP</th>
                <th className="px-2 py-1.5">Bind</th>
                <th className="px-2 py-1.5">LDAP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {result.tests.map((test) => {
                const tcp = formatDiagnoseStep(test.tcp)
                const bind = formatDiagnoseStep(test.bind)
                const searchStep = formatDiagnoseStep(test.search)
                return (
                  <tr key={test.url}>
                    <td className="px-2 py-1.5 font-medium text-foreground">{test.url}</td>
                    <td className={`px-2 py-1.5 ${getStepToneClass(tcp.ok)}`}>{tcp.label}</td>
                    <td className={`px-2 py-1.5 ${getStepToneClass(bind.ok)}`}>{bind.label}</td>
                    <td className={`px-2 py-1.5 ${getStepToneClass(searchStep.ok)}`}>
                      {searchStep.label}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
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
