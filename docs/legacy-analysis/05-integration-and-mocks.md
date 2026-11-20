# 05 — Integration, Deployment & Mock Fidelity Plan

> **Scope**: Runtime/deployment integration facts (Task G) and comparison of current `src/mocks` / `src/schemas` against legacy reality with an MSW fidelity plan (Task H). Read-only analysis — no files in `src/` were modified.

---

## G. Integration & Deployment Facts (`[OBSERVED]`)

### G.1 Origin, Static Assets, Uploads & External CDNs

| Item | Legacy Fact | Evidence |
|---|---|---|
| **API Base** | `const API = window.location.origin` — legacy HTML/JS is served **same-origin** by the Node backend `Dispatch.js` from `E:\node-s\dispatch\AP`. | `Dispatch-utils.js:L5, L521` |
| **Uploaded files** | Stored by backend at `E:\node-s\uploads\dispatch` (`[COMMENT]` L6), served at relative paths `/uploads/dispatch/...` (`[COMMENT]` L438). FE builds URLs with `DU_fileUrl(p) = ${API}/${p}` (`L1333-L1337`). Office preview fetches them with `{ credentials: 'same-origin' }` (`L8009`). | `Dispatch-utils.js:L6, L438, L1333-L1337, L8009` |
| **Vendor static file** | Mammoth.js tries `/vendor/mammoth.browser.min.js` first, then jsDelivr CDN (`mammoth@1.8.0`). | `Dispatch-utils.js:L7876` |
| **External CDNs** | Tailwind CDN (`cdn.tailwindcss.com`), `lucide@0.469.0` UMD (`unpkg.com`), Google Fonts (`Inter`, `Noto Sans TC`), SheetJS `xlsx@0.20.1` (`cdn.sheetjs.com`, lazy-loaded). **New SPA bundles its own deps (no runtime CDNs needed).** | `Dispatch.html:L456-L464`; `Dispatch-utils.js:L10791` |
| **Cache busting** | `<script src="Dispatch-utils.js?v=16.11.0-r20">`; comment notes backend long-caches only the current `DU_BUILD`/`DU_VERSION` (`[COMMENT]` L506). | `Dispatch.html:L966`; `Dispatch-utils.js:L506` |
| **Cookies / WebSockets** | **Zero** `document.cookie` usage and **zero** WebSocket/SSE usage in either file. Auth is purely custom headers (`username`, `x-session-token`). | grep across both files `[OBSERVED]` |

### G.2 Storage Keys & Cross-Tab Channels

| Storage / Channel | Key / Name | Purpose | Reader / Writer Evidence |
|---|---|---|---|
| `sessionStorage` | `dispatch_session_v15` | `{ user, token, loginAt }` — active tab session | `Dispatch-utils.js:L525, L628-L654` |
| `localStorage` | `dispatch.remember.v16` | `{ username, token (64-hex), days, savedAt }` — remember-me auto-login | `Dispatch-utils.js:L526, L661-L673` |
| `localStorage` | `dispatch.lastUser` | Last logged-in username (prefills login input) | `Dispatch-utils.js:L527, L674-L675` |
| `localStorage` | `dispatch.lang` | Active language (`bi` \| `zhs` \| `zht` \| `vi`) | `Dispatch-utils.js:L8323, L8364, L8770` |
| `localStorage` | `dispatch.i18n.ov` | Cached `{ version, items }` from `/api/i18n/overrides` | `Dispatch-utils.js:L8467, L8534, L8558` |
| `localStorage` | `dispatch.i18n.ping` | Timestamp ping to trigger `storage` event cross-tab i18n reload | `Dispatch-utils.js:L8567, L8576` |
| `localStorage` | `dispatch.view` | Mobile/desktop view preference (`desktop` \| `mobile` \| unset=`auto`) | `Dispatch.html:L12-L18`; `Dispatch-utils.js:L10854-L10877` |
| `localStorage` | `dispatch.lbFilter` | Dashboard leaderboard person filter | `Dispatch.html:L1159, L2758, L2769` |
| `localStorage` | `ARCHIVE_PATH_STORE_KEY` | Last archive output path (admin) | `Dispatch.html:L5645, L5769` |
| `localStorage` | `DU_rtplKey(kind)` | Custom abnormal report templates | `Dispatch-utils.js:L3877, L3930-L3932` |
| `localStorage` | *(Legacy cleanup)* `dispatch_user`, `currentUser` | Deleted on `DU_Session.save()` to prevent stale persistent login | `Dispatch-utils.js:L642` |
| `BroadcastChannel` | `dispatch-auth-v15` | `{ type: 'logout', username, token, all }` — cross-tab logout sync | `Dispatch-utils.js:L856-L870, L892` |
| `BroadcastChannel` | `dispatch-data-v15` | `{ type: 'task-deleted', id }` — cross-tab task deletion refresh | `Dispatch-utils.js:L8870, L8922` |
| `BroadcastChannel` | `dispatch-i18n` | `{ type: 'i18n-updated', at }` — cross-tab i18n override refresh | `Dispatch-utils.js:L8566, L8573-L8574` |

### G.3 Cross-Page Navigations & Compatibility Requirements

- **Other legacy HTML pages referenced** (`Dispatch-utils.js` & `Dispatch.html`):
  - `Dispatch-task.html` (`?filter=&value=&status=&alt=&label=`), `Dispatch-cell.html` (`?desktop=1|once`, `?mobile=1`, `?view=auto`), `dispatch-kpi.html` (`?start=&end=&dept=&q=`), `Dispatch-br.html` (`?year=&month=&person=&view=&from=cell`), `dispatch-learnknow.html`, `Dispatch-language.html`.
  - *(Note: `DU_wrLast.html`, `rep.html`, `r.html`, `info.html`, `sh.html` matched in the `.html` grep are **JS property accesses** like `DU_wrLast.html` and `rep.html`, NOT separate HTML files! Verified at `Dispatch-utils.js:L7692, L7731`.)*
- **What the new SPA must preserve if coexisting with legacy pages**:
  1. `sessionStorage['dispatch_session_v15']` format (`{ user, token, loginAt }`) and `BroadcastChannel('dispatch-auth-v15')` if any link still opens a legacy page (e.g. `dispatch-kpi.html` or `Dispatch-language.html`) during incremental rollout.
  2. Hash routes (`#task-<id>`, `#create`, `#dashboard`, `#messages`, `#todo`, etc.) and `goTaskList` query params if bookmarks or notifications point to them.
- **Vite Dev Proxy requirements** (when developing against a real backend without CORS changes):
  - Forward `/api` → `<backend-origin>` (preserving `username` and `x-session-token` headers and multipart `FormData` bodies).
  - Forward `/uploads` → `<backend-origin>` (for attachment thumbnails, downloads, and Office previews).
  - Forward `/vendor` → `<backend-origin>` (only if Office preview reuses backend-hosted Mammoth.js).
  - No WebSocket proxy needed.

---

## H. Mock Fidelity Plan & Current Repo Comparison

### H.1 Current `src/` vs Legacy Reality (Read-Only Audit)

Files inspected: `src/services/http.ts`, `src/mocks/handlers/tasks.ts`, `src/schemas/task.ts`, `src/schemas/department.ts`, `src/features/tasks/api/queries.ts`, `src/features/tasks/api/departments.ts`.

| Area | Current Implementation in `src/` | Legacy Backend Reality (`[OBSERVED]`) | Fidelity Gap |
|---|---|---|---|
| **Auth headers** | `http.ts:L25-L28` returns `{}`; `Content-Type: application/json` always forced (`L35`) | Must send `username: encodeURIComponent(u)` + `x-session-token`; **must NOT set `Content-Type`** when `body instanceof FormData` | High — breaks auth and multipart uploads |
| **401 handling** | Throws `ApiError { status: 401 }` (`http.ts:L41-L43`) | Attempts `POST /api/session/resume` once if remember-token exists, else clears session & redirects | High — no auto-resume or session verify/heartbeat |
| **`GET /api/tasks`** | Sends `?scope&search&fromDate&toDate&department&status&page&pageSize`; expects `{ items, total, counts }` (`queries.ts:L20-L45`, `tasks.ts:L12-L110`) | No query params; returns **bare `Task[]`** of all visible tasks; filtering, scope tabs, counts, and pagination are **100% client-side** | **Critical** — incompatible contract |
| **`GET /api/tasks/:id`** | `useTask(id)` calls `GET /api/tasks/:id` (`queries.ts:L47-L53`) | **Endpoint not observed in legacy**; detail reads from `GET /api/tasks` cache + fetches `GET /api/tasks/:id/reports` | High — verify via probe if `GET /api/tasks/:id` even exists |
| **`Task` schema** | `id: "NV-2026-0891"`, `department: "it"`, single `assignee`, `status` enum (`new\|draft\|in_progress\|pending\|approved\|done\|overdue\|rejected`), `urgent?: boolean`, `checklist`, `timeline`, `comments` (`src/schemas/task.ts:L3-L71`) | Numeric `id`, Traditional Chinese `assigned_unit`/`req_dept`/`req_depts`, CSV `assign_person` + `split_group`/`split_members`, **derived** status (`progress` 0-100 + `due_date` + `finish_date` + `paused`), `confidential` 0-3, `readers`, `cross_viewers`, `recur_*`, `work_items`, `type_detail`, `site` CSV, JSON `attachments` | **Critical** — complete schema mismatch |
| **`POST /api/tasks`** | Sends JSON `{ title, description, department, assignee, dueDate, priority }`, returns `Task` (`201`) (`queries.ts:L63-L76`, `tasks.ts:L140-L186`) | Sends **`FormData`** (30+ fields + `files`), returns `{ success, id, split_ids?, unit_synced?, ... }` (`200`); error `code: 'DUP_TITLE_DUE'` | **Critical** — JSON vs FormData & response envelope |
| **Approval & Reassign endpoints** | `POST /api/tasks/:id/approve`, `POST /api/tasks/:id/reject`, `PATCH /api/tasks/:id/reassign` (`queries.ts:L78-L124`, `tasks.ts:L188-L284`) | **Do NOT exist in legacy.** Re-dispatch is `POST /api/tasks` with `clone_from`; edit is `PUT /api/tasks/:id`; progress/pause is `POST /api/tasks/:id/reports` | **Critical** — non-existent endpoints |
| **Departments** | `GET /api/departments` returning `[{ id, name, members }]` (`departments.ts:L9`, `department.ts:L3-L7`) | `GET /api/meta/depts` returning `{ depts: [{ value, zh, vn, source, ou_dn }], allDepts }` + `GET /api/users/directory` for members | High — wrong path & shape |
| **Missing MSW handlers** | Only `/api/tasks*` and `/api/departments` exist | Missing: auth/session (`login`, `register`, `verify`, `resume`, `heartbeat`, `logout`, `update-password`), `tasks/:id/reports`, `reports/:id`, `tasks/dup-check`, `tasks/history/mine`, `users/directory`, `meta/sites`, `meta/depts`, `pocket/*`, `lessons` (`{ list }`), `todos`, `messages`, `work-records`, `i18n/overrides` | High |

### H.2 MSW Fidelity Plan (What Handlers Must Reproduce)

To act as a faithful drop-in stand-in for `Dispatch.js`, the next MSW layer must:
1. **Enforce auth headers**: Check `username` + `x-session-token` on protected endpoints; return `401 { success: false, message }` when missing/expired (plus support `POST /api/session/resume` and `GET /api/session/verify`).
2. **Return bare arrays vs envelopes accurately**:
   - Bare arrays: `GET /api/tasks`, `GET /api/tasks/:id/reports`, `GET /api/users/directory`, `GET /api/messages`, `GET /api/work-records`, `GET /api/pocket/*`.
   - Envelopes: `GET /api/lessons` → `{ list }`; `GET /api/meta/sites` → `{ sites, allSites, otherValue }`; `GET /api/meta/depts` → `{ depts, allDepts }`; `GET /api/tasks/history/mine` → `{ items }`; `GET /api/todos` → `{ task_data }`; `GET /api/i18n/overrides` → `{ success, version, items }`.
3. **Handle `FormData` (`request.formData()`)** on `POST /api/tasks`, `PUT /api/tasks/:id`, and `POST /api/tasks/:id/reports` (including multi-file `files`, `retainedFiles`, `cloneFiles`, `status='paused'`, `pause_reason`, `work_topics`, `target_id`).
4. **Reproduce key backend behaviors**:
   - Encoded string fields (`assign_person` CSV, `site` CSV, `req_depts` pipe list, `attachments` JSON string, `split_members` `id|assignee|progress|paused|finish;...`, `work_items` JSON, `confidential` 0–3).
   - Multi-assignee auto-split (`>= 2` assignees → creates `N` rows with shared `split_group` and `split_members`).
   - Duplicate title + due date rejection (`409` or `400` with `{ success: false, code: 'DUP_TITLE_DUE', message }`) + `GET /api/tasks/dup-check`.
   - Confidentiality filtering in `GET /api/tasks` by logged-in mock user's role (`0`–`3`, `readers`, `cross_viewers`).
   - `100%` progress report setting `finish_date` and `closed: true` (or `cycle_done: true` for recurring).
5. **Keep client-side filtering/pagination in the app**: MSW `GET /api/tasks` returns the full visible array so the frontend is tested under the exact same client-side filtering/pagination path it will use in production.
