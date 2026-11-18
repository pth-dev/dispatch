import * as React from 'react'
import { Link, useRouteError } from 'react-router'
import {
  SearchX,
  Lock,
  Clock,
  CircleAlert,
  WifiOff,
  House,
  ArrowLeft,
  RotateCcw,
  Copy,
  Check,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from './Logo'
import { APP_ROUTES } from '@/constants/app-routes'

export type ErrorStatusCode =
  | '404'
  | '403'
  | '401'
  | '408'
  | '429'
  | '500'
  | '502'
  | '503'
  | '504'
  | 'network'

interface StatusConfig {
  code: ErrorStatusCode
  icon: LucideIcon
  toneColor: string
  caption: string
  title: string
  description: string
  showLinks?: boolean
  showReferenceCode?: boolean
}

const STATUS_CONFIGS: Record<ErrorStatusCode, StatusConfig> = {
  '404': {
    code: '404',
    icon: SearchX,
    toneColor: '#1F6FEB',
    caption: 'LỖI 404 • KHÔNG TÌM THẤY',
    title: 'Không tìm thấy trang này',
    description:
      'Địa chỉ bạn yêu cầu không tồn tại, đã bị đổi tên hoặc tạm thời không khả dụng.',
    showLinks: true,
  },
  '403': {
    code: '403',
    icon: Lock,
    toneColor: '#B45309',
    caption: 'LỖI 403 • KHÔNG CÓ QUYỀN',
    title: 'Bạn chưa có quyền xem trang này',
    description:
      'Tài khoản hiện tại không có quyền truy cập vào tài nguyên này. Vui lòng liên hệ Quản trị viên nếu bạn cần cấp quyền.',
    showLinks: true,
  },
  '401': {
    code: '401',
    icon: Lock,
    toneColor: '#B45309',
    caption: 'LỖI 401 • HẾT PHIÊN ĐĂNG NHẬP',
    title: 'Phiên đăng nhập đã hết hạn',
    description:
      'Để đảm bảo an toàn thông tin, phiên làm việc của bạn đã kết thúc. Vui lòng đăng nhập lại.',
  },
  '408': {
    code: '408',
    icon: Clock,
    toneColor: '#B45309',
    caption: 'LỖI 408 • QUÁ THỜI GIAN CHỜ',
    title: 'Bạn thao tác quá nhanh hoặc kết nối quá chậm',
    description:
      'Yêu cầu mất nhiều thời gian hơn dự kiến để hoàn tất. Hãy kiểm tra lại đường truyền và thử lại.',
  },
  '429': {
    code: '429',
    icon: Clock,
    toneColor: '#B45309',
    caption: 'LỖI 429 • QUÁ NHIỀU YÊU CẦU',
    title: 'Bạn thao tác quá nhanh hoặc kết nối quá chậm',
    description:
      'Hệ thống đang nhận được quá nhiều yêu cầu trong thời gian ngắn. Vui lòng đợi ít giây rồi thử lại.',
  },
  '500': {
    code: '500',
    icon: CircleAlert,
    toneColor: '#D32F2F',
    caption: 'LỖI 500 • SỰ CỐ HỆ THỐNG',
    title: 'Hệ thống đang gặp sự cố',
    description:
      'Đây là lỗi từ phía hệ thống, không phải do bạn. Hãy thử tải lại sau ít phút. Nếu lỗi vẫn còn, gửi mã tham chiếu bên dưới cho bộ phận hỗ trợ.',
    showReferenceCode: true,
  },
  '502': {
    code: '502',
    icon: CircleAlert,
    toneColor: '#D32F2F',
    caption: 'LỖI 502 • CỔNG KẾT NỐI KHÔNG HỢP LỆ',
    title: 'Hệ thống đang gặp sự cố',
    description:
      'Máy chủ trung gian không nhận được phản hồi hợp lệ. Hãy thử tải lại sau ít phút.',
    showReferenceCode: true,
  },
  '503': {
    code: '503',
    icon: CircleAlert,
    toneColor: '#D32F2F',
    caption: 'LỖI 503 • BẢO TRÌ HỆ THỐNG',
    title: 'Hệ thống đang bảo trì',
    description:
      'Hệ thống đang được nâng cấp định kỳ nhằm cải thiện hiệu năng. Chúng tôi sẽ trở lại trong thời gian sớm nhất.',
    showReferenceCode: true,
  },
  '504': {
    code: '504',
    icon: CircleAlert,
    toneColor: '#D32F2F',
    caption: 'LỖI 504 • PHẢN HỒI QUÁ CHẬM',
    title: 'Phản hồi quá chậm',
    description:
      'Máy chủ xử lý mất quá nhiều thời gian để hoàn thành tác vụ. Hãy tải lại trang hoặc thử lại sau.',
    showReferenceCode: true,
  },
  network: {
    code: 'network',
    icon: WifiOff,
    toneColor: '#D32F2F',
    caption: 'MẤT KẾT NỐI MẠNG',
    title: 'Không thể kết nối',
    description:
      'Không thể thiết lập liên lạc với máy chủ. Vui lòng kiểm tra lại đường truyền Wi-Fi hoặc mạng nội bộ của bạn.',
    showReferenceCode: true,
  },
}

function getStaticReferenceCode(): string {
  return 'ERR-7F3A21 • 18/11/2026 09:30'
}

interface ErrorStateProps {
  status?: ErrorStatusCode
  technicalDetails?: string
  referenceCode?: string
  onRetry?: () => void
}

export function ErrorState({
  status = '500',
  technicalDetails,
  referenceCode,
  onRetry,
}: ErrorStateProps) {
  const config = STATUS_CONFIGS[status] || STATUS_CONFIGS['500']
  const Icon = config.icon
  const [copied, setCopied] = React.useState(false)

  const activeRefCode = referenceCode || getStaticReferenceCode()

  const handleCopy = () => {
    navigator.clipboard.writeText(activeRefCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const suggestedLinks = [
    { label: 'Danh sách nhiệm vụ', href: APP_ROUTES.TASKS },
    { label: 'Bảng điều khiển', href: APP_ROUTES.DASHBOARD },
    { label: 'Bài học kinh nghiệm', href: APP_ROUTES.LESSONS },
    { label: 'Việc cần làm hôm nay', href: APP_ROUTES.TODO },
  ]

  return (
    <div className="flex min-h-dvh flex-col bg-background select-none">
      {/* Top Header 64px */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6 lg:px-12">
        <Link to="/" className="flex items-center">
          <Logo size={36} />
        </Link>
        <a
          href="mailto:support@dieuphoi.vn"
          className="text-xs font-semibold text-primary hover:underline"
        >
          Hỗ trợ kỹ thuật
        </a>
      </header>

      {/* Main Error Content Column (max 560px) */}
      <main className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[560px] space-y-6 text-left">
          {/* Caption row */}
          <div
            className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase"
            style={{ color: config.toneColor }}
          >
            <Icon className="size-4.5 shrink-0" />
            <span>{config.caption}</span>
          </div>

          {/* H1 Title */}
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground tracking-tight leading-tight">
            {config.title}
          </h1>

          {/* Description */}
          <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
            {config.description}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            {status === '401' ? (
              <Button asChild variant="default" className="min-h-[44px]">
                <Link to={APP_ROUTES.LOGIN}>Đăng nhập lại</Link>
              </Button>
            ) : status === '408' || status === '429' || status === 'network' ? (
              <Button
                variant="default"
                className="min-h-[44px]"
                onClick={onRetry || (() => window.location.reload())}
              >
                <RotateCcw className="size-4 mr-2" />
                Thử lại
              </Button>
            ) : status.startsWith('5') ? (
              <>
                <Button
                  variant="default"
                  className="min-h-[44px]"
                  onClick={() => window.location.reload()}
                >
                  <RotateCcw className="size-4 mr-2" />
                  Tải lại trang
                </Button>
                <Button asChild variant="outline" className="min-h-[44px]">
                  <Link to={APP_ROUTES.TASKS}>
                    <House className="size-4 mr-2" />
                    Về trang chính
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="default" className="min-h-[44px]">
                  <Link to={APP_ROUTES.TASKS}>
                    <House className="size-4 mr-2" />
                    Về trang chính
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="min-h-[44px]"
                  onClick={() => window.history.back()}
                >
                  <ArrowLeft className="size-4 mr-2" />
                  Quay lại
                </Button>
              </>
            )}
          </div>

          {/* Bottom Reference Box */}
          {config.showReferenceCode && (
            <div className="rounded-lg border border-border bg-card p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-mono">
                  Mã tham chiếu: <strong className="text-foreground">{activeRefCode}</strong>
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-primary hover:underline cursor-pointer"
                  title="Sao chép mã lỗi"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* DEV-only technical stack trace box */}
          {import.meta.env.DEV && technicalDetails && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-[11px] font-mono text-destructive space-y-1">
              <div className="font-semibold">Chi tiết kỹ thuật (DEV only):</div>
              <pre className="overflow-x-auto whitespace-pre-wrap">{technicalDetails}</pre>
            </div>
          )}

          {/* Suggested Links for 404 / 403 */}
          {config.showLinks && (
            <div className="pt-4 border-t border-border space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Có thể bạn đang tìm:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {suggestedLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-primary hover:underline py-1"
                  >
                    • {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © 2026 Điều Phối • Phiên bản V16.8
      </footer>
    </div>
  )
}

/**
 * Root Error Boundary component used by React Router errorElement
 */
export function RootRouteErrorBoundary() {
  const error = useRouteError()

  let status: ErrorStatusCode = '500'
  let technical = ''

  if (typeof error === 'object' && error !== null) {
    if ('status' in error) {
      const s = String((error as { status: unknown }).status)
      if (['404', '403', '401', '408', '429', '500', '502', '503', '504'].includes(s)) {
        status = s as ErrorStatusCode
      }
    }
    if ('message' in error) {
      technical = String((error as { message: unknown }).message)
    }
    if ('stack' in error) {
      technical += `\n${String((error as { stack: unknown }).stack)}`
    }
  }

  return <ErrorState status={status} technicalDetails={technical} />
}
