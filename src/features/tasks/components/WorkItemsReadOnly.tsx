import { useTranslation } from 'react-i18next'
import { ListChecks } from 'lucide-react'
import type { WorkItemsEnvelope } from '@/schemas/task'
import { useUserDisplayResolver } from '../hooks/use-user-display-resolver'

interface WorkItemsReadOnlyProps {
  envelope: WorkItemsEnvelope | null
}

export function WorkItemsReadOnly({ envelope }: WorkItemsReadOnlyProps) {
  const { t } = useTranslation()
  const { resolveUser } = useUserDisplayResolver()
  if (!envelope || envelope.items.length === 0) return null

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ListChecks className="size-4 text-primary" aria-hidden="true" />
          <span>
            {t('tasks.detail.workItemsTitle', { count: envelope.items.length })}
          </span>
        </h2>
        <span className="text-[11px] text-muted-foreground">
          {t('tasks.detail.workItemsReadOnlyHint')}
        </span>
      </div>

      {/* Mobile stacked cards (< md) — avoids squeezed columns and clipped progress */}
      <div className="space-y-2.5 md:hidden">
        {envelope.items.map((item, idx) => {
          const ownerLabel = resolveUser(item.owner) || '-'
          const agentLabel = item.agent ? ` (${resolveUser(item.agent)})` : ''
          return (
            <div
              key={item.id}
              className="rounded-lg border border-border bg-background/60 p-3 space-y-1.5 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 font-medium text-foreground">
                  <span className="mr-1.5 font-semibold text-primary">#{idx + 1}</span>
                  <span>{item.topic || '-'}</span>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold tabular-nums text-foreground">
                  {typeof item.progress === 'number' ? `${item.progress}%` : '-'}
                </span>
              </div>

              {item.content && (
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {item.content}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-1 border-t border-border/60 text-[11px] text-muted-foreground">
                <span className="min-w-0 break-words">
                  {t('tasks.detail.workItemOwner')}: {ownerLabel}
                  {agentLabel}
                </span>
                <span className="shrink-0 tabular-nums">
                  {item.start || '-'} ~ {item.end || '-'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop table (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border text-primary font-semibold">
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">{t('tasks.detail.workItemTopic')}</th>
              <th className="py-2 pr-3">{t('tasks.detail.workItemOwner')}</th>
              <th className="py-2 pr-3">{t('tasks.detail.workItemDates')}</th>
              <th className="py-2 text-right">{t('tasks.detail.workItemProgress')}</th>
            </tr>
          </thead>
          <tbody>
            {envelope.items.map((item, idx) => (
              <tr key={item.id} className="border-b border-border last:border-b-0">
                <td className="py-2 pr-3 text-muted-foreground">{idx + 1}</td>
                <td className="py-2 pr-3">
                  <div className="font-medium text-foreground">{item.topic || '-'}</div>
                  {item.content && (
                    <div className="text-[11px] text-muted-foreground line-clamp-2">
                      {item.content}
                    </div>
                  )}
                </td>
                <td className="py-2 pr-3 text-muted-foreground">
                  {resolveUser(item.owner) || '-'}
                  {item.agent ? ` (${resolveUser(item.agent)})` : ''}
                </td>
                <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                  {item.start || '-'} ~ {item.end || '-'}
                </td>
                <td className="py-2 text-right font-medium text-foreground">
                  {typeof item.progress === 'number' ? `${item.progress}%` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
