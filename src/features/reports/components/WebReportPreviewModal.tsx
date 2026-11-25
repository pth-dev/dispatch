import * as React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Maximize2,
  Printer,
  Save,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { hardenArchivedReportHtml, triggerTextFileDownload } from '../utils/report-domain'
import {
  downloadWebReportAsWord,
  exportWebReportAsExcel,
  type BuiltWebReport,
} from '../utils/web-report-domain'

type WebReportPreviewModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  queue: readonly BuiltWebReport[]
  activeIndex: number
  onIndexChange: (index: number) => void
  isSaving: boolean
  onSaveCurrent: (report: BuiltWebReport) => void
  onNotify: (msg: string) => void
}

export function WebReportPreviewModal({
  open,
  onOpenChange,
  queue,
  activeIndex,
  onIndexChange,
  isSaving,
  onSaveCurrent,
  onNotify,
}: WebReportPreviewModalProps) {
  const { t } = useTranslation()
  const [zoom, setZoom] = React.useState(100)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const iframeRef = React.useRef<HTMLIFrameElement>(null)

  const current = queue[activeIndex] ?? queue[0] ?? null
  const safeDoc = current ? hardenArchivedReportHtml(current.html) : ''

  const handleFullscreen = () => {
    const el = containerRef.current
    if (!el) return
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else if (el.requestFullscreen) {
      void el.requestFullscreen()
    }
  }

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print()
  }

  const handleExportExcel = async () => {
    if (!current) return
    try {
      await exportWebReportAsExcel(current)
      onNotify(t('reports.common.exportSuccess'))
    } catch {
      onNotify(t('common.error'))
    }
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      title={current ? current.title : t('reports.common.preview')}
      description={
        current
          ? `${current.reportNo} · ${current.target.label} (${activeIndex + 1}/${queue.length})`
          : undefined
      }
      footer={
        current ? (
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {queue.length > 1 && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={activeIndex <= 0}
                    onClick={() => onIndexChange(activeIndex - 1)}
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                    <span>{t('common.back')}</span>
                  </Button>
                  <span className="px-1 text-xs text-muted-foreground">
                    {activeIndex + 1} / {queue.length}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={activeIndex >= queue.length - 1}
                    onClick={() => onIndexChange(activeIndex + 1)}
                  >
                    <span>{t('reports.web.nextReport')}</span>
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Button>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-label={t('reports.web.zoomOut')}
                onClick={() => setZoom((z) => Math.max(75, z - 25))}
              >
                <ZoomOut className="size-3.5" aria-hidden="true" />
              </Button>
              <span className="text-xs text-muted-foreground">{zoom}%</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-label={t('reports.web.zoomIn')}
                onClick={() => setZoom((z) => Math.min(150, z + 25))}
              >
                <ZoomIn className="size-3.5" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-label={t('reports.web.fullscreen')}
                onClick={handleFullscreen}
              >
                <Maximize2 className="size-3.5" aria-hidden="true" />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="size-3.5" aria-hidden="true" />
                <span>PDF</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  triggerTextFileDownload(
                    current.html,
                    `${current.fileBase}.html`,
                    'text/html;charset=utf-8',
                  )
                }
              >
                <Download className="size-3.5" aria-hidden="true" />
                <span>HTML</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => downloadWebReportAsWord(current.html, current.fileBase, current.title)}
              >
                <FileText className="size-3.5" aria-hidden="true" />
                <span>Word</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void handleExportExcel()}
              >
                <FileSpreadsheet className="size-3.5" aria-hidden="true" />
                <span>Excel</span>
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isSaving}
                onClick={() => onSaveCurrent(current)}
              >
                <Save className="size-3.5" aria-hidden="true" />
                <span>{t('reports.web.saveArchive')}</span>
              </Button>
            </div>
          </div>
        ) : undefined
      }
    >
      <div
        ref={containerRef}
        className="h-[62vh] w-full overflow-auto rounded-lg border border-border bg-card"
      >
        {current && (
          <iframe
            ref={iframeRef}
            title={current.title}
            sandbox="allow-same-origin allow-modals"
            srcDoc={safeDoc}
            className="h-full w-full border-0 bg-card"
            style={zoom !== 100 ? { transform: `scale(${zoom / 100})`, transformOrigin: 'top left' } : undefined}
          />
        )}
      </div>
    </ResponsiveModal>
  )
}
