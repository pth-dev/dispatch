# Dead Code Report (Stage 2, task 2.6)

Report only — nothing was deleted in this stage. Findings were collected after tasks 2.1–2.5 were committed.

| # | Item | Evidence | Proposal | Risk |
|---|------|----------|----------|------|
| 1 | `src/theme/*` (4 files, 89 lines) | `grep "theme/\|from '@/theme'" src` → no matches. `src/theme/index.ts:1-3` only re-exports its own folder; `semantic-tokens.ts:1` imports `raw-colors.ts`. | Delete the folder, or keep it as documentation-only if the palette must stay readable outside `index.css`. | Low — no runtime importer. |
| 2 | `src/components/ui/index.ts` barrel (19 lines) | `grep "from '@/components/ui'" src` → no matches; every consumer imports the module directly (`@/components/ui/button`, …). | Delete the barrel. | Low. Removing it also makes items 3–5 unreachable. |
| 3 | `src/components/ui/badge.tsx` | Only reference in `src` is the barrel (`index.ts:7`); no component imports `Badge`. | Delete together with the barrel. | Low. |
| 4 | `src/components/ui/popover.tsx` | Only reference is `index.ts:16`; no `Popover` usage. | Delete together with the barrel. | Low. |
| 5 | `src/components/ui/separator.tsx` | Only reference is `index.ts:6`; dropdowns use their own `DropdownMenuSeparator` (`dropdown-menu.tsx:165`). | Delete together with the barrel. | Low. |
| 6 | `sidebarCollapsed` state | `src/app/store/index.ts:18,40,53` — declared, initialized and exposed, but no component reads `sidebarCollapsed`/`setSidebarCollapsed`. The sidebar is fixed-width (`Sidebar.tsx`), no collapse UI exists. | Remove the field and setter, or wire a real collapse toggle if it is still planned. | Low (no consumer), but it is part of the public store shape. |
| 7 | `APP_ROUTES.SYSTEM_TEXTS` + nav item `system-texts` | `src/constants/app-routes.ts:11` and `src/app/nav-config.ts:57-62` define the link; `src/app/router/index.tsx` has no `system-texts` route (paths listed: tasks, tasks/new, tasks/:id, tasks/:id/approve, dashboard, messages, lessons, todo, sla, profile, admin/*, `*`). Following the item lands on the catch-all 404. | Remove the nav item, or add the planned placeholder page and route. | Medium for UX (dead navigation), low for code. |
| 8 | Unused locale keys (26 keys × 3 locales) | See the list below. Checked by scanning every literal `t('…')`, template `t(\`…\`)` prefix and `labelKey`/`titleKey` value in `src`. | Remove from `vi`, `en`, `zh-CN` together (the parity test in `src/i18n/locale-coverage.test.ts` keeps them aligned). | Low, unless a key is reserved for an approved upcoming screen. |
| 9 | Zod validation message strings that do not exist in any locale | `src/schemas/task.ts:76,78,79,80,87,88,89,97,104` use the singular namespace `task.validation.*`; all locale files only define `tasks.*` (no top-level `task` key). No component reads `errors.<field>.message` (grep `errors\.[a-zA-Z]+\.message` → no matches), because forms render their own `t('tasks.validation.*')` strings. | Point schema messages at the existing plural keys (or remove them and keep the single UI-level copy). | Low today (strings are never rendered), but it is a latent i18n bug if a future form renders `message`. |
| 10 | `LoginFormSchema` / `LoginFormValues` | `src/schemas/auth.ts` exports them; the only references are inside that file. `LoginPage.tsx` has no form state or validation and submits a static form. | Delete, or wire the login form to the schema. | Low. |
| 11 | `NotFoundPage` named export | `src/pages/not-found/NotFoundPage.tsx:3` exports the component and also default-exports it; the router lazy-imports the default. | Drop the named export (or use it in the router). | Low. |

## Unused locale keys (item 8)

- `department.it`, `department.technical`, `department.accounting`, `department.hr`, `department.sales`, `department.operations`, `department.planning` — department names now come from `/api/departments` (task 2.3), only `department.all` is still used.
- `common.save`, `common.create`, `common.edit`, `common.delete`, `common.all`, `common.error`, `common.actions`, `common.createdAt`.
- `common.pagination.perPage`, `common.pagination.firstPage`, `common.pagination.previousPage`, `common.pagination.nextPage`, `common.pagination.lastPage` — `PaginationControl` only uses `common.pagination.display` and `common.pagination.page`.
- `tasks.detail.title`.
- `tasks.approve.reasonError` — the approve screen uses `tasks.validation.rejectReasonRequired`.
- `tasks.createForm.saveDraft` — there is no draft action.
- `tasks.validation.departmentRequired`, `tasks.validation.reassignReasonRequired`, `tasks.validation.checklistRequired` — unused in the UI (see item 9).

## Checked and intentionally kept

- `src/components/ui/table.tsx` is used through `data-table.tsx` (relative import), so it is not dead.
- `src/mocks/*` stays as the DEV API (loaded dynamically, absent from `dist` — see `docs/DEVIATIONS.md` §6).
- Exported prop/type aliases (`DataTableProps`, `StatusMeta`, `ErrorTone`, `FilterValues`, …) are public type surface used inside their own modules; not dead code.
- The four remaining inline styles (`Logo` size, table column width, progress width, `scrollbarGutter`) are computed values, not style debt.
