# Project Decisions & Deviations Log

This document records the architectural decisions, agreed scope, and deviations from the boilerplate defaults for **Điều Phối**.
As mandated by the boilerplate and project rules, all deviations are documented here in `docs/` only (never modifying the core files in `.claude/`).

---

## 1. Page & Directory Placement Rules

- **Feature-owned pages:** All route-level pages with business logic live in `src/features/<feature>/pages/` (e.g. `src/features/tasks/pages/TaskListPage.tsx`, `TaskDetailPage.tsx`, `TaskApprovePage.tsx`, `TaskCreatePage.tsx`, `src/features/dashboard/pages/DashboardPage.tsx`, etc.).
- **Standalone pages:** `src/pages/` is reserved strictly for generic/unauthenticated pages without feature domain logic:
  - `src/pages/login/LoginPage.tsx`
  - `src/pages/not-found/NotFoundPage.tsx`
- **Component Primitives:** `src/components/ui/` houses standard shadcn components.
- **Layout Shell:** `src/components/layout/` houses `AppShell.tsx`, `Sidebar.tsx`, `Header.tsx`, `ErrorState.tsx`, `DevPanel.tsx`.
- **Utilities:** `src/utils/` houses `cn.ts`, formatters, etc. (no `src/lib/`).
- **HTTP / Services:** `src/services/http.ts` and `src/services/env.ts` handle fetch operations, error normalization, and environment variables.
- **Form Schemas:** `src/schemas/<domain>.ts` for Zod form schemas per `form-validation` skill.
- **Mocks:** `src/mocks/` for MSW browser/server handlers, dynamically imported in DEV mode only.

---

## 2. Design Tokens & Styling (Tailwind + shadcn/ui)

- **Source of truth:** `src/index.css` via Tailwind v4 `@theme inline` block.
- **No MUI / No Emotion:** Exclusively `lucide-react` for icons and shadcn/ui + Tailwind for components.
- **Conflict 1 (Dark Mode):** Light mode only for v1 (as specified in brief §10 line 254). CSS variable architecture is preserved for future dark mode support.
- **Conflict 2 (Status Colors):** Status colors are defined as semantic CSS custom variables (`--color-status-*`) in `src/index.css` rather than raw arbitrary hex values, ensuring WCAG 4.5:1 contrast on white and adhering to `rules/theming.md`.
- **Layout Breakpoints (D2):** Major layout switch occurs at Tailwind `lg` (1024px). Viewports < 1024px (including portrait tablets) render the mobile layout.

---

## 3. Confirmed Section 10 Open Decisions

- **D2 (Breakpoint):** `lg` (1024px) for desktop app shell; mobile layout below 1024px.
- **D3 (Scope Tabs):** Labels are "Giao cho tôi / Tôi giao / Tất cả". Default scope is `mine` for staff ("Nhân viên"), `all` for department heads ("Trưởng bộ phận") and approvers ("Người duyệt").
- **D4 (Action Button):** Label is "Thêm nhiệm vụ" (matching mockup).
- **D5 (Navigation Names):** "Bảng điều khiển" (Dashboard) and "Văn bản hệ thống" (System texts).
- **D6 (Roles & Permissions — Updated post-legacy analysis):**
  - Replaced the brief's 4 synthetic roles (`Người duyệt` removed) and 9 synthetic permission keys with the real backend model: **5 fixed roles** (`user`, `admin`, `superadmin`, `exec_assistant`, `exec_vp`) + **14 per-account `menu_perms` keys** (`dashboard`, `list`, `messages`, `learnknow`, `language`, `todo`, `worklog`, `report_pdf`, `kpi_report`, `excel_report`, `kpi_people`, `kpi_brief`, `account`, `ad` with `s`/`r`/`w` levels, `null` = full access) + legacy task-level ownership/department/confidentiality helpers. The brief's editable Role-Permission matrix screen is out of scope.
- **D7 (Zustand Scope):** Restricted to client session, role, active locale, UI preferences (density, collapsed states), and dev mock toggles. URL search params remain the single source of truth for list/filter/pagination state.
- **D8 (First-Release Scope — Updated post-legacy analysis):** Core v1 = App shell, error pages, Login / Session / Remember-Me / Personal Settings, and the real-API Task lifecycle (list with client-side filtering/pagination, detail + dynamic progress reports + pause/resume + split-group view + read-only `work_items`, create/edit/clone/delete with confidentiality 0–3, readers, cross-viewers, multi-assignee, recurring). Acceptance/approval flow (§5.3, `pending`/`approved`/`rejected`, `task.approve`) is permanently out of scope. Dashboard, Todo, Messages, Lessons, KPI/Reports, Project `work_items` editor/Gantt, and Admin screens are deferred to later phases.

---

## 4. Internationalization (i18n)

- Locales supported: `vi` (Vietnamese, default), `en` (English), `zh-CN` (Simplified Chinese), `zh-TW` (Traditional Chinese).
- **Server i18n overrides dropped:** The new SPA uses static bundled `i18next` JSON files only; legacy `GET /api/i18n/overrides` and the "Văn bản hệ thống" (`Dispatch-language.html`) screen/nav item are omitted.
- **Path deviation:** `src/locales/<lang>/translation.json` (Vite enforces that files in `public/` are served as raw static URLs and cannot be directly imported into JavaScript bundles via `import ... from '../../public/...'`. Moving translation JSON files into `src/locales/` enables Vite to bundle them efficiently at build time, eliminates runtime HTTP fetch latency, and complies with Vite's asset handling rules).
- Keys follow grouped dot-notation (`nav.*`, `status.*`, `common.*`, `tasks.*`, `errors.*`).

---

## 5. Error Handling (Stage 2)

Brief §5.12 ("Error pages (full page, outside the app shell)") states:

> "Router: root `errorElement` renders the full-page ErrorState; `*` catch-all and permission guard also render full-page 404/403; a small class ErrorBoundary around the app; lazy-chunk load failures map to the network variant with "Tải lại trang". An error must never leave the sidebar visible with an empty content area."

Brief §8 item 17 states:

> "`ErrorState` in-layout variant showed an empty gray content area with a visible sidebar -> errors are full page outside the shell."

**Decision (hybrid error UI, approved with the Stage 2 plan):**

- `401`, `403`, `404` and route-level failures render the full-page `ErrorState` outside the app shell. Data-fetch failures with these codes are thrown as router responses so the root `errorElement` replaces the whole shell.
- `5xx`, `408`/`429` timeouts and `network` failures render an `InlineError` block with a retry action inside the current page content area instead of replacing the whole page.
- **Deviation:** §5.12's table lists `408/429`, `500/502/503/504` and `network` as full-page variants. Stage 2 renders those inline by explicit user decision, so a transient failure can be retried without losing the page context. Full-page `ErrorState` remains the single component for route-level and permission errors.
- `src/components/layout/error-status.ts` is the single status config (icon, tone, `fullPage`, copy keys, reference code). Both `ErrorState` and `InlineError` consume it; copy lives in `errors.status.*` for all three locales.

---

## 6. Mocks & Dev Tooling (Updated: Direct Real-API Integration)

- **MSW mocks & DevPanel removed (user decision):** To integrate directly against the real backend via Vite `server.proxy` (`VITE_PROXY_TARGET`), the runtime MSW browser worker (`src/mocks/`, `public/mockServiceWorker.js`) and `DevPanel` simulation tool were removed. Unit tests stub `fetch` at the transport boundary as needed.
- **Service worker / `public/`:** `vite.config.ts` keeps default `build.copyPublicDir` (`true`) because `public/` now holds real static production assets (`logo.png`, `site.webmanifest`) after `mockServiceWorker.js` removal.

---

## 7. Status Presentation (Stage 2)

- `STATUS_META` in `src/components/ui/status-text.tsx` is the single source of truth for task/urgent status: label key, token-based text/dot classes, `order`, `filterable` and `inLegend`.
- `FILTER_STATUSES` and `LEGEND_STATUSES` are derived from that record; `FilterBar` and `LegendStrip` no longer keep their own status lists.
- Status colors use the `--color-status-*` tokens through utilities (`text-status-*`, `bg-status-*`); the previous hex values and inline `style` attributes are gone.
- Added semantic tokens `--color-brand` (#E53935, logo mark), `--color-success` (#15803D, positive confirmation) and `--color-warning` (#B45309, warning error tone) per the approved Stage 2 decisions. `ErrorState`/`InlineError` tones map to `text-primary`, `text-warning` and `text-destructive`.

---

## 8. Style Compliance (Stage 2)

Brief §3: "flat and calm. Light gray page, white cards with 1px border, NO box-shadows, NO gradients, NO tinted card backgrounds, one blue accent"; §3.3: "Control height 40px desktop, 44px mobile"; §3.4: compact table density uses a 40px header.

- **Dark variants:** all `dark:` utilities were removed from `src/components/ui/*` (dark mode is deferred, brief §10).
- **Shadows:** no `shadow-*` utility remains except the sidebar active indicator (an inset token shadow: `shadow-[inset_3px_0_0_var(--color-primary)]`). Floating button, dev panel, logo, mobile action bars, dialogs, sheets, popovers, dropdowns, selects and inputs no longer use elevation.
- **Raw colors:** `bg-[#F3F4F8]` → `bg-secondary`, `bg-[#E8F0FE]` → `bg-primary-soft`, `bg-[#1F2937]` → `bg-foreground`, `bg-red-600` → `bg-destructive` (notification) / `bg-brand` (brand mark), `bg-emerald-500` → `bg-success`, `amber-*` → `warning` tokens, `bg-black/50` → `bg-overlay`, `text-white` on primary/destructive/brand → `text-primary-foreground` / `text-destructive-foreground` / `text-brand-foreground`. `--color-brand-foreground` (#FFFFFF) was added as the pair for the brand token.
- **Inline styles:** only the four layout-computed cases remain — `Logo` size (`Logo.tsx`), table column width (`data-table.tsx`), progress bar width (`TaskDetailPage.tsx`) and `scrollbarGutter` (`Sidebar.tsx`). The sidebar's `style={{ fontWeight: 500 }}` became the `font-medium` class.
- **Controls:** form controls and primary buttons use `h-11 lg:h-10` (44px mobile / 40px desktop); dense table row actions, pagination, tabs and dev-panel chrome keep their compact sizes. `Button` defaults are now `h-11 lg:h-10` (`sm`: `h-11 lg:h-8`), and `Input`/`Select` defaults follow the same pair.
- **Table header:** already 40px — `table.tsx` sets `h-10` on `TableHead`, matched by the compact density spec, so no change was needed.
- **Padding (verified, not redone):** the shell owns page padding — `AppShell.tsx` renders `<main className="... px-4 py-4 lg:px-6 short:py-3">`; no route page repeats outer padding, only internal card padding (`p-4`/`p-5`). Skeleton placeholders in the detail/approve pages still use `p-6` internally; left unchanged because it is card-level spacing.

---

## 9. Legacy Backend Alignment Decisions (Post-Analysis, Approved)

The rebuild replaces the UI only; the existing Node backend (`Dispatch.js`) and SQLite database (`dispatch_database_v10.db`) do not change. See `docs/legacy-analysis/` for full evidence.

1. **Deployment & Proxy (Reverse Proxy on Frontend Host):** Backend runs on internal HTTPS without frontend-host access. Vite `server.proxy` (dev, `secure: false`) and a frontend-side reverse proxy such as Nginx/IIS/Caddy (prod) forward `/api/*` and `/uploads/*` to the backend, avoiding CORS and self-signed SSL issues on user browsers.
2. **Client-Side Pagination on `GET /api/tasks`:** `GET /api/tasks` returns the full visible `Task[]` bare array (< 1,000 rows in production). Filtering, scope counts (`mine` / `created` / `all`), sorting, and `10|20|30|50` pagination run client-side over the TanStack Query cache while keeping URL search params as the single source of truth.
3. **Hybrid Backend Error Message Handling (Deviation from Brief §6):** HTTP/infrastructure errors (`401`, `403`, `404`, `408/429`, `5xx`, network) and `DUP_TITLE_DUE` map strictly to `i18next` keys (never exposing 5xx internals). For `400`/`409`/`422` business rejections where the backend returns a bilingual `data.message` without a machine code, the client extracts the active-language segment (`vi` or `zh-CN`/`zh-TW`) for toast/form feedback.
4. **Auth Token Storage (Deviation from `.claude/rules/security.md`):** Because the backend authenticates via custom headers (`username: encodeURIComponent(u)` and `x-session-token`) rather than `httpOnly` cookies, the SPA stores the active tab session in `sessionStorage` (`dispatch_session_v15`) and the opt-in "Remember me" 64-hex device token in `localStorage` (`dispatch.remember.v16`) for `POST /api/session/resume`. XSS risk is mitigated by React escaping and zero `dangerouslySetInnerHTML`.
5. **Project `work_items` & Mobile:** In v1, tasks with `work_items` display their sub-work items read-only on the detail page and preserve the original `work_items` JSON verbatim on `PUT /api/tasks/:id` to prevent data loss (full project editor & Gantt deferred). The responsive SPA (`lg: 1024px`) replaces legacy `Dispatch-cell.html` directly with no phone redirect.
6. **Live-Probe Verified Shapes (2026-11-20):**
   - `GET /api/session/verify` → `{ success, user: { id, username, fullname, dept, site, role, status, auth_source, email, title, dept_source, dept_ou_dn, ad_dn, menu_perms, is_computer_room } }`.
   - `GET /api/tasks` → bare `Task[]` (`id` numeric, `due_date` `YYYY-MM-DDTHH:mm`, `createdAt`/`updatedAt`/`dispatch_date` `YYYY-MM-DD HH:mm:ss`, `attachments` JSON string, `all_reports` formatted summary string, `last_report`, `last_report_meta`).
   - `GET /api/tasks/:id/reports` → bare `Report[]` newest-first (`id`, `task_id`, `username`, `fullname`, `content`, `attachments` JSON string, `km_link`, `createdAt`, `progress`, `updatedAt`, `pause_action`, `work_topics`, `split_assignee`, `split_seq`).
   - `GET /api/meta/depts` & `GET /api/meta/sites` → return `depts`/`allDepts`, `sites`/`allSites`, plus `roles`, `secrecy`, `secrecy_order`, `dispatch_nature`, `levels`, `legacy`, `otherValue`.

---

## 10. Legacy V16.11.0-r29 Full Parity Roadmap Decisions (2026-11-23, Approved)

Recorded here so **every future session** has persistent context without relying on chat history:

1. **Q1 — Export / Import Spreadsheet Strategy:**
   - **Phases 0–4:** Use zero-dependency UTF-8 BOM CSV export (`src/utils/export-table.ts`, with CSV formula-injection neutralization) plus TSV clipboard copy and `@media print` views for simple tabular exports (KPI, Brief Board, Accounts, Worklog).
   - **Phases 5–6:** Install `xlsx` (SheetJS) and load it strictly via **lazy dynamic `import()`** only when needed for true multi-sheet `.xlsx` generation and Project `work_items` Excel template download / upload.
2. **Q2 — Unified `/account` Module (replacing 3 `/admin/*` stubs):**
   - Consolidate `AdminUsersPage`, `AdminRolesPage`, and `AdminDepartmentsPage` into a single `/account` feature aligned with legacy `Dispatch-account.html` (`r27–r29`).
   - All authenticated users can access `/account` to inspect their own profile, `extra_depts`, OU hierarchy, and visible scope (`GET /api/account/scope`, `GET /api/account/org`).
   - Admin-only tabs (Account review & CRUD, 16-feature `menu_perms` editor, `view-depts` OU viewer picker, `extra_depts` multi-dept editor, AD Import/Sync/Diagnose, Site Manager, OU Naming Rule preview/apply, and 1-Click Archive for `superadmin`/`exec_*`) render inside `/account` based on role/permissions.
3. **Q3 — Phased Rollout Order (Reusable-First):**
   - **Phase 0:** `r29` auth/permission updates (`dash_total`, `dash_dept`, `extra_depts`, `電腦室 = 資訊部` dept alias), shared domain calculators (`kpi-domain.ts`), CSV/clipboard/print helpers (`export-table.ts`), chart CSS tokens (`--color-chart-6..10`), and reusable responsive UI primitives (`MetricCard`, `HorizontalBarRow`, `TrendLineChart`, `DonutChart`, `Sparkline`, `ResponsiveModal`).
   - **Phase 1:** Account registration form (unauthenticated on `/login`) + Offline session recovery, and authenticated `/account` page (inside `AppShell`, accessible to all signed-in users including regular `user` role) showing own scope + Org OU tree.
   - **Phase 2:** Company Dashboard (`/dashboard` + 3 drill-down modals + `dash_total` post trends) & Department Dashboard (`/dashboard/department`, `dash_dept`, heatmap).
   - **Phase 3:** KPI People Table (`/kpi`, replacing `SlaPage` stub) & KPI Brief / Supervisor Board (`/kpi/brief`).
   - **Phase 4:** Full Admin tabs inside `/account` (Users, 16-item `menu_perms`, `view-depts`, `extra_depts`, AD, Sites, OU rule, Archive) and removal of legacy `/admin/*` stubs.
   - **Phase 5:** Project `work_items` create/edit + Excel template/upload, Integrated Board & Gantt, `work_topics` reporting, AI report generation, rich paste, and 3-minute idle-aware auto-refresh.
   - **Phase 6:** Personal Worklog (`/worklog`) & 4-tab Report Center (`/reports`: PDF, Periodic KPI, Excel/Word/WebReport, Server Archive).

---

## 11. Mandatory TanStack Table (`DataTable`) Standard (2026-11-25)

- **Rule:** Every UI data table in `src/features/` and `src/pages/` MUST use `DataTable` (`src/components/ui/data-table.tsx`, powered by `@tanstack/react-table`) — or `@tanstack/react-table` directly for specialized layouts.
- **Prohibited:** Raw HTML `<table>` elements or direct shadcn `<Table>` primitives outside `src/components/ui/table.tsx` and `src/components/ui/data-table*.tsx` (the only permitted exception is non-React offline export HTML string generators such as standalone Web/Word report documents).





