/*
 * Design Tokens - TypeScript definitions
 * Skill: design-tokens
 * Primary source of truth is src/index.css.
 * These files re-export values for components or charts that cannot use CSS classes directly.
 */

export const rawColors = {
  primary: '#1F6FEB',
  primaryHover: '#1A5FCC',
  primarySoft: '#E8F0FE',
  accent: '#F5A623',
  background: '#F3F4F8',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textPlaceholder: '#9CA3AF',
  overlay: 'rgba(17, 24, 39, 0.45)',

  // Status colors (WCAG 4.5:1 on white)
  statusNew: '#6B7280',
  statusDraft: '#6B7280',
  statusInProgress: '#1F6FEB',
  statusApproved: '#1F6FEB',
  statusPending: '#B45309',
  statusDone: '#15803D',
  statusOverdue: '#D32F2F',
  statusRejected: '#D32F2F',
  statusUrgent: '#D32F2F',
} as const
