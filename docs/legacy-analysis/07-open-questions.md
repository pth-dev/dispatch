# 07 — Gaps, Risks & Decisions Only the User Can Make

> **Scope**: Missing files, internal contradictions, dead/unused code, security observations, boilerplate/brief conflicts (Task J), and a numbered list of product/architecture decisions that **only the user** can make. No decisions are changed here.

---

## 1. Missing Files & Unverifiable Areas

| Missing Artifact | Why It Matters | Impact on Rebuild |
|---|---|---|
| Backend `Dispatch.js` & SQLite schema `dispatch_database_v10.db` | No source to verify server-side validation, exact HTTP status codes, SQL filtering (`scopeClause`), `requireAuth` menu-perm checks, or full column lists. | **High** — run the safe GET probes in [06-contract-probes.md](06-contract-probes.md) to capture real JSON shapes before coding API adapters. |
| `Dispatch-task.html` (93 refs) | Standalone task list page; exact default columns, filters, sort order, and URL param handling (`matchLinkFilter`) are not verifiable beyond `Dispatch.html`'s `goTaskList` contract. | **Medium** — brief §5.1 governs the new task list UI, but legacy deep-link param parity must be verified. |
| `Dispatch-cell.html` (48 refs) | Legacy mobile UI (WeCom-style) to which phones auto-redirect (`Dispatch.html:L6-L30`). | **Medium** — new SPA is responsive (`lg: 1024px`), so clarify whether `Dispatch-cell.html` is retired. |
| `dispatch-kpi.html` (42 refs) & `Dispatch-br.html` (33 refs) | KPI detail page & supervisor board. Formulas (`DU_kpiCalc`) are in `Dispatch-utils.js`, but page layouts/filters are missing. | **Low–Med** — KPI math is fully observed. |
| `dispatch-learnknow.html` (21 refs) | Lessons CRUD UI & endpoints (`POST/PUT/DELETE /api/lessons` `[UNKNOWN]`). | **Medium** — only `GET /api/lessons` is observed. |
| `Dispatch-language.html` (16 refs) | System texts ("Văn bản hệ thống") editor UI & write endpoints `[UNKNOWN]`. | **Medium** — blocked on Decision #1 (i18n overrides). |

---

## 2. Contradictions, Version Drift & Dead Code in Legacy

1. **Build version drift (`[OBSERVED]`)**: User context stated `16.11.0-r11`; actual provided `Dispatch-utils.js:L506` and `Dispatch.html:L966` are **`16.11.0-r20`** (adds Quick Create r12, WeCom board r13, recurring rename r14, mandatory `task_type` & Today's To-Do r15, and full Project `work_items` + Gantt + sub-work progress r16–r20). Brief §1 still says `V16.8.0`.
2. **Comment-only / uncalled endpoint (`[OBSERVED]` vs `[COMMENT]`)**: `GET /api/contacts/resolve` is documented in comments (`Dispatch-utils.js:L342, L9750`) but never called; code calls `POST /api/pocket/contacts` (`L9856`).
3. **Header contract comments out of date**: `Dispatch-utils.js:L481-L498` and `Dispatch.html:L1032-L1055` omit ~10 newer endpoints (`auth-source`, `merge`, `name-check`, `menu-perms`, `ad/ous`, `type-detail`, `req-dept`, `office-files`, `webreports`, `i18n/overrides`) and ~25 newer `FormData` task fields.
4. **Asymmetric `superadmin` vs `exec_*` checks (`[OBSERVED]`)**:
   - `DU_canEditTask` (`L1811`) and `DU_canDeleteTask` (`L8875`) include `superadmin` (`DU_isSuperLike`), **but** `DU_canSetCross` (`L9572`) and `DU_canDeleteReportAtt` (`L10742`) check `DU_isExec` (excluding `superadmin`).
   - `DU_canEditTask` (`L1812`) checks `assigned_unit` for `admin`, **but** `DU_canDeleteTask` (`L8877`) checks only `reporter_dept` and `req_depts` (omitting `assigned_unit`).
5. **Paused tasks still match `delayed_pending` (`[OBSERVED]`)**: `taskMatchesStatus(t, 'delayed_pending')` (`L1104`) and `DU_statusKey(t)` (`L1114`) do **not** check `DU_isPaused(t)`, so a paused task past its due date is still counted as `delayedPending` in `computeDashboardStats` (`Dispatch.html:L2131`) even though KPI (`DU_kpiCalc`) and Today's To-Do (`DU_todayTodoList`) exclude paused tasks.
6. **Dashboard `onTimeRate` denominator mismatch (`[OBSERVED]`)**: `computeDashboardStats` (`Dispatch.html:L2213`) computes `onTime / done`, whereas `computeAssigneeRanking` (`L2257`) and `DU_kpiCalc` (`Dispatch-utils.js:L9297`) compute `onTime / total`.

---

## 3. Security-Sensitive Observations

| Observation | Evidence | Conflict / Risk |
|---|---|---|
| **Remember-me token in `localStorage`** (`dispatch.remember.v16`) and session token in `sessionStorage` (`dispatch_session_v15`), sent via custom `x-session-token` header | `Dispatch-utils.js:L628-L676, L719-L725` | Conflicts with `.claude/rules/security.md` ("prefer httpOnly cookies; if client must hold a token, keep it in memory — not `localStorage`"). Since backend cannot change, this requires a documented deviation if Remember-Me is kept. |
| **UI-only permission checks cannot be trusted** | `DU_canEditTask`, `DU_canDeleteTask`, `DU_permApplyNav`, `canManageUser` | Backend enforcement is only `[COMMENT]`-claimed (`L494, L9314, L11252`). Must be verified on live backend. |
| **Inline HTML rendering & `innerHTML` everywhere** | `Dispatch-utils.js` & `Dispatch.html` | Legacy uses `escapeHtml()` + `innerHTML` extensively; new React SPA will eliminate this by using JSX (no `dangerouslySetInnerHTML`). |
| **`getSafeLink` allows `http://`** and only blocks `javascript:` | `Dispatch-utils.js:L1011-L1017` | Does not block `data:` or `vbscript:` schemes explicitly (prepends `http://` to them). New SPA should validate URL protocol with `new URL()` allowing only `http:` / `https:`. |
| **Server filesystem path input in Archive modal** (`targetPath`) | `Dispatch.html:L5626-L5633, L5767` | Superadmin can pass arbitrary absolute Windows/UNC paths to backend. Keep out of first release unless required. |
| **Message board exposes user IP addresses** (`m.ip`, `r.ip`) | `Dispatch.html:L5855, L5863` | Privacy/security note; verify if IP display should be hidden in new UI. |

---

## 4. Conflicts with Boilerplate Rules & `docs/PROJECT_BRIEF.md`

1. **Brief §7 `Task` model & API vs real backend**: Current `src/mocks` and `src/schemas/task.ts` implement brief §7's idealized REST API (`GET /api/tasks?page&pageSize` → `{ items, total }`, JSON `POST`, `NV-2026-xxxx` IDs, approval endpoints). Real backend returns bare `Task[]` with numeric IDs, `FormData` writes, and derived status.
2. **Brief §5.12 / §6 "never show raw `error.message`" vs backend bilingual `data.message`**: Backend returns human-readable Chinese/Vietnamese business errors in `data.message` without consistent machine `code`s.
3. **Boilerplate `.claude/rules/security.md` vs legacy token storage**: `sessionStorage` + `localStorage` remember-me token vs in-memory/httpOnly-cookie rule.
4. **Boilerplate `.claude/rules/localization.md` vs legacy `/api/i18n/overrides`**: Key-based `i18next` JSON (`vi`, `en`, `zh-CN`, `zh-TW`) vs legacy DOM-mutating Chinese-core overrides (no `en`).

---

## 5. Decisions Only the User Can Make

### Decision 1 — Server i18n Overrides ("Văn bản hệ thống", `/api/i18n/overrides`)
- **Evidence**: Legacy overrides are keyed by Simplified Chinese source text core (`k`) with columns `zhs`, `zht`, `vi` (no `en`), applied via DOM `TreeWalker` + `MutationObserver` (`Dispatch-utils.js:L8460-L8764`). New SPA uses `i18next` JSON keys (`vi`, `en`, `zh-CN`, `zh-TW`). `Dispatch-language.html` is not provided.
- **Options**:
  - **A (Drop overrides in new SPA)**: Use static `i18next` bundles (`vi`, `en`, `zh-CN`, `zh-TW`); remove "Văn bản hệ thống" nav item (or link to legacy `Dispatch-language.html` if coexisting). Simplest, 100% compliant with React & boilerplate.
  - **B (Read-only adapter)**: Fetch `GET /api/i18n/overrides` at startup and map known `k` values to `i18next` keys via a static lookup table (still no `en` override on backend).
  - **C (Full editor in SPA)**: Requires capturing `Dispatch-language.html` write APIs first and maintaining a `k ↔ i18next key` bridge.

### Decision 2 — First-Release Scope (Reopened D8)
- **Evidence**: Legacy `16.11.0-r20` has grown far beyond brief D8: besides Tasks & Reports, it includes Project `work_items` + Gantt (r16–r20), Quick Create (r12), Daily Repair (r11), Recurring tasks, Split groups, 4 Confidentiality levels + Readers + Cross-viewers, Pockets (4 kinds), Today's To-Do scheduler, Work Records, Messages, Lessons, PDF/Excel/WebReport + Office preview, KPI/Supervisor boards, Admin Users + AD + Sites + Menu-Perms + Archive.
- **Options**:
  - **A (Core Tasks + Auth + Shell first)**: Login/session/remember-me, Shell, Error pages, Task List (client-side filter/page), Task Detail + Dynamic Reports (progress, pause/resume, attachments, split-group view), Create/Edit/Clone Task (all required backend fields, confidentiality/readers/cross-viewers, multi-assignee, recurring), Personal Settings. Defer Dashboard, KPI/Reports, Project `work_items` Gantt, Messages, Todos, Lessons, Admin.
  - **B (Core Tasks + Dashboard + Today's To-Do)**: Option A + flat Dashboard (`computeDashboardStats`, Today's To-Do, lessons marquee).
  - **C (Full parity including Project `work_items` & Admin)**: Much larger Phase 1; requires capturing missing `dispatch-learnknow.html` / `Dispatch-language.html` / `dispatch-kpi.html` first.

### Decision 3 — Deployment Model (Same-Origin vs Separate Origin / Incremental Rollout)
- **Evidence**: Legacy uses `API = window.location.origin` (`Dispatch-utils.js:L521`), relative `/uploads/dispatch/...` paths (`L438, L1333`), no CORS headers observed, and shares `sessionStorage['dispatch_session_v15']` + `BroadcastChannel` with other `.html` pages.
- **Options**:
  - **A (Served by existing Node server / reverse proxy on same origin, e.g. `/app/` or replacing `/`)**: Zero CORS issues, `/uploads/...` works directly, can link to legacy pages (`dispatch-kpi.html`, `Dispatch-cell.html`) during transition.
  - **B (Separate host/port)**: Requires reverse proxy (Nginx/IIS) in front of both SPA and `Dispatch.js`, since backend cannot be modified to add CORS.

### Decision 4 — Permission Model: `DU_MENU_FEATURES` vs Brief's 9 Permission Keys (Reopened D6)
- **Evidence**: Legacy has 5 fixed roles (`user`, `admin`, `superadmin`, `exec_assistant`, `exec_vp`), task-level helpers (`DU_canEditTask`, `DU_canDeleteTask`, `DU_canSetReaders`, `DU_canSetCross`, `DU_isReaderOnly`, `DU_isCrossViewer`), and **14 per-account `s/r/w` menu feature flags** (`currentUser.menu_perms`, `PUT /api/admin/users/menu-perms`). There is NO editable role-permission matrix and NO `task.approve` / `Người duyệt`.
- **Options**:
  - **A (Adopt legacy model directly)**: Use the 5 real roles + `DU_MENU_FEATURES` (14 keys `s/r/w`) + task-level helper functions as the single permission system. Drop the brief's 9 synthetic keys and the Roles Matrix admin page.
  - **B (Internal abstraction layer)**: Keep clean semantic permission helpers in React (e.g. `canCreateTask`, `canEditTask`, `canDeleteTask`, `canSubmitReport`, `canSetReaders`, `canSetCross`) backed by the 5 real roles + `menu_perms` under the hood.

### Decision 5 — Client-Side Pagination & Full-List `GET /api/tasks`
- **Evidence**: `GET /api/tasks` takes **no query parameters** and returns the full visible `Task[]` array (`Dispatch.html:L2017-L2020`). Current `src/features/tasks/api/queries.ts` assumes server-side filtering/pagination (`?scope&search&page&pageSize` → `{ items, total, counts }`).
- **Options**:
  - **A (Client-side filter/sort/pagination over TanStack Query cache)**: Fetch `GET /api/tasks` once (refetch every 3 min / on mutations), derive scope counts, filters, and pagination client-side while keeping URL search params as the UI state source of truth (preserving brief §5.1 UX). Confirm expected max task count (e.g. < 5,000 rows).
  - **B (Virtualization if task list is large)**: Same as A, plus table virtualization if live `GET /api/tasks` returns > 2,000 rows (verify via Probe #6).

### Decision 6 — Handling Backend-Supplied `data.message` Text
- **Evidence**: Backend returns bilingual/Traditional Chinese `data.message` for validation and business errors (e.g. duplicate name, AD errors, merge conflicts, permission denials) and rarely includes a machine `data.code` (only `DUP_TITLE_DUE` observed). Brief §6 forbids showing raw `error.message`.
- **Options**:
  - **A (Hybrid)**: Map known HTTP statuses (`401`, `403`, `404`, `5xx`, network) and known codes (`DUP_TITLE_DUE`) to clean `i18next` copy; for `400`/`409`/`422` business rejections with `data.message`, extract the active-language segment (or `zhS` for `zh-CN`) and show it in a toast/form alert (never showing raw stack traces or 5xx internals).
  - **B (Strict i18n-only)**: Never show `data.message`; map only HTTP status + `DUP_TITLE_DUE` to generic `i18next` errors (risk: users lose specific backend reasons for AD/validation/permission failures).

### Decision 7 — Auth Token Storage Deviation (`sessionStorage` / `localStorage` Remember-Me)
- **Evidence**: Legacy stores session token in `sessionStorage['dispatch_session_v15']` and optional 64-hex remember-me token in `localStorage['dispatch.remember.v16']` (`Dispatch-utils.js:L628-L676`). Boilerplate `.claude/rules/security.md` bans tokens in `localStorage` and prefers httpOnly cookies or memory.
- **Options**:
  - **A (Documented security deviation — preserve Remember-Me)**: Keep `sessionStorage` for tab session + `localStorage` for opt-in Remember-Me (record in `docs/DEVIATIONS.md`). Preserves page-refresh and auto-login UX with unchanged backend.
  - **B (Session-only, no Remember-Me)**: Store session in `sessionStorage` only (or memory, losing login on F5); drop Remember-Me.

### Decision 8 — Project Mode (`work_items` / Gantt, r16–r20) & Mobile (`Dispatch-cell.html`)
- **Evidence**: Legacy r16–r20 added a large Project Work Zone (`work_items` JSON, up to 60 sub-topics, working-day deductions, Gantt chart, sub-work progress reporting). Also, phones auto-redirect to `Dispatch-cell.html`.
- **Options**:
  - **Project `work_items`**: (A) Preserve `work_items` verbatim on `PUT /api/tasks/:id` (read-only display in v1, full editor/Gantt in a later phase) vs (B) Full `work_items` editor + Gantt in v1. *(Warning: sending empty `work_items` on edit would wipe existing project data!)*
  - **Mobile**: (A) Responsive new SPA handles mobile at `< 1024px` (`lg`), retiring `Dispatch-cell.html` vs (B) Keep redirecting phones to legacy `Dispatch-cell.html` until mobile SPA is complete.
