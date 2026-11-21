import { useAppStore } from '@/app/store'
import type { DirectoryUser } from '@/schemas/auth'
import { parseAssigneeList } from '@/utils/task-domain'
import { useUserDirectory } from '../api/queries'

export function formatUserWithCode(
  codeOrName: string | null | undefined,
  explicitFullname?: string | null,
  directory?: readonly DirectoryUser[],
  currentUser?: { username: string; fullname: string } | null,
): string {
  const raw = (codeOrName ?? '').trim()
  const fallbackName = (explicitFullname ?? '').trim()
  if (!raw) return fallbackName
  if (raw.includes('(') && raw.includes(')')) return raw

  const lower = raw.toLowerCase()
  let fullname = fallbackName

  if (!fullname && directory) {
    const match = directory.find((u) => u.username.trim().toLowerCase() === lower)
    if (match?.fullname) fullname = match.fullname.trim()
  }

  if (!fullname && currentUser && currentUser.username.trim().toLowerCase() === lower) {
    fullname = currentUser.fullname.trim()
  }

  if (fullname && fullname.toLowerCase() !== lower) {
    return `${fullname} (${raw})`
  }

  return raw
}

export function lookupUserDept(
  codeOrName: string | null | undefined,
  explicitDept?: string | null,
  directory?: readonly DirectoryUser[],
  currentUser?: { username: string; dept: string } | null,
): string {
  const direct = (explicitDept ?? '').trim()
  if (direct) return direct
  const raw = (codeOrName ?? '').trim().toLowerCase()
  if (!raw) return ''

  if (directory) {
    const match = directory.find((u) => u.username.trim().toLowerCase() === raw)
    if (match?.dept) return match.dept.trim()
  }

  if (currentUser && currentUser.username.trim().toLowerCase() === raw) {
    return currentUser.dept.trim()
  }

  return ''
}

export function formatAssigneeListWithNames(
  rawAssignees: string | null | undefined,
  directory?: readonly DirectoryUser[],
  currentUser?: { username: string; fullname: string } | null,
): string {
  const list = parseAssigneeList(rawAssignees)
  if (list.length === 0) return ''
  return list
    .map((item) => formatUserWithCode(item, undefined, directory, currentUser))
    .join(', ')
}

export function useUserDisplayResolver() {
  const { data: directory } = useUserDirectory()
  const currentUser = useAppStore((s) => s.user)

  const resolveUser = (codeOrName: string | null | undefined, explicitFullname?: string | null) =>
    formatUserWithCode(codeOrName, explicitFullname, directory, currentUser)

  const resolveUserDept = (codeOrName: string | null | undefined, explicitDept?: string | null) =>
    lookupUserDept(codeOrName, explicitDept, directory, currentUser)

  const resolveAssignees = (rawAssignees: string | null | undefined) =>
    formatAssigneeListWithNames(rawAssignees, directory, currentUser)

  return {
    resolveUser,
    resolveUserDept,
    resolveAssignees,
  }
}
