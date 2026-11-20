import { useTranslation } from 'react-i18next'
import { ListChecks } from 'lucide-react'
import type { WorkItemsEnvelope } from '@/schemas/task'

interface WorkItemsReadOnlyProps {
  envelope: WorkItemsEnvelope | null
}

export function WorkItemsReadOnly({ envelope }: WorkItemsReadOnlyProps) {
  const { t } = useTranslation()
  if (!envelope || envelope.items.length === 0) return null

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
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

      <div className="overflow-x-auto">
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
                  {item.owner || '-'}
                  {item.agent ? ` (${item.agent})` : ''}
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
