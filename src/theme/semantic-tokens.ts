import { rawColors } from './raw-colors'

export const semanticTokens = {
  colors: {
    bg: rawColors.background,
    card: rawColors.surface,
    border: rawColors.border,
    text: rawColors.textPrimary,
    mutedText: rawColors.textSecondary,
    primary: rawColors.primary,
    primaryHover: rawColors.primaryHover,
    primarySoft: rawColors.primarySoft,
    accent: rawColors.accent,
    overlay: rawColors.overlay,
  },
  status: {
    new: rawColors.statusNew,
    draft: rawColors.statusDraft,
    in_progress: rawColors.statusInProgress,
    approved: rawColors.statusApproved,
    pending: rawColors.statusPending,
    done: rawColors.statusDone,
    overdue: rawColors.statusOverdue,
    rejected: rawColors.statusRejected,
    urgent: rawColors.statusUrgent,
  },
  radius: {
    control: '8px',
    card: '12px',
    sheetTop: '16px',
    pill: '999px',
  },
  spacing: {
    sidebarWidth: '260px',
    topbarHeightDesktop: '56px',
    topbarHeightMobile: '56px',
    pagePaddingDesktop: '16px 24px',
    pagePaddingMobile: '16px',
    touchTargetMin: '44px',
  },
} as const

export type TaskStatusCode = keyof typeof semanticTokens.status
