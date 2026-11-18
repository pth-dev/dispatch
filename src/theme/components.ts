import { semanticTokens } from './semantic-tokens'

export const componentTokens = {
  table: {
    rowHeightCompact: '44px',
    rowHeightComfortable: '50px',
    headerHeight: '40px',
  },
  sidebar: {
    itemMinHeight: '44px',
    itemPadding: '6px 12px',
    width: semanticTokens.spacing.sidebarWidth,
  },
  topbar: {
    height: semanticTokens.spacing.topbarHeightDesktop,
  },
} as const
