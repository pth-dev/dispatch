import * as React from 'react'
import { AdminNoticeBanner } from './AdminNoticeBanner'
import type { AdminNotice } from './AdminUserFormModal'
import { ArchiveBackupSection } from './ArchiveBackupSection'
import { OuNamingRuleSection } from './OuNamingRuleSection'
import { SitesManagerSection } from './SitesManagerSection'

export function AdminSystemTab() {
  const [notice, setNotice] = React.useState<AdminNotice | null>(null)

  return (
    <div className="space-y-4">
      <AdminNoticeBanner notice={notice} onDismiss={() => setNotice(null)} />
      <SitesManagerSection onNotify={setNotice} />
      <OuNamingRuleSection onNotify={setNotice} />
      <ArchiveBackupSection onNotify={setNotice} />
    </div>
  )
}
