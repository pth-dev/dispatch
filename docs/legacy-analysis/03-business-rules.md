# 03 — Business Rules, Roles & Permissions (Frontend-Implemented)

> **Scope**: All business rules (Task C) and role/permission logic (Task D) implemented in `docs/legacy/Dispatch-utils.js` (V16.11.0-r20) and `docs/legacy/Dispatch.html`.
> **Critical warning**: Backend source (`Dispatch.js`) is **NOT** available. Any claim that the backend also enforces a rule is tagged `[COMMENT]` and **cannot be verified** without live testing or backend code.

---

## C. Business Rules

### C.1 Status Derivation & Precedence (`[OBSERVED]`)

Status is **never stored** as a column; it is derived client-side from `progress` (`0`-`100`), `due_date`, `finish_date`, `now`, and `paused`.

| Status Key | Function & Lines | Exact Predicate | Notes / Edge Cases |
|---|---|---|---|
| `completed` | `taskMatchesStatus` (`Dispatch-utils.js:L1094-L1109`) | `p === 100` | `p = Number(t.progress) \|\| 0` |
| `completed_ontime` | `L1101` | `p === 100 && (!due \|\| finish <= due)` | `finish = parseDT(t.finish_date) \|\| now`. Missing `due_date` counts as on-time. |
| `late_completed` | `L1102` | `p === 100 && !!due && finish > due` | Uses exact timestamp comparison (not date-only). |
| `incomplete` | `L1103` | `p < 100` | Includes both `not_started`, `in_progress`, `delayed_pending`, and `paused`. |
| `delayed_pending` | `L1104` | `p < 100 && !!due && due < now` | **Note**: does NOT exclude `paused` tasks in `taskMatchesStatus` or `DU_statusKey`! |
| `not_started` | `L1105` | `p === 0` | Can overlap with `delayed_pending` in `taskMatchesStatus`. |
| `in_progress` | `L1106` | `p > 0 && p < 100` | Can overlap with `delayed_pending` in `taskMatchesStatus`. |
| **Mutually exclusive key** | `DU_statusKey` (`L1112-L1116`) | 1) `completed` → `late_completed` else `completed_ontime`; 2) `delayed_pending`; 3) `not_started` else `in_progress` | Precedence: completed > overdue > not_started > in_progress. |
| **Paused (orthogonal)** | `DU_isPaused` (`L9152`) | `Number(t.paused) === 1 && Number(t.progress) !== 100` | Once `progress === 100`, task is never treated as paused. |

### C.2 Pause / Resume Rules (`[OBSERVED]`)

- **Mechanism**: Submitted via `POST /api/tasks/:id/reports` with `status='paused'` (or `'running'`) and optional `pause_reason` (`Dispatch-utils.js:L2059-L2095`).
- **Constraints**: Cannot set `status === 'paused'` with `progress === 100` (`L2066`, UI auto-clamps `100` → `99` on status change at `L9182`). Status change allows empty report `content` (`L2067`).
- **Effects**: Paused tasks are **excluded** from KPI calculation (`DU_kpiCalc` at `L9278`, `DU_kpiTaskPoints` returns `null` at `L9224`) and **excluded** from Today's To-Do (`DU_todayTodoList` at `L10055`, `DU_recurNeedsReport` at `L10030`).

### C.3 Recurring Tasks (固定周期派案) & Today's To-Do (`[OBSERVED]`)

- **Types**: `recur_type` ∈ `'once' | 'weekly' | 'monthly'` (`DU_isRecurring` at `L9981`). Renamed from "重复派案" to "固定周期派案" in r14.
- **Day matching** (`DU_isRecurDay`, `L10005-L10011`): Weekly matches ISO weekday `1`-`7` (Mon=1..Sun=7); monthly matches day `1`-`31`, clamping non-existent days (e.g. `31` in Feb) to the last day of the month.
- **100% completion** (`submitReport`, `L2072-L2076`): For `once`, `100%` auto-closes the task; for `weekly`/`monthly`, `100%` marks the current cycle done (`data.cycle_done`) and backend resets progress to `0` on the next cycle date (`[COMMENT]` L2071). If `progress === 100 && !t.recur_next_date`, all cycles are finished (`DU_recurFinished`, `L10038`).
- **Daily "needs report" rule** (`DU_recurNeedsReport`, `L10028-L10032`): `DU_isRecurring(t) && !!t.recur_cycle_date && Number(t.progress) !== 100 && !DU_isPaused(t) && String(t.recur_cycle_date) <= toLocalDateInput(new Date())`.
- **Today's To-Do (`DU_todayTodoList`, r15, `L10054-L10070`)**: Filters `progress !== 100 && !DU_isPaused(t)` (for current user unless `all=true`), then buckets into 3 groups sorted by `due_date` asc then `id` asc:
  1. `recur`: recurring tasks matching `DU_recurNeedsReport(t)`
  2. `due`: one-time tasks where `toLocalDateInput(due_date) === today`
  3. `overdue`: one-time tasks where `toLocalDateInput(due_date) < today`
  Dashboard combines these with the saved personal schedule from `GET /api/todos?date=today` (`Dispatch.html:L2386-L2407`).

### C.4 Split-Group Behavior (拆分群组, `split_members`) (`[OBSERVED]`)

- **Trigger**: When creating/editing a task with `>= 2` assignees (`DU_ASSIGNEE_MAX = 20`), backend auto-splits into `N` individual task rows sharing `split_group` (`Dispatch-utils.js:L10347, L10488-L10511`) `[COMMENT]`/`[OBSERVED]`.
- **Parsing**: `DU_splitMembers(t)` (`L10370-L10376`) parses `split_members` (`id|assignee|progress|paused|finish;...`).
- **Group summary** (`DU_splitPanelHTML`, `L10409-L10438`): `done = count(m.progress >= 100)`, `avg = Math.round(sum(m.progress) / ms.length)`.
- **Reporting target** (`DU_reportTargetOf`, `L10448-L10463`): If current user is one of the split assignees, report writes to **their own** record (`target_id = me.id`); otherwise user chooses target member via `#r-target` dropdown (defaulting to currently opened `taskId`).
- **Deletion**: Deleting one split task deletes **only that member's record**, leaving siblings intact (`L8898-L8900`).
- **Edit removal protection**: Removing an assignee who already has reports keeps their record (`data.split_kept`, `L10510`).

### C.5 Duplicate Title + Due-Date Rule & Clone / Re-Dispatch (`[OBSERVED]`)

- **Rule 0-3-1** (`DU_titleKey`, `DU_dupCheck`, `L4648-L4686`, `L4845-L4876`): Two tasks (outside the same `split_group`) cannot share the same normalized title (`NFKC`, collapsed spaces, lowercased, Traditional→Simplified via `DU_TITLE_T2S`) AND the same due date (`YYYY-MM-DD`, or first cycle date for recurring). Checked live (400 ms debounce) via `GET /api/tasks/dup-check` with local fallback, and enforced on submit; backend returns `data.code === 'DUP_TITLE_DUE'` (`L4975`).
- **Daily Repair exception** (`L4854-L4869`): In Daily Repair mode (`DU_dailyRepairMode`), if a duplicate exists on the same day, FE auto-suffixes `-2`, `-3`, ... up to `-199`.
- **Clone / Re-dispatch (`DU_clonePick`, `DU_cloneDueIssue`, `L4570-L4632, L4715-L4726`)**:
  - Only tasks where `t.reporter === currentUser.username` can be cloned (`L4575`).
  - Creates a **new** independent task (`POST /api/tasks` with `clone_from` and `cloneFiles`).
  - **Mandatory due-date change**: `DU_cloneDueIssue()` blocks submission if the new due date (or `recur_end`) is empty or identical to the source task's date (`L4723-L4724`).
  - Source attachments can be selectively retained (`cloneFiles`) without re-uploading (`L4585-L4591, L4942`).

### C.6 Task Creation, Quick Create & Project Mode (`work_items`) (`[OBSERVED]`)

- **Required fields** (`submitTaskForm`, `L4741-L4884`): `title`, `req_contact` (verified local/AD user, default = self), `task_type` (**mandatory since r15**, blank or `'未分類 / Chưa phân loại'` rejected at `L4753`), `req_depts` (>=1), `site` (>=1 or `site_other`), `assigned_unit`, `due_date` (for `once`; default = **today 19:00** via `DU_DEFAULT_DUE_TIME = '19:00'`, `L11150`), and `assign_person` (<=20).
- **Quick Create (简易派案, r12, `DU_openQuickCreate`, `L11163`)**: Subset UI of the same form/API (title, due date default today 19:00, risk default None, task_type mandatory, precautions, content, assigned_unit default self dept, assign_person default self).
- **Daily Repair (日常报修, r11, `DU_openDailyRepair`, `L11084`)**: Shown only if user's dept/OU contains `'电脑'`/`'電腦'` (`DU_isComputerRoom`); presets title `'日常维修'`, due today 19:00, `assigned_unit` = `'資訊部'` (does not auto-sync to assignee dept), `assign_person` = self.
- **Project Mode (`work_items`, r16–r20, `L2855-L3465`)**:
  - Max 60 sub-work items (`DU_WI_MAX = 60`); at least 1 item required in project mode (`L4798`).
  - Deduction rules (`DU_WI_RULES`): `'none'`, `'sun'` (default), `'satsun'`.
  - Per-item calculation (`DU_wiCalc`, `L2876-L2895`): `gross = days(end - start) + 1` (inclusive); `auto = count of Sat/Sun in range`; `manual = min(deduct, max(0, gross - auto))`; `net = max(0, gross - auto - manual)`.
  - Project span (`DU_wiSummaryOf`, r19, `L2898-L2918`): `spanDays = days(maxEnd - minStart) + 1` (overlapping items not double-counted); `spanNet = spanDays - spanAuto - spanManual`. Per-item share = `net_i / sum(net) * 100`.
  - Weighted total progress (`DU_wiCalcTotalProgress`, r20, `L3440-L3459`): `round(sum(share_i/100 * progress_i))` (equal weights if `sum(net) === 0`).

### C.7 KPI Formulas, Period Ranges & Dashboard Counters (`[OBSERVED]`)

- **Current KPI formula (V16.11.0-r8, `DU_KPI_WEIGHTS`, `DU_kpiCalc`, `Dispatch-utils.js:L9120-L9308`)**:
  - Weights: `final = 60`, `ontime = 40`, `response = 0`, `late = 0` (old V15.8.0 `50/50/-40` formula discarded).
  - **Basis (`DU_KPI_BASIS_DEFAULT = 'final'`, `DU_kpiFinalAt`, `L9135-L9145`)**: A task counts in a period if its `finalAt` falls in `[start, end]`, where `finalAt = finish_date` (if completed & present) else `due_date` (if present) else `kpi_at || createdAt`. Alternative basis `'created'` uses `kpi_at || createdAt`.
  - **Per-task points (`DU_kpiTaskPoints`, `L9223-L9228`)**: On-time completed = `100`, late completed = `60`, incomplete = `0`, paused = `null` (excluded from denominator).
  - **Per-person score (`DU_kpiCalc`, `L9293-L9307`)**:
    `score = round1(clamp(0, 100, (completed / total) * 60 + (ontime / total) * 40))` (or `null` if `total === 0`).
    Multi-assignee tasks count 1 task per unique assignee (`L9266-L9275`). Recurring tasks count per cycle (`DU_kpiKey = "${id}@${recur_cycle_date}"`, `L9984`). 1H response rate (`first_response_mins <= 60`) and late rate are reference-only (weight 0).
  - **Grade thresholds (`DU_kpiGrade`, `L9230-L9236`)**: `>= 90` → **A** (优秀/Xuất sắc), `>= 80` → **B** (良好/Tốt), `>= 60` → **C** (合格/Đạt), `< 60` → **D** (待改进/Cần cải thiện), `null` → **-** (无任务).
- **Period ranges (`getPeriodRange`, `L1055-L1074`)**: `week` = Monday 00:00 to Sunday 23:59:59.999; `month` = 1st to last day 23:59:59.999; `quarter` = Q1–Q4; `year` = Jan 1 to Dec 31.
- **Dashboard stats (`computeDashboardStats`, `Dispatch.html:L2115-L2219`)**: Computes `total`, `done`, `onTime`, `late`, `incomplete`, `delayedPending`, `my.*`, `levelStats`, `taskTypeStats`, `deptStats`, `siteStats`, `oneHourResponseRate` (current month only). Note: `s.onTimeRate = pct(s.onTime, s.done)` (denominator is `done`), whereas **Assignee Ranking (`computeAssigneeRanking`, `L2222-L2261`)** uses `onTimeRate = pct(r.onTime, r.count)` (denominator is total `count`) and sorts by `onTimeRate DESC, onTime DESC, count DESC, username ASC`.

### C.8 Date Parsing, Timezone, Deep Links, Session & Uploads (`[OBSERVED]`)

- **Date parsing (`parseDT`, `L1022-L1033`)**: Matches `YYYY-MM-DD([ T]HH:mm(:ss)?)` and constructs `new Date(y, m-1, d, H, M, S)` in **browser local timezone** (no UTC conversion). Falls back to `new Date(s)`. String comparisons (`YYYY-MM-DD`) assume local dates (`toLocalDateInput`).
- **Dashboard → Task List Link Contract (`goTaskList`, `matchGotoFilter`, `Dispatch.html:L1020-L1026, L2296-L2357`)**:
  - Query params: `?filter=<level|task_type|assigned_unit|assignee|site|status|my_pending|created_between|finished_between|ids>&value=<val>&status=<optionalOverlayStatus>&alt=<fullname>&label=<bannerText>`.
  - Sentinels: `task_type` empty = `'未分類 / Chưa phân loại'`; `assigned_unit` empty = `'未指定 / Chưa định'`; `assignee` empty = `'__UNASSIGNED__'`; date ranges = `'YYYY-MM-DD~YYYY-MM-DD'`.
  - Pre-check: 0 local hits → error toast (no navigation); 1 hit → opens `viewTaskDetail(id)` directly; >1 hits (or `forceList=1`) → navigates to `Dispatch-task.html?...`.
- **Hash routes (`routeFromHash`, `Dispatch.html:L6022-L6059`)**: `#dashboard`, `#messages`, `#todo`, `#workrecords`, `#learnknow`, `#language`, `#kpi-people`, `#kpi-brief`, `#account`, `#account-ad`, `#archive`, `#settings`, `#create`, `#quick-create`, `#project-create`, `#reuse`, `#daily-repair`, `#report-pdf`, `#report-kpi`, `#report-excel`, `#report-web`, `#task-<id>`.
- **Auto-refresh & Session**:
  - Auto-refresh every **3 minutes** (`AUTO_REFRESH_MS = 180000`, `Dispatch.html:L1066, L2053-L2090`); deferred by 20 s if user is typing (`DU_isTypingInMain()`); skips if tab hidden; preserves scroll/focus and refreshes open detail feed only if report form is idle.
  - Heartbeat every **60 s** (`DU_HEARTBEAT_MS = 60000`, `Dispatch-utils.js:L528, L833-L849`).
  - Remember-me token (`dispatch.remember.v16` in `localStorage`): 64-char hex token auto-resumes on 401 or page load via `POST /api/session/resume` (`L661-L717`).
  - Cross-tab sync: `BroadcastChannel('dispatch-auth-v15')` for logout (`L856`), `BroadcastChannel('dispatch-data-v15')` for task deletion (`L8870`), `BroadcastChannel('dispatch-i18n')` for i18n updates (`L8573`).
- **File Uploads & Attachments**:
  - Max single file size: **50 MB** (`DU_MAX_FILE_MB = 50`, `L529, L1495`); no client-side file count cap or MIME allowlist observed.
  - Clipboard paste in modals attaches images/files unless focus is in a text field with text on clipboard (`L1521-L1525`).
  - URL safety: `getSafeLink(url)` blocks `javascript:` and prepends `http://` if protocol missing (`L1011-L1017`). `DU_fileUrl(p)` prepends `window.location.origin` to relative paths (`L1333-L1337`).
- **Report rules**:
  - Only report author (`r.username === currentUser.username`) sees the inline "Edit" button (`editReportPrompt`, `L2027`); no edit time-window check observed in FE.
  - System reports (`DU_isSystemReporter`, `L766-L769`: `system`, `系统`, `系統`, `hệ thống`) are excluded from "latest report" displays (r9); r10 restricts latest report to assignee (`[COMMENT]` L506).

---

## D. Roles and Permissions (Frontend-Implemented)

> **CRITICAL DISCLAIMER**: Backend enforcement in `Dispatch.js` **CANNOT BE VERIFIED** from frontend files. Every backend enforcement claim below is marked `[COMMENT]` and must be verified via testing or backend review.

### D.1 Role Constants & Hierarchy (`Dispatch-utils.js:L508-L518`, `Dispatch.html:L3730-L3757`)

| Role Key | Display Label (zh / vi) | Helper | Notes |
|---|---|---|---|
| `user` | 一般会员 / TV thường | — | Default member; department-scoped |
| `admin` | 管理员 / Quản trị viên | `currentUser.role === 'admin'` | Department head / dept admin; manages `user` accounts in own dept |
| `superadmin` | 超级管理员 / Siêu QTV | `DU_isSuperLike(u)` = `true`, `DU_isExec(u)` = `false` | System-wide admin; **cannot** view `confidential=3` (Top Secret) or `2` (Private); **cannot** set `cross_dept` (`L9572`); **can** grant all 5 roles including `exec_*` (r7, `Dispatch.html:L3735-L3738`) |
| `exec_assistant` | 公司高层-特助层级以上 / Lãnh đạo cấp Trợ lý đặc biệt trở lên | `DU_isExec(u)` = `true`, `DU_isSuperLike(u)` = `true` | Executive tier; can view `confidential=3` (Top Secret) |
| `exec_vp` | 公司高层-副总级以上 / Lãnh đạo cấp Phó Tổng trở lên | `DU_isExec(u)` = `true`, `DU_isSuperLike(u)` = `true` | Highest executive tier; same FE privileges as `exec_assistant` |

- **Protected account**: `PROTECTED_USERNAME` (`'admin'`, `Dispatch-utils.js:L11286`, `Dispatch.html:L3751`) cannot be edited/deleted/menu-perm-restricted.
- **Additional identity concept**: "Report identities" (报告身份, r11) in WebReport Center are multi-selectable report viewpoints (personal/dept/selected person), **not** auth roles.

### D.2 Task-Level Permission Helpers (`[OBSERVED]`)

| Function & Lines | Rule Implemented in FE |
|---|---|
| `DU_canEditTask(t)` (`Dispatch-utils.js:L1808-L1813`) | `t.reporter === me` OR `DU_isSuperLike(me)` OR (`role === 'admin'` AND own dept matches `req_depts`, `assigned_unit`, or `reporter_dept`). Reader-only users cannot edit. |
| `DU_canDeleteTask(t)` (`L8873-L8879`) | `DU_isSuperLike(me)` OR `t.reporter === me` OR (`role === 'admin'` AND own dept matches `reporter_dept` or `req_depts`). *(Note: unlike `canEditTask`, `assigned_unit` is NOT checked here!)* |
| `DU_canSetReaders()` (`L9409`) | `DU_isSuperLike(me) \|\| role === 'admin'`. Hidden for `user`. Max 100 (`DU_READERS_MAX`). |
| `DU_canSetCross()` (`L9572`) | `DU_isExec(me) \|\| role === 'admin'`. **Note**: `superadmin` is excluded in FE! Max 100 (`DU_CROSS_MAX`). |
| `DU_isReaderOnly(t)` (`L9413-L9423`) | True when user is in `readers` (not creator/assignee/crossViewer/superLike/same-dept) → read-only (cannot report/edit/delete). |
| `DU_isCrossViewer(t)` (`L9576-L9580`) | True when `cross_dept === 1`, `confidential <= 1`, and user is in `cross_viewers` → can view AND submit progress reports (cannot edit/delete). |
| `DU_canDeleteReportAtt(t, r)` (`L10739-L10747`) | `DU_isExec(me)` OR `r.username === me` OR `t.reporter === me` OR (`role === 'admin'` AND same dept). *(Note: `superadmin` excluded unless creator/author!)* |
| `DU_canEditI18n()` (`L8580`) | `DU_isSuperLike(me) \|\| role === 'admin'`. |
| `canManageUser(u)` (`Dispatch.html:L3749-L3756`) | Not `'admin'`; `isSuperAdmin()` manages all; `admin` manages `role === 'user'` in own dept only. `canDeleteUser(u)` adds `!isSelf(u)`. |

### D.3 Confidentiality Visibility Rules (`[COMMENT]` backend-enforced, `Dispatch-utils.js:L9311-L9351`)

| Level | Label | Who Can View (`[COMMENT]` backend `scopeClause` filters `GET /api/tasks`) |
|---|---|---|
| `0` | 一般性 / Thông thường | Same-dept members/admin, `superadmin`, `exec_*`, `readers`, `cross_viewers`, creator, assignee |
| `1` | 机密性 / Bảo mật | Creator, same-dept `admin`, `superadmin`, `exec_*`, `readers`, `cross_viewers`. **Regular `user` (even if assignee!) cannot see it.** |
| `2` | 私有 / Riêng tư | **Creator ONLY.** Hidden from assignee, `admin`, `superadmin`, `exec_*`, `readers`, `cross_viewers`. |
| `3` | 最高机密 / Tối mật | Creator + `exec_assistant` + `exec_vp` ONLY. **Hidden from `superadmin`**, `admin`, `user`, `readers`, `cross_viewers`. |

### D.4 Per-Account Menu Permission Model (`DU_MENU_FEATURES`, r11, `Dispatch-utils.js:L11250-L11459`)

- **Scope**: Applies ONLY to `role === 'user' || role === 'admin'` (excluding username `'admin'`). `superadmin` and `exec_*` are unrestricted (`DU_permApplies`, `L11286`).
- **Storage**: `currentUser.menu_perms` = JSON object `{ [key]: 's' | 'sr' | 'srw' | '' }` or `null`. **`null` or missing key = full access (`srw`)** (`DU_perm`, `L11289-L11295`).
- **Hierarchy**: `w` (write/写入) ⇒ `r` (read/读取) ⇒ `s` (show/显示) (`DU_permParse`, `L11280`).
- **DOM gating (`DU_permApplyNav`, `L11308-L11333`)**:
  - `data-perm="<key>"`: hides element if `!s`; dims (`opacity-50`) and blocks click with `DU_permGuard` if `s && !r`.
  - `data-perm-write="<key>"`: hides write buttons (Create, Quick Create, Project Create, Clone) if `!w`.
- **14 Feature Keys (`DU_MENU_FEATURES`, `L11255-L11270`)**:
  `dashboard` (w: create/edit/delete task), `list` (w: submit report), `messages` (w: post/reply), `learnknow` (w: add/edit lesson), `language` (w: edit system text), `todo` (w: edit todo), `worklog` (s/r only), `report_pdf` (s/r), `kpi_report` (s/r), `excel_report` (w: save web-report archive), `kpi_people` (s/r), `kpi_brief` (s/r), `account` (admin-only, w: add/edit users), `ad` (admin-only, w: import/sync AD).
- **Save endpoint**: `PUT /api/admin/users/menu-perms` with `{ ids, perms }` (`null` when all `srw`). Comment `L11252` claims backend `requireAuth` enforces write APIs `[COMMENT]`.

### D.5 Role × Action Matrix

Legend: `Y` = allowed, `N` = denied, `Dept` = own dept only, `Own` = own records only, `Cond` = conditional. Tags: `FE` = FE-enforced `[OBSERVED]`, `BE?` = `[COMMENT]` backend-enforced (unverified).

| Action | `user` | `admin` | `superadmin` | `exec_assistant` / `exec_vp` | Task Creator | Assignee | Reader | Cross Viewer | Enforcement |
|---|---|---|---|---|---|---|---|---|---|
| View own / assigned tasks (lv 0) | Y | Y | Y | Y | Y | Y | Y | Y | `BE?` (`scopeClause`) |
| View dept tasks (lv 0) | Dept | Dept | Y | Y | — | — | N | N | `BE?` |
| View confidential (lv 1) | N | Dept | Y | Y | Y | N (if `user`) | Y | Y | `BE?` |
| View private (lv 2) | N | N | N | N | Y | N | N | N | `BE?` |
| View top secret (lv 3) | N | N | **N** | Y | Y | N | N | N | `BE?` |
| Create task | Y (if `dashboard:w`) | Y (if `dashboard:w`) | Y | Y | — | — | — | — | `FE` + `BE?` |
| Edit task (`DU_canEditTask`) | Own | Dept | Y | Y | Y | N | N | N | `FE` + `BE?` |
| Delete task (`DU_canDeleteTask`) | Own | Dept (rep/req) | Y (excl lv2/3) | Y (excl lv2) | Y | N | N | N | `FE` + `BE?` |
| Pause / resume (via report) | Cond (`list:w`) | Cond | Y | Y | Y | Y | N | Y | `FE` + `BE?` |
| Set `readers` (`DU_canSetReaders`) | N | Y | Y | Y | — | — | — | — | `FE` + `BE?` |
| Set `cross_viewers` (`DU_canSetCross`) | N | Dept | **N** (FE) | Y | — | — | — | — | `FE` + `BE?` |
| Set `confidential` (0–3) | Y (confirm) | Y | Y | Y | — | — | — | — | `FE` |
| Submit progress report | Y (if `list:w` & not reader-only) | Y | Y | Y | Y | Y | **N** | **Y** | `FE` + `BE?` |
| Edit report content | Own | Own | Own | Own | N | Own | N | Own | `FE` (`r.username===me`) |
| Delete report attachment | Own | Dept | Own (`!exec`) | Y | Y | Own | N | Own | `FE` + `BE?` |
| Clone / re-dispatch | Own | Own | Own | Own | Y | N | N | N | `FE` (`L4575`) |
| Export PDF / Excel / KPI / WebReport | Own/Dept (`*` perm) | Dept | All (excl lv2/3) | All (excl lv2) | — | — | — | — | `FE` + `BE?` (`/api/reports/tasks`) |
| Lessons view / manage | View (`learnknow`) | View/Edit? | View/Edit? | View/Edit? | — | — | — | — | Manage UI in missing `dispatch-learnknow.html` `[UNKNOWN]` |
| Todos / Messages / Work-records | Y (own; perm) | Y (dept worklog) | Y (all worklog) | Y (all worklog) | — | — | — | — | `FE` + `BE?` |
| Admin users (CRUD, reset PW, batch) | N | Dept (`user` only) | All (all 5 roles) | All (all 5 roles) | — | — | — | — | `FE` + `BE?` |
| Admin menu-perms | N | Dept (`user`?) | All (`user`/`admin`) | All (`user`/`admin`) | — | — | — | — | `FE` + `BE?` |
| AD import / sync / diagnose | N | Import (dept) | Full | Full | — | — | — | — | `FE` + `BE?` |
| Admin sites / Archive | N | N | Y | Y | — | — | — | — | `FE` + `BE?` |
| Edit i18n overrides (`DU_canEditI18n`) | N | Y | Y | Y | — | — | — | — | `FE` (editor in missing `Dispatch-language.html`) |

### D.6 Comparison with `docs/PROJECT_BRIEF.md` §6 (Reopened Decision D6)

| Brief §6 Role / Key (`PROJECT_BRIEF.md:L18, L196`) | Legacy Equivalent | Mismatch |
|---|---|---|
| Role: `Nhân viên` | `user` | Matches closely. |
| Role: `Người duyệt` | **None** | **Out of scope** (no approval flow in legacy). |
| Role: `Trưởng bộ phận` | `admin` | Matches department admin. |
| Role: `Quản trị viên` | `superadmin` + `exec_assistant` + `exec_vp` | Legacy splits system admin (`superadmin`) from executive tiers (`exec_*`, who see `confidential=3` and can set `cross_dept`). |
| `task.view` / `task.create` / `task.update` / `task.assign` / `task.reassign` | `dashboard` (`s/r/w`), `list` (`s/r/w`) + task ownership + `confidential` | Legacy has no separate `task.assign`/`task.reassign` permission; clone is creator-only; reporting is gated by `list:w` + not reader-only. |
| `task.approve` | **None** | **Out of scope.** |
| `lesson.view` / `lesson.manage` | `learnknow` (`s/r/w`) | Maps to `learnknow` `r` vs `w`. |
| `system.manage` | `account`, `ad`, `language`, plus `superadmin`-only `sites`/`archive` | Split across multiple menu keys and role checks. |
| *(Absent in brief)* | `DU_MENU_FEATURES` (14 per-account `s/r/w` feature flags) | Legacy uses **per-account** feature overrides (`menu_perms`), NOT a role-permission matrix (`Roles` table does not exist in legacy). |
