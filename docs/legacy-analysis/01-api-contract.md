# 01 — API Contract (Inferred from Frontend Callers)

> **Scope**: Every `apiFetch` / `fetch` / `apiJSON` call observed in `docs/legacy/Dispatch-utils.js` (V16.11.0, `DU_BUILD = 16.11.0-r20`) and `docs/legacy/Dispatch.html`. Backend source (`Dispatch.js`) is **NOT** available; every backend claim is tagged `[OBSERVED]`, `[INFERRED]`, `[COMMENT]`, or `[UNKNOWN]`.
>
> **Release tag**: `FR` = likely needed for first release (session, tasks, reports, directory/meta, lessons read, todos, messages, work-records); `REPORT-TOOL` = web/PDF/Excel/KPI report tools; `ADMIN` = user/site/archive/menu-perm admin; `AD` = Active Directory integration.

---

## 1. Transport, Auth Headers, and `apiFetch` Behavior

| Aspect | Behavior | Evidence | Tag |
|---|---|---|---|
| Base URL | `API = window.location.origin` (same-origin) | `Dispatch-utils.js:L521` | `[OBSERVED]` |
| Auth headers | `authHeaders()` attaches `username: encodeURIComponent(uname)` and `x-session-token: s.token` from `sessionStorage['dispatch_session_v15']` | `Dispatch-utils.js:L719-L726` | `[OBSERVED]` |
| FormData Content-Type | `apiFetch` deletes `Content-Type` header when `body instanceof FormData` so browser sets multipart boundary | `Dispatch-utils.js:L776` | `[OBSERVED]` |
| GET/HEAD timeout & retry | `DU_fetchResilient`: 45 s timeout (`DU_FETCH_TIMEOUT_MS = 45000`), 1 auto-retry after 800 ms on network/timeout error for `GET`/`HEAD` only (`POST`/`PUT`/`DELETE` have no timeout and no retry) | `Dispatch-utils.js:L733-L752` | `[OBSERVED]` |
| 401 auto-resume | On HTTP 401, if `!options.__resumed`, `DU_Remember.get()` exists, and `!DU_loggingOut`: calls `DU_resumeSession()` (`POST /api/session/resume`) and retries the request once (`__resumed: true`) | `Dispatch-utils.js:L780-L783` | `[OBSERVED]` |
| 401 force logout | If still 401 (or no remember token): calls `DU_forceLogout(...)` (clears sessionStorage, redirects to `DU_MAIN_PAGE` after 1200 ms) and throws `Error('UNAUTHORIZED')` | `Dispatch-utils.js:L784-L787, L904-L911` | `[OBSERVED]` |
| `apiJSON` wrapper | `Dispatch.html` wraps `apiFetch` for admin endpoints, parses JSON safely, returns `{ ok, status, data }`. `apiFailMessage` maps 404/405/501 to `BACKEND_OUTDATED_MSG` and 403 to `r.data.message \|\| '权限不足'` | `Dispatch.html:L3761-L3778` | `[OBSERVED]` |
| Unauthenticated `fetch` | `POST /api/login`, `POST /api/register`, `POST /api/session/resume`, `GET /api/i18n/overrides`, `GET /api/meta/sites`, `GET /api/meta/depts` use raw `fetch` without `authHeaders` | `Dispatch-utils.js:L693, L8552, L8820, L9939`; `Dispatch.html:L1869, L1908` | `[OBSERVED]` |

---

## 2. Endpoint Inventory by Domain

### 2.1 Auth, Session & Personal Security

| Method & Path | Query / Body | Auth | Response Consumed | Error Handling | Caller & Lines | Release |
|---|---|---|---|---|---|---|
| `POST /api/login` | JSON: `{ username, password, remember: boolean }` | None | `{ success, user, token, remember_token?, remember_days?, message? }` `[OBSERVED]` | `data.message \|\| "账号或密码错误..."` | `handleLogin` (`Dispatch.html:L1869-L1886`) | `FR` |
| `POST /api/register` | JSON: `{ username, password, fullname, dept, site, site_other? }` | None | `{ success, message? }` `[OBSERVED]` | `data.message \|\| "申请失败..."` | `handleRegister` (`Dispatch.html:L1908-L1922`) | `FR` |
| `GET /api/session/verify` | None (`cache: 'no-store'`) | `authHeaders` | `{ success, user }` `[OBSERVED]` | 401/403 → try `DU_resumeSession()` else `invalid`; 5xx/network → `offline` (keeps local session) | `DU_verifySessionStrict` (`Dispatch-utils.js:L805-L824`); `Dispatch.html:L1755` | `FR` |
| `POST /api/session/resume` | JSON: `{ username, remember_token }` (`cache: 'no-store'`) | None | `{ success, user, token, remember_days?, message? }` `[OBSERVED]` | 401/403 → clears `DU_Remember`, returns `invalid`; 429/5xx/404/network → `offline` (keeps token) | `DU_resumeSession` (`Dispatch-utils.js:L693-L711`) | `FR` |
| `POST /api/session/heartbeat` | None | `authHeaders` | Ignored on 2xx `[OBSERVED]` (`{ success }` `[COMMENT]` L485) | 401 → tries `DU_resumeSession()`, if still invalid calls `DU_forceLogout`; network error ignored | `startHeartbeat` (`Dispatch-utils.js:L838-L845`) | `FR` |
| `POST /api/logout` | JSON: `{ all: boolean, remember_token: string }` (`keepalive: true`) | `authHeaders` | Ignored `[OBSERVED]` (`{ success }` `[COMMENT]` L486) | Swallows network errors, clears local session anyway | `logoutSystem` (`Dispatch-utils.js:L880-L887`) | `FR` |
| `POST /api/users/update-password` | JSON: `{ username, oldPassword, newPassword }` | `apiFetch` | `{ success, message? }` `[OBSERVED]` | `data.message \|\| "修改失败..."`; on success logs out after 1.5 s | `updatePassword` (`Dispatch.html:L5965-L5978`) | `FR` |

### 2.2 Tasks & Task Helpers

| Method & Path | Query / Body | Auth | Response Consumed | Error Handling | Caller & Lines | Release |
|---|---|---|---|---|---|---|
| `GET /api/tasks` | None (returns **full** visible task list, no pagination/filter params) | `apiFetch` | `Task[]` (bare JSON array) `[OBSERVED]` | `!res.ok` throws `HTTP <status>`; shows sync error toast | `refreshData` (`Dispatch.html:L2017-L2020`) | `FR` |
| `POST /api/tasks` | `FormData`: `title`, `confidential` (`0`-`3`), `readers?` (CSV), `cross_dept?` (`0`/`1`), `cross_viewers?` (CSV), `content`, `site` (CSV), `site_other?`, `site_other_code?`, `level`, `req_dept`, `req_depts` (JSON array), `req_dept_custom` (JSON array), `req_contact`, `task_type`, `task_type_is_custom` (`0`/`1`), `install_req`, `type_detail` (JSON), `work_items` (JSON), `cost_estimate`, `precautions`, `risk_status`, `assigned_unit`, `assign_person` (CSV), `due_date`, `recur_type`, `recur_weekdays`, `recur_monthdays`, `recur_time`, `recur_end`, `km_link`, `reporter`, `clone_from?`, `cloneFiles?` (JSON), `files` (repeated `File`) | `apiFetch` | `{ success, id?, recur_cycle_date?, unit_synced?, assigned_unit?, unit_person?, cross_unknown?: string[], readers_unknown?: string[], site_created?: { label }, split_created?, split_group?, code?, message?, err? }` `[OBSERVED]` | `data.code === 'DUP_TITLE_DUE'` triggers `DU_dupCheckLive()`; toast `data.message \|\| data.err` | `submitTaskForm` (`Dispatch-utils.js:L4896-L4977`) | `FR` |
| `PUT /api/tasks/:id` | Same `FormData` as `POST /api/tasks`, plus `retainedFiles` (JSON array of kept attachment objects), without `clone_from`/`cloneFiles` | `apiFetch` | Same `{ success, ... }` envelope as `POST /api/tasks` `[OBSERVED]` | Same (`DUP_TITLE_DUE`, `data.message \|\| data.err`) | `submitTaskForm` (`Dispatch-utils.js:L4896-L4977`) | `FR` |
| `DELETE /api/tasks/:id` | None | `apiFetch` | `{ success, message?, code?, err? }` `[OBSERVED]` | `res.status === 404` → toast + `DU_afterDataChange()`; other error appends `(${data.code}: ${data.err})` | `DU_deleteTask` (`Dispatch-utils.js:L8906-L8918`) | `FR` |
| `GET /api/tasks/history/mine` | `?limit=500` | `apiFetch` | `{ items: Task[] }` `[OBSERVED]` | On failure/404 falls back to filtering local `allTasks` by `reporter === currentUser.username` | `DU_cloneLoad` (`Dispatch-utils.js:L4538-L4544`) | `FR` |
| `GET /api/tasks/dup-check` | `?title=<str>&due=<YYYY-MM-DD>&exclude=<id?>` | `apiFetch` | `{ success?, duplicate: boolean, id?, title?, due_date?, visible? }` `[OBSERVED]` | On error falls back to local `allTasks` check | `DU_dupCheck` (`Dispatch-utils.js:L4677-L4685`) | `FR` |
| `POST /api/tasks/:id/ai-generate-report` | JSON: `{ currentProgress: string }` | `apiFetch` | `{ success, text, message? }` `[OBSERVED]` | `data.message \|\| "AI 生成失败"` | `generateAIReport` (`Dispatch-utils.js:L2154-L2166`) | `FR` (optional) |

> **Note on Pause / Resume**: There is **NO** separate `/api/tasks/:id/pause` endpoint `[OBSERVED]`. Pausing and resuming a task is performed by posting a dynamic report (`POST /api/tasks/:id/reports`) with `status = 'paused'` (or `'active'` / non-paused) and optional `pause_reason` (`Dispatch-utils.js:L2059-L2095`).

### 2.3 Task Reports (动态回报)

| Method & Path | Query / Body | Auth | Response Consumed | Error Handling | Caller & Lines | Release |
|---|---|---|---|---|---|---|
| `GET /api/tasks/:id/reports` | None | `apiFetch` | `Report[]` (bare JSON array) `[OBSERVED]` | Fallback to `[]`; shows error toast | `viewTaskDetail` (`Dispatch-utils.js:L1826`), `DU_detailRefreshFeed` (`L10602`), PDF/WebReport builders (`L5373`, `L7275`) | `FR` |
| `POST /api/tasks/:id/reports` | `FormData`: `username`, `fullname`, `content`, `progress` (`0`-`100`), `km_link`, `status?` (`paused` / active), `work_topics?` (JSON `[{id, progress}]`), `target_id?` (split group member task id), `pause_reason?`, `files` (repeated `File`) | `apiFetch` | `{ success, closed?: boolean, cycle_done?: boolean, task_id?: number, work_topics?, message? }` `[OBSERVED]` | `res.ok && data.success !== false`; else `data.message` | `submitReport` (`Dispatch-utils.js:L2079-L2115`) | `FR` |
| `PUT /api/reports/:reportId` | JSON: `{ content }` | `apiFetch` | `{ success, message? }` `[OBSERVED]` | `data.message \|\| "修改失败"` | `editReportPrompt` (`Dispatch-utils.js:L2127-L2139`) | `FR` |
| `DELETE /api/reports/:reportId/attachments` | `?path=<encodedPath>` | `apiFetch` | `{ success, attachments?: Attachment[], message? }` `[OBSERVED]` | `data.message \|\| "删除附件失败 (HTTP ...)"` | `DU_deleteReportAttachment` (`Dispatch-utils.js:L10777-L10783`) | `FR` |

### 2.4 Directory, Metadata & Pockets

| Method & Path | Query / Body | Auth | Response Consumed | Error Handling | Caller & Lines | Release |
|---|---|---|---|---|---|---|
| `GET /api/users/directory` | None | `apiFetch` | `DirectoryUser[]` (`[{ username, fullname, dept, site, ... }]`) `[OBSERVED]` | Fallback to `[]` | `DU_loadDirectory` (`Dispatch-utils.js:L1787`); `loadUserDirectory` (`Dispatch.html:L1981`) | `FR` |
| `GET /api/meta/sites` | None (`cache: 'no-store'`) | None | `{ sites: Site[], allSites?: Site[], otherValue?: '__OTHER__' }` `[OBSERVED]` | Offline fallback to built-in `DU_SITES` | `DU_loadSiteCatalog` (`Dispatch-utils.js:L8820-L8832`) | `FR` |
| `GET /api/meta/depts` | None (`cache: 'no-store'`) | None | `{ depts: Dept[], allDepts?: Dept[] }` `[OBSERVED]` | Offline fallback to built-in `DU_DEPTS` | `DU_loadDeptCatalog` (`Dispatch-utils.js:L9939-L9953`) | `FR` |
| `GET /api/pocket/task-types` | None | `apiFetch` | `[{ id, value }]` (bare array) `[OBSERVED]` | Fallback to `[]` | `DU_loadPocket` (`Dispatch-utils.js:L2185`) | `FR` |
| `POST /api/pocket/task-types` | JSON: `{ value }` | `apiFetch` | `{ success, id }` `[COMMENT]` L490; FE only checks `res.ok` | Swallowed (non-blocking) | `DU_savePocketValue` (`Dispatch-utils.js:L2270-L2279`) | `FR` |
| `DELETE /api/pocket/task-types/:id` | None | `apiFetch` | `{ success, message? }` `[OBSERVED]` | `data.message \|\| "删除失败"` | `deletePocketItem` (`Dispatch-utils.js:L2246-L2258`) | `FR` |
| `GET /api/pocket/type-detail` | None | `apiFetch` | `[{ id, kind, value }]` (bare array) `[OBSERVED]` | Fallback to `[]` | `DU_tfLoadPocket` (`Dispatch-utils.js:L3737`) | `FR` |
| `DELETE /api/pocket/type-detail/:id` | None | `apiFetch` | `{ success, message? }` `[OBSERVED]` | `data.message \|\| "删除失败"` | `DU_tfDeletePocket` (`Dispatch-utils.js:L3771`) | `FR` |
| `GET /api/pocket/req-dept` | None | `apiFetch` | `[{ id, value }]` (bare array) `[OBSERVED]` | Fallback to `[]` | `DU_rdLoadPocket` (`Dispatch-utils.js:L4065`) | `FR` |
| `POST /api/pocket/req-dept` | JSON: `{ value }` | `apiFetch` | `{ success, value?, message? }` `[OBSERVED]` | Toast `data.message`, still keeps local selection | `DU_rdAddOther` (`Dispatch-utils.js:L4084-L4087`) | `FR` |
| `DELETE /api/pocket/req-dept/:id` | None | `apiFetch` | `{ success, message? }` `[OBSERVED]` | `data.message \|\| "删除失败"` | `DU_rdDeletePocket` (`Dispatch-utils.js:L4106`) | `FR` |
| `GET /api/pocket/contacts` | None | `apiFetch` | `[{ id, contact, fullname?, dept?, source?, status? }]` (bare array) `[OBSERVED]` | Fallback to `[]` | `DU_loadContactPocket` (`Dispatch-utils.js:L9759`) | `FR` |
| `POST /api/pocket/contacts` | JSON: `{ contact: string }` | `apiFetch` | `{ success, username, fullname?, dept?, source?, self?, message? }` `[OBSERVED]` | `DU_zhS(data.message \|\| '找不到此人员')` | `DU_contactVerify` (`Dispatch-utils.js:L9856-L9871`) | `FR` |
| `DELETE /api/pocket/contacts/:id` | None | `apiFetch` | `{ success, message? }` `[OBSERVED]` | `DU_zhS(data.message \|\| '删除失败')` | `DU_contactPocketDelete` (`Dispatch-utils.js:L9922`) | `FR` |
| `GET /api/contacts/resolve` | *Comment-only* (`L342`, `L9750`); **not called** in either file | — | `[UNKNOWN]` | — | Comment only (`Dispatch-utils.js:L342, L9750`) | `FR` (unused) |

### 2.5 Lessons, Todos, Messages, Work-Records & i18n

| Method & Path | Query / Body | Auth | Response Consumed | Error Handling | Caller & Lines | Release |
|---|---|---|---|---|---|---|
| `GET /api/lessons` | None | `apiFetch` | `{ list: Lesson[] }` (**envelope `{ list }`, NOT bare array**) `[OBSERVED]` | `!res.ok` (e.g. 404) silently retains cache for 60 s | `DU_loadLessons` (`Dispatch-utils.js:L8961-L8965`) | `FR` |
| `GET /api/todos` | `?date=YYYY-MM-DD` | `apiFetch` | `{ task_data: [{ id, start_time }] }` `[OBSERVED]` | Fallback `{ task_data: [] }` | `loadTodosForDate` (`Dispatch.html:L3162`), dashboard today check (`L2407`) | `FR` |
| `POST /api/todos` | JSON: `{ date: YYYY-MM-DD, task_data: [{ id, start_time }] }` | `apiFetch` | Checks `res.ok` only `[OBSERVED]` | Generic error toast | `saveTodos` (`Dispatch.html:L3510-L3522`) | `FR` |
| `GET /api/messages` | None | `apiFetch` | `Message[]` (bare array; each has `replies[]`) `[OBSERVED]` | Error toast | `fetchMessages` (`Dispatch.html:L5840-L5842`) | `FR` |
| `POST /api/messages` | JSON: `{ username, fullname, content }` | `apiFetch` | Checks `res.ok` only `[OBSERVED]` | Generic error toast | `postMessage` (`Dispatch.html:L5885-L5891`) | `FR` |
| `POST /api/messages/:msgId/replies` | JSON: `{ username, fullname, content }` | `apiFetch` | Checks `res.ok` only `[OBSERVED]` | Generic error toast | `postReply` (`Dispatch.html:L5903-L5909`) | `FR` |
| `GET /api/work-records` | `?user=<username\|ALL>&start=YYYY-MM-DD&end=YYYY-MM-DD` | `apiFetch` | `WorkRecord[]` (bare array of report rows) `[OBSERVED]` | Fallback `[]` | `fetchAndRenderWorkRecords` (`Dispatch.html:L3618-L3620`) | `FR` |
| `GET /api/i18n/overrides` | None (`cache: 'no-store'`) | None | `{ success, version, items }` `[OBSERVED]` | Silent `false` on error | `DU_loadI18nOverrides` (`Dispatch-utils.js:L8552-L8558`) | `OPEN` |

### 2.6 Reporting & WebReports Tools

| Method & Path | Query / Body | Auth | Response Consumed | Error Handling | Caller & Lines | Release |
|---|---|---|---|---|---|---|
| `GET /api/reports/tasks` | `?purpose=pdf\|progress\|efficiency\|kpi&start=YYYY-MM-DD&end=YYYY-MM-DD&include_cycles=1?&basis=final\|...?` | `apiFetch` | `Task[]` (bare array, includes `all_reports` `[COMMENT]` L493) `[OBSERVED]` | On failure falls back to `DU_localScope(purpose)` on `allTasks` | `DU_fetchReportTasks` (`Dispatch-utils.js:L5036-L5045`) | `REPORT-TOOL` |
| `POST /api/reports/office-files` | JSON: `{ ids: number[], purpose: string }` | `apiFetch` | `{ success, items: [{ task_id, source, name, path, size }], message? }` `[OBSERVED]` | Fallback to task-level `t.attachments` | `DU_wrCollectOffice` (`Dispatch-utils.js:L8044-L8056`) | `REPORT-TOOL` |
| `GET <attachment.path>` | Static file fetch (`credentials: 'same-origin'`) | Cookie/same-origin | Binary `ArrayBuffer` for docx/xlsx preview `[OBSERVED]` | Per-file error message | `DU_wrFetchOffice` (`Dispatch-utils.js:L8009`) | `REPORT-TOOL` |
| `GET /api/webreports` | None | `apiFetch` | `{ success, items: WebReport[], message? }` `[OBSERVED]` | Error message in archive box | `openWebReportArchive` (`Dispatch-utils.js:L7789-L7792`) | `REPORT-TOOL` |
| `POST /api/webreports` | JSON: `{ title, lang, file_base, html, subject, subject_label, range_start, range_end, total, report_no, ... }` | `apiFetch` | `{ success, message? }` `[OBSERVED]` | `data.message \|\| "保存失败"` | `DU_wrSaveServer` (`Dispatch-utils.js:L7696-L7705`) | `REPORT-TOOL` |
| `GET /api/webreports/:id` | None | `apiFetch` | Raw HTML text (`res.text()`) `[OBSERVED]` | On `!res.ok`, parses JSON `d.message` | `DU_wrOpenArchived` (`Dispatch-utils.js:L7823`), `DU_wrArchivedAs` (`L8294`) | `REPORT-TOOL` |
| `DELETE /api/webreports/:id` | None | `apiFetch` | `{ success, message? }` `[OBSERVED]` | `d.message \|\| "删除失败"` | `DU_wrDeleteArchived` (`Dispatch-utils.js:L7847`) | `REPORT-TOOL` |

### 2.7 Admin: Users, Menu Permissions, Sites & Archive

| Method & Path | Query / Body | Auth | Response Consumed | Error Handling | Caller & Lines | Release |
|---|---|---|---|---|---|---|
| `GET /api/admin/users` | None | `apiFetch` | `AdminUser[]` (bare array) `[OBSERVED]` | `apiFailMessage` | `openAccountReview` (`Dispatch.html:L3783`), `openWorkRecordsModal` (`L3538`), `doAdImport` (`L5242`) | `ADMIN` |
| `POST /api/admin/users` | JSON: `{ username, password, fullname, dept, site, role, status, site_other?, site_other_code?, dept_source?, dept_ou_dn?, dept_other?, dept_other_vn? }` | `apiFetch` | `{ success, site_created?, message? }` `[OBSERVED]` | `apiFailMessage` | `saveAccountEditor` (`Dispatch.html:L4858`) | `ADMIN` |
| `PUT /api/admin/users/:id` | JSON: partial `{ username?, fullname?, dept?, site?, role?, status?, site_other?, site_other_code?, dept_source?, dept_ou_dn?, dept_other?, dept_other_vn? }` | `apiFetch` | `{ success, site_created?, message? }` `[OBSERVED]` | `apiFailMessage` | `saveAccountEditor` (`Dispatch.html:L4876`), `updateUser` (`L5553`) | `ADMIN` |
| `PUT /api/admin/users/:id/password` | JSON: `{ newPassword }` | `apiFetch` | `{ success, message? }` `[OBSERVED]` | `apiFailMessage` | `saveAccountEditor` (`Dispatch.html:L4881`), `adminResetPassword` (`L5582`) | `ADMIN` |
| `DELETE /api/admin/users/:id` | None | `apiFetch` | `{ success, message? }` `[OBSERVED]` | `apiFailMessage` | `deleteAccount` (`Dispatch.html:L5501`) | `ADMIN` |
| `POST /api/admin/users/:id/force-logout` | None | `apiFetch` | `{ success, message? }` `[OBSERVED]` | `apiFailMessage` | `adminForceLogout` (`Dispatch.html:L5602`) | `ADMIN` |
| `POST /api/admin/users/batch` | JSON: `{ ids: number[], changes: { dept?, site?, site_other?, site_other_code?, role?, status? } }` | `apiFetch` | `{ success, updated, results?: [{ id, username, ok, message? }], site_created?, message? }` `[OBSERVED]` | `apiFailMessage`; lists failed items | `applyBatchAccountUpdate` (`Dispatch.html:L4158`) | `ADMIN` |
| `GET /api/admin/users/name-check` | `?fullname=<str>&except=<id>` | `apiFetch` | `{ success, taken: boolean, user?: { username } }` `[OBSERVED]` | Silent fallback to local list | `checkFullnameDup` (`Dispatch.html:L4793`) | `ADMIN` |
| `POST /api/admin/users/:id/auth-source` | JSON: `{ auth_source: 'ad', ad_sam, use_ad_username }` OR `{ auth_source: 'local', password, enable }` | `apiFetch` | `{ success, conflict?, existing?: { id, username }, message? }` `[OBSERVED]` | On `conflict`, offers merge flow | `doAcctConvert` (`Dispatch.html:L4564-L4573`) | `ADMIN` / `AD` |
| `GET /api/admin/users/:id/merge-preview` | `?from=<username>` | `apiFetch` | `{ success, from: { username, auth_source }, to: { username }, counts: object, message? }` `[OBSERVED]` | `apiFailMessage` | `acctMergePreview` (`Dispatch.html:L4595`) | `ADMIN` |
| `POST /api/admin/users/:id/merge` | JSON: `{ from: string, disable_source: boolean }` | `apiFetch` | `{ success, counts: object, message? }` `[OBSERVED]` | `apiFailMessage` | `runAcctMerge` (`Dispatch.html:L4628`) | `ADMIN` |
| `PUT /api/admin/users/menu-perms` | JSON: `{ ids: number[], perms: Record<string, string> \| null }` (`null` = reset to all `srw`) | `apiFetch` | `{ success, message? }` `[OBSERVED]` | `404` → "后端尚未更新为 V16.11.0-r11"; else `d.message` | `DU_permEditorSave` (`Dispatch-utils.js:L11445-L11452`) | `ADMIN` |
| `GET /api/admin/sites` | None | `apiFetch` | `{ success, sites: AdminSite[], message? }` `[OBSERVED]` | `apiFailMessage` | `loadSiteAdminList` (`Dispatch.html:L5414`) | `ADMIN` |
| `POST /api/admin/sites` | JSON: `{ name, vn, code }` | `apiFetch` | `{ success, site: { label, ... }, message? }` `[OBSERVED]` | `apiFailMessage` | `createSite` (`Dispatch.html:L5464`) | `ADMIN` |
| `PUT /api/admin/sites/:code` | JSON: `{ name, vn, active? }` | `apiFetch` | `{ success, message? }` `[OBSERVED]` | `apiFailMessage` | `saveSite` (`Dispatch.html:L5482`) | `ADMIN` |
| `GET /api/admin/archive/info` | None | `apiFetch` | `{ defaultPath, uploadsDir, dbPath, history: [{ name, path, sizeBytes, createdAt, counts, downloadUrl? }] }` `[OBSERVED]` | Ignored on error | `openArchiveModal` (`Dispatch.html:L5639`), `runArchive` (`L5792`) | `ADMIN` |
| `POST /api/admin/archive` | JSON: `{ targetPath, format: 'zip'\|'folder', from?, to?, include: { messages, todos, users } }` | `apiFetch` | `{ success, path, name, sizeBytes, counts: { tasks, reports, messages, todos, files, missing }, downloadUrl? }` `[OBSERVED]` | `apiFailMessage` | `runArchive` (`Dispatch.html:L5767-L5802`) | `ADMIN` |
| `GET <downloadUrl>` (archive) | Dynamic URL returned by `/api/admin/archive` or `/info` | `apiFetch` | Binary `Blob` `[OBSERVED]` | 404 → "文件不存在或已移除" | `downloadArchive` (`Dispatch.html:L5820`) | `ADMIN` |

### 2.8 Admin: Active Directory (AD)

| Method & Path | Query / Body | Auth | Response Consumed | Error Handling | Caller & Lines | Release |
|---|---|---|---|---|---|---|
| `GET /api/admin/ad/status` | None | `apiFetch` | `{ available, installed, syncing, message?, config?: { domain, url, syncMinutes }, localAdAccounts?: { total, disabled }, lastSync?: { at, ok, message }, nextSyncAt? }` `[OBSERVED]` | 404 → `BACKEND_OUTDATED_MSG` | `loadAdStatus` (`Dispatch.html:L5261-L5292`) | `AD` |
| `GET /api/admin/ad/users` | `?disabled=1&refresh=1?` | `apiFetch` | `{ success, users: AdUser[], message? }` `[OBSERVED]` | `apiFailMessage` | `loadAdList` (`Dispatch.html:L4937`) | `AD` |
| `GET /api/admin/ad/users/:sam` | None | `apiFetch` | `{ success, user: AdUserFull, message? }` `[OBSERVED]` | `apiFailMessage` | `chooseAdAccount` (`Dispatch.html:L5008`), `showAdDetailFor` (`L5053`) | `AD` |
| `GET /api/admin/ad/ous` | `?refresh=1?` | `apiFetch` | `{ success, ous: [{ dn, name, ... }], message? }` `[OBSERVED]` | `apiFailMessage` | `loadAcctOus` (`Dispatch.html:L4705`) | `AD` |
| `POST /api/admin/ad/import` | JSON: `{ accounts: string[], dept, auto_dept?, auto_ou?, site, site_other?, site_other_code?, role, status, link_existing, overrides?, dept_source?, dept_ou_dn? }` | `apiFetch` | `{ success, created, linked, failed, results?: [{ ok, username, linked?, message? }], site_created?, message? }` `[OBSERVED]` | `apiFailMessage` | `saveAccountEditor` (`Dispatch.html:L4850`), `doAdImport` (`L5236`) | `AD` |
| `POST /api/admin/ad/sync` | JSON: `{}` | `apiFetch` | `{ success, message? }` `[OBSERVED]` | `zhS(r.data.message)` | `runAdSyncNow` (`Dispatch.html:L5302`) | `AD` |
| `GET /api/admin/ad/sync/logs` | None | `apiFetch` | `{ success, logs: [{ createdAt, trigger, ok, ad_total, checked, disabled, deleted, restored, message, details?: [{ username, action }] }] }` `[OBSERVED]` | `apiFailMessage` | `showAdSyncLogs` (`Dispatch.html:L5376-L5393`) | `AD` |
| `GET /api/admin/ad/diagnose` | None | `apiFetch` | `{ success, result: { domain, baseDN, bindUser, passwordSet, durationMs, goodUrl, dns: { srv, a, lookup, errors }, tests: [{ url, tcp, bind, search }], hints: string[] } }` `[OBSERVED]` | 404 → `BACKEND_OUTDATED_MSG` | `runAdDiagnose` (`Dispatch.html:L5319-L5360`) | `AD` |

---

## 3. Deviations Between Comment-Declared Contracts and Actual Calls

1. **`GET /api/contacts/resolve`** — declared in comments (`Dispatch-utils.js:L342, L9750`), **never called** in code; contact resolution is actually done via `POST /api/pocket/contacts` (`L9856`).
2. **`POST /api/tasks` & `PUT /api/tasks/:id`** — header comment (`Dispatch-utils.js:L496`) mentions only `site` and `confidential = 0|1`; actual `FormData` sends 30+ fields including `confidential` `0`-`3`, `readers`, `cross_dept`, `cross_viewers`, `req_depts`, `type_detail`, `work_items`, `recur_*`, `clone_from`, `cloneFiles` (`L4896-L4944`).
3. **`POST /api/logout`** — header comment (`Dispatch-utils.js:L486`) lists `{ all }`; actual call sends `{ all, remember_token }` (`L883`).
4. **Admin user endpoints** — `Dispatch.html:L1033-L1055` omits `/api/admin/users/:id/auth-source`, `/merge-preview`, `/merge`, `/name-check`, `/api/admin/users/menu-perms`, and `/api/admin/ad/ous` (added in later revisions V15.9–V16.11).
5. **No `GET /api/tasks/:id`** — observed callers **never** fetch a single task by ID; `viewTaskDetail(id)` looks up the task in the in-memory `allTasks` array from `GET /api/tasks` and only fetches `/api/tasks/:id/reports` (`Dispatch-utils.js:L1818-L1826`).

---

## 4. Contract-Confidence Table

Legend: **High** = `[OBSERVED]` full request/response shape in code; **Med** = partial `[OBSERVED]` + `[INFERRED]` (e.g. extra response fields or error codes may exist on backend); **Low** = `[COMMENT]` / `[UNKNOWN]` (not called or response body unchecked).

| Endpoint | Request Confidence | Response Confidence | Notes |
|---|---|---|---|
| `POST /api/login` | High | High | Exact `user` fields vary by AD/local; verify via probe |
| `POST /api/register` | High | Med | Only `success`/`message` read |
| `GET /api/session/verify` | High | High | Exact `user` shape (incl. `menu_perms`) to confirm |
| `POST /api/session/resume` | High | High | Exact `remember_days` type to confirm |
| `POST /api/session/heartbeat` | High | Low | 2xx body not read in FE |
| `POST /api/logout` | High | Low | Response body not read in FE |
| `POST /api/users/update-password` | High | Med | Only `success`/`message` read |
| `GET /api/tasks` | High | Med | Bare array; full column list in DB `[UNKNOWN]` — probe needed |
| `POST / PUT /api/tasks(/:id)` | High | Med | All 30+ FormData fields observed; error codes beyond `DUP_TITLE_DUE` `[UNKNOWN]` |
| `DELETE /api/tasks/:id` | High | Med | Soft-delete vs recycle record `[COMMENT]` L8901 |
| `GET /api/tasks/history/mine` | High | Med | `{ items }` envelope observed |
| `GET /api/tasks/dup-check` | High | Med | `{ success, duplicate, id, title, due_date, visible }` |
| `GET /api/tasks/:id/reports` | High | Med | Bare array; full report columns to confirm via probe |
| `POST /api/tasks/:id/reports` | High | Med | Also handles pause/resume via `status` + `pause_reason` |
| `PUT /api/reports/:id` | High | Med | Only `content` sent |
| `DELETE /api/reports/:id/attachments` | High | Med | Returns updated `attachments` array |
| `POST /api/tasks/:id/ai-generate-report` | High | Med | `{ success, text }` |
| `GET /api/users/directory` | High | Med | Bare array; verify exact fields via probe |
| `GET /api/meta/sites` | High | High | `{ sites, allSites, otherValue }` |
| `GET /api/meta/depts` | High | High | `{ depts, allDepts }` |
| `GET / POST / DELETE /api/pocket/*` | High | Med | `task-types`, `type-detail`, `req-dept`, `contacts` |
| `GET /api/contacts/resolve` | Low | Low | Comment-only, never called in provided files |
| `GET /api/lessons` | High | Med | `{ list }` envelope; CRUD endpoints likely in missing `dispatch-learnknow.html` `[UNKNOWN]` |
| `GET / POST /api/todos` | High | Med | `GET` returns `{ task_data }`; `POST` body not inspected |
| `GET / POST /api/messages` & `/replies` | High | Med | Bare array with nested `replies[]`; `POST` body not inspected |
| `GET /api/work-records` | High | Med | Bare array of report rows |
| `GET /api/i18n/overrides` | High | Med | `{ success, version, items }`; write APIs likely in missing `Dispatch-language.html` `[UNKNOWN]` |
| `GET /api/reports/tasks` | High | Med | Bare array; `all_reports` sub-field `[COMMENT]` |
| `POST /api/reports/office-files` | High | Med | `{ success, items }` |
| `GET/POST/DELETE /api/webreports(/:id)` | High | High | `GET /:id` returns raw `text/html` |
| `GET/POST/PUT/DELETE /api/admin/users*` | High | Med | Includes `password`, `force-logout`, `batch`, `name-check`, `auth-source`, `merge-preview`, `merge`, `menu-perms` |
| `GET/POST/PUT /api/admin/sites(/:code)` | High | Med | `{ success, sites/site }` |
| `GET/POST /api/admin/archive(/info)` | High | Med | Writes to server filesystem path |
| `GET/POST /api/admin/ad/*` | High | Med | `status`, `users`, `users/:sam`, `ous`, `import`, `sync`, `sync/logs`, `diagnose` |
