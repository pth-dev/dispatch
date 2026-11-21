import * as React from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { APP_ROUTES } from '@/constants/app-routes'
import { useIsMobile } from '@/hooks/use-mobile'
import type { TaskCardViewModel } from '../utils/task-card-mapper'

type FullTitleBodyProps = {
  vm: TaskCardViewModel
  onNavigate: () => void
}

function FullTitleBody({ vm, onNavigate }: FullTitleBodyProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-primary">{vm.code}</span>
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <Languages className="size-4 shrink-0" aria-hidden="true" />
          <span>
            {vm.isUntranslated ? t('tasks.card.untranslated') : t('tasks.card.translated')}
          </span>
        </span>
      </div>

      <p className="select-text wrap-anywhere text-sm font-semibold text-foreground leading-relaxed">
        {vm.title}
      </p>

      {vm.translatedTitle && vm.translatedTitle !== vm.title && (
        <p className="select-text wrap-anywhere text-xs text-muted-foreground leading-relaxed">
          {vm.translatedTitle}
        </p>
      )}

      <dl className="space-y-1.5 border-t border-border pt-2.5 text-xs">
        <div className="flex justify-between gap-3">
          <dt className="shrink-0 text-muted-foreground">{t('tasks.card.siteLabel')}</dt>
          <dd className="select-text text-right text-foreground wrap-anywhere">{vm.site}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="shrink-0 text-muted-foreground">{t('tasks.card.categoryLabel')}</dt>
          <dd className="select-text text-right text-foreground wrap-anywhere">{vm.category}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="shrink-0 text-muted-foreground">{t('tasks.card.assignee')}</dt>
          <dd className="select-text text-right text-foreground wrap-anywhere">
            {vm.assigneeDisplay}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="shrink-0 text-muted-foreground">{t('tasks.card.requester')}</dt>
          <dd className="select-text text-right text-foreground wrap-anywhere">
            {vm.requesterDisplay}
          </dd>
        </div>
      </dl>

      <Button asChild className="h-11 lg:h-10 w-full text-xs font-medium" onClick={onNavigate}>
        <Link to={APP_ROUTES.TASK_DETAIL(vm.id)}>{t('tasks.card.openTask')}</Link>
      </Button>
    </div>
  )
}

type TaskCardFullTitleActionProps = {
  vm: TaskCardViewModel
}

const TRIGGER_CLASS =
  'relative z-10 -my-3 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-end rounded px-1.5 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer'

export function TaskCardFullTitleAction({ vm }: TaskCardFullTitleActionProps) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)

  if (isMobile) {
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
              {t('tasks.card.fullTitleDialog')}
            </SheetTitle>
          </SheetHeader>
          <FullTitleBody vm={vm} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={TRIGGER_CLASS}>
          {t('tasks.card.readFull')}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-4 motion-reduce:animate-none motion-reduce:transition-none"
      >
        <FullTitleBody vm={vm} onNavigate={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}
