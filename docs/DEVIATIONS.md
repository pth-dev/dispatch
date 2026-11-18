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
