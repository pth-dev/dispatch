import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface TodoConfirmDialogsProps {
  pendingDateChange: string | null
  onConfirmDateChange: () => void
  onCancelDateChange: () => void
  confirmMissingTimeOpen: boolean
  missingTimeCount: number
  isSaving: boolean
  onConfirmSaveWithMissingTime: () => void
  onCancelSaveWithMissingTime: () => void
}

export function TodoConfirmDialogs({
  pendingDateChange,
  onConfirmDateChange,
  onCancelDateChange,
  confirmMissingTimeOpen,
  missingTimeCount,
  isSaving,
  onConfirmSaveWithMissingTime,
  onCancelSaveWithMissingTime,
}: TodoConfirmDialogsProps) {
  const { t } = useTranslation()

  return (
    <>
      <AlertDialog
        open={pendingDateChange !== null}
        onOpenChange={(open) => {
          if (!open) onCancelDateChange()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('todo.confirmDate.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('todo.confirmDate.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDateChange}>
              {t('todo.confirmDate.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmMissingTimeOpen}
        onOpenChange={(open) => {
          if (!open && !isSaving) onCancelSaveWithMissingTime()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('todo.confirmMissingTime.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('todo.confirmMissingTime.description', {
                count: missingTimeCount,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSaving}
              onClick={(event) => {
                event.preventDefault()
                onConfirmSaveWithMissingTime()
              }}
            >
              {isSaving
                ? t('todo.actions.saving')
                : t('todo.confirmMissingTime.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
