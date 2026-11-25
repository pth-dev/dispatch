import { useState } from 'react'
import { Download, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export type LightboxImage = {
  src: string
  name: string
}

type LessonImageLightboxProps = {
  image: LightboxImage | null
  onClose: () => void
}

const MIN_SCALE = 0.5
const MAX_SCALE = 3
const SCALE_STEP = 0.25

export function LessonImageLightbox({ image, onClose }: LessonImageLightboxProps) {
  const { t } = useTranslation()
  const [scale, setScale] = useState(1)

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setScale(1)
      onClose()
    }
  }

  return (
    <Dialog open={Boolean(image)} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="truncate pr-8 text-sm font-medium">
            {image?.name || t('lessons.lightbox.title')}
          </DialogTitle>
        </DialogHeader>

        {image && (
          <div className="space-y-3">
            <div className="flex max-h-[68vh] items-center justify-center overflow-auto rounded-lg border border-border bg-secondary/40 p-3">
              <img
                src={image.src}
                alt={image.name}
                style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
                className="max-h-[62vh] max-w-full rounded object-contain transition-transform"
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={scale <= MIN_SCALE}
                onClick={() => setScale((s) => Math.max(MIN_SCALE, Number((s - SCALE_STEP).toFixed(2))))}
                aria-label={t('lessons.lightbox.zoomOut')}
              >
                <ZoomOut className="size-4" aria-hidden="true" />
              </Button>
              <span className="min-w-14 text-center text-xs font-medium text-muted-foreground">
                {Math.round(scale * 100)}%
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={scale >= MAX_SCALE}
                onClick={() => setScale((s) => Math.min(MAX_SCALE, Number((s + SCALE_STEP).toFixed(2))))}
                aria-label={t('lessons.lightbox.zoomIn')}
              >
                <ZoomIn className="size-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setScale(1)}
                aria-label={t('lessons.lightbox.reset')}
              >
                <RotateCcw className="size-4" aria-hidden="true" />
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={image.src} download={image.name || true} target="_blank" rel="noopener noreferrer">
                  <Download className="size-4" aria-hidden="true" />
                  <span>{t('lessons.lightbox.download')}</span>
                </a>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
