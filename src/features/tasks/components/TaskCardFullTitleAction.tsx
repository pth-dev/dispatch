import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { TaskCardViewModel } from '../utils/task-card-mapper'

type TaskCardFullTitleActionProps = {
  vm: TaskCardViewModel
}

const TRIGGER_CLASS =
  'relative z-10 -my-3 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-end rounded px-1.5 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer'

export function TaskCardFullTitleAction({ vm }: TaskCardFullTitleActionProps) {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" className={TRIGGER_CLASS}>
          {t('tasks.card.readFull')}
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        aria-describedby={undefined}
        className="rounded-t-xl p-5 space-y-3 motion-reduce:animate-none motion-reduce:transition-none"
      >
        <SheetHeader className="text-left border-b border-border pb-2">
          <SheetTitle className="text-sm font-semibold text-foreground">
            {vm.code} — {t('tasks.card.fullTitleDialog')}
          </SheetTitle>
        </SheetHeader>
        <p className="select-text wrap-anywhere text-sm font-semibold text-foreground leading-relaxed">
          {vm.title}
        </p>
        {vm.translatedTitle && vm.translatedTitle !== vm.title && (
          <p className="select-text wrap-anywhere text-xs text-muted-foreground leading-relaxed">
            {vm.translatedTitle}
          </p>
        )}
      </SheetContent>
    </Sheet>
  )
}
