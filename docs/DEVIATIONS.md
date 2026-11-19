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
- **D6 (Roles & Permissions):**
  - Roles: `Nhân viên` (assignee, primary persona), `Người duyệt` (approver), `Trưởng bộ phận` (department head / dispatcher), `Quản trị viên` (admin).
  - Permission keys: `task.view`, `task.create`, `task.update`, `task.assign`, `task.reassign`, `task.approve`, `lesson.view`, `lesson.manage`, `system.manage`.
- **D7 (Zustand Scope):** Restricted to client session, role, active locale, UI preferences (density, collapsed states), and dev mock toggles. URL search params remain the single source of truth for list/filter/pagination state.
- **D8 (First-Release Scope):** App shell, error pages, task lifecycle (list, detail, approve, create, reassign), minimal login, and personal settings.

---

## 4. Internationalization (i18n)

- Locales supported: `vi` (Vietnamese, default), `en` (English), `zh-CN` (Simplified Chinese).
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

## 6. Mocks & Dev Tooling (Stage 2)

- **Departments data:** `src/mocks/data/departments.ts` is no longer imported by app code. `src/features/tasks/api/departments.ts` fetches `/api/departments` and validates the payload with `src/schemas/department.ts` (Zod). `useDepartments()` in `src/features/tasks/api/queries.ts` is the only consumer path for `FilterBar`, `TaskCreatePage` and `ReassignDialog`.
- **Mock bootstrap:** `src/main.tsx` imports `./mocks` through a dynamic `import()` inside `if (import.meta.env.DEV)`. Because `import.meta.env.DEV` is statically `false` in a production build, Rollup drops the branch and no MSW chunk is emitted.
- **Service worker:** `public/mockServiceWorker.js` is DEV-only. `vite.config.ts` sets `build.copyPublicDir: false` (documented in the config) so Vite still serves `public/` in dev but the worker is never copied into `dist/`. Revisit this flag if real static assets are ever added to `public/`.
- **DevPanel:** `AppShell` lazy-loads `DevPanel` behind `import.meta.env.DEV`, so the panel and its copy do not reach a production bundle.
- **Production audit:** after `npm run build`, no file under `dist/` matches `msw`, `faker`, `mockServiceWorker` or `DEV Simulation`, and no `DevPanel`/mock chunk is emitted.

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




