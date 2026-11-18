# PROJECT_BRIEF.md - "Điều Phối" handoff for the rebuild

Purpose: give an AI coding agent everything needed to rebuild the "Điều Phối" web app from scratch in a NEW repository created from
https://github.com/Fabi0pi/claude-code-react-boilerplate (React 19 + TypeScript + Vite + React Router + TanStack Query + Zustand + Tailwind CSS + shadcn/ui + React Hook Form + Zod + i18next).
A previous prototype exists on a different UI library. Only its product design, domain, UX decisions and the bugs found are carried over here. No code from it is reused. This project uses shadcn/ui standards only; it must contain no MUI and no Emotion.

## 0. How to use this document
1. Read the boilerplate's `CLAUDE.md`, `AGENTS.md` and `.claude/rules/*` first. The boilerplate OWNS project structure, naming, architecture, component conventions, state, data fetching, forms, a11y, security, i18n mechanics and TypeScript conventions.
2. This brief owns only: product, domain, visual spec, screens and their behavior, mock data, decisions and pitfalls from a previous prototype. It deliberately does NOT prescribe folder structure, layers, page templates or component taxonomy. Follow the boilerplate's `architecture.md` rule and `project-structure` skill for all of that. If this brief seems to imply a structure, the boilerplate wins. If a real conflict remains, quote both sides, propose a resolution and ask the user. Never silently pick one.
3. Skills of the boilerplate (`components`, `form-validation`, `tanstack-query`, `http-client`, `error-handling`, `testing-architecture`, `accessible-components`, `responsive-design`, `performance`, `i18n-advanced`, `project-structure`, `dashboard-design`, `design-tokens`, `visual-craft`) should be used when their trigger applies. Use `project-structure` as the authority on where files go.
4. Visual mockups (source of truth for look): https://claude.ai/artifact/238x3AujrwLBJAV6Z1MzEn (canvas; boards named in section 5). Mockup icons are placeholders; implement icons with `lucide-react` (section 3.6). Mockup sample data is not business rules.
5. Work in small steps, commit each, run lint, typecheck and tests every time. Report assumptions. Do not invent product behavior; ask.
6. AGENT CONFIGURATION IS FROZEN: use and comply with the boilerplate's existing skills, rules, agents, commands and hooks exactly as they are. Do NOT create new skills, agents, commands or rules, and do NOT edit existing ones. When a task matches an existing skill, invoke it and follow it. If this brief conflicts with an existing rule or skill, do not edit the boilerplate: quote both sides, state the proposed deviation, and ask the user. Approved deviations are recorded only in `docs/PROJECT_BRIEF.md` (or `docs/deviations.md`), never inside `.claude/`. The only allowed edits to boilerplate files are filling the project profile in `CLAUDE.md` and `AGENTS.md` (name, purpose, language) and pointing them to `docs/PROJECT_BRIEF.md`; confirm even that with the user first.

## 1. Product
- Enterprise task-dispatch web app ("Hệ thống điều phối", app name "Điều Phối", version label V16.8.0). Vietnamese UI (also en, zh-CN locales exist). Logo: Shingtak (red circle, white house); shown as a 36px circle next to the app name. App chrome stays blue; do not recolor the UI to match the red logo.
- Frontend-only for now: all data from MSW mocks. Real API later must be a drop-in (screens do not change).
- Users and roles (assumed, confirm): Nhân viên (receives tasks), Người duyệt (approves acceptance), Trưởng bộ phận (assigns, department view), Quản trị viên (admin: users, roles, departments, system texts).
- Core flow: create task -> assign -> work -> submit for acceptance ("nghiệm thu") -> approver approves / rejects / requests changes -> done. Tasks can be re-assigned ("giao lại"). SLA metrics measure on-time completion per member. Lessons learned ("bài học kinh nghiệm") hold rules shown as reminders. A "current view" scope (for example "BP. IT") limits dashboard data.
- Top-level modules: Bảng điều khiển, Danh sách nhiệm vụ (badge 73), Bảng tin nhắn, Bài học kinh nghiệm (badge 6), Văn bản hệ thống, Việc cần làm hôm nay; personal: Cài đặt cá nhân, language switcher, Đăng xuất; admin group "QUẢN TRỊ": Người dùng, Vai trò và phân quyền, Phòng ban.

## 2. Stack for the new repo
Boilerplate stack plus: MSW + @faker-js/faker (mocks, also used in tests), Vitest + Testing Library, Playwright (smoke + layout measurements), Storybook (+ a11y addon) as the component catalog, `lucide-react` as the ONLY icon library.
shadcn conventions are followed as-is and the boilerplate's structure rules apply: `components.json`, `npx shadcn@latest add <component>` (check the current docs for CLI syntax), aliases (`@/components`, `@/lib`, `@/hooks`), `cn()` in `lib/utils.ts`, `class-variance-authority` for variants, CSS variables for theming, Radix/Base primitives only inside `components/ui`. Hard bans: `@mui/*`, `@emotion/*`, any other icon library, any CSS-in-JS.
Zustand only for small global client state (session, role, UI prefs, dev toggles). Server data stays in TanStack Query. Forms use RHF + Zod. No Redux.

## 3. Design system (translate to Tailwind + shadcn CSS variables; follow the boilerplate `theming`/`design-tokens` rules for syntax)
Style: flat and calm. Light gray page, white cards with 1px border, NO box-shadows, NO gradients, NO tinted card backgrounds, one blue accent, orange used rarely, font Inter.

### 3.1 Color tokens (map to shadcn semantic variables; add custom status tokens)
| Token | Hex | Use |
|---|---|---|
| background | #F3F4F8 | page |
| card / popover | #FFFFFF | cards, sidebar, topbar, inputs |
| foreground | #1F2937 | primary text |
| muted-foreground | #6B7280 | secondary text, captions |
| placeholder | #9CA3AF | input placeholder |
| border / input | #E5E7EB | borders, dividers |
| primary | #1F6FEB | main buttons, links, active tab, focus, table headers |
| primary-hover | #1A5FCC | hover |
| primary-soft (accent) | #E8F0FE | selected nav item, legend strip, selected list item |
| secondary-accent | #F5A623 | rare highlights (secondary button, active sub-menu dot) |
| destructive | #D32F2F | errors, reject, delete |
| overlay | rgba(17,24,39,.45) | scrim for drawer, sheet, dialog |
| ring | #1F6FEB | focus ring (1px border + 3px rgba(31,111,235,.15)); never black |

### 3.2 Status colors (TEXT only, never filled chips or pills). All pass 4.5:1 on white
| Code | Label (vi) | Color |
|---|---|---|
| new | Mới tạo | #6B7280 |
| draft | Lưu nháp | #6B7280 |
| in_progress | Đang thực hiện | #1F6FEB |
| pending | Chờ phê duyệt / Chờ nghiệm thu | #B45309 |
| approved | Đã phê duyệt | #1F6FEB |
| done | Hoàn thành | #15803D |
| overdue | Quá hạn | #D32F2F |
| rejected | Từ chối | #D32F2F |
| urgent (priority flag) | Khẩn cấp | #D32F2F with a priority icon |
Never use #F5A300 or #22A447 for text on white (contrast too low). One `statusMeta` map (color token + i18n key + order) is the single source for the StatusText component, the status filter options and the legend dots.

### 3.3 Typography, shape, spacing
- Inter only. H1 24px/600 (22px mobile); section title 16px/600; body and table cells 14px; labels 12-13px/600; table header 13px/600 in primary; legend 12px; mobile input text 16px (prevents iOS zoom). No monospace (task codes use Inter in primary blue).
- Radius: controls 8px, cards 12px, tabs/chips pill (999px), bottom-sheet top corners 16px. Spacing scale 4/8/12/16/20/24/32.
- Control height 40px desktop, 44px mobile. Touch targets >= 44px on mobile.
- Scrollbars: thin (8px), thumb #D1D5DB (hover #9CA3AF), transparent track, no arrow buttons; sidebar scroll area uses `scrollbar-gutter: stable`.

### 3.4 Layout dimensions and breakpoints
- Desktop shell: sidebar 260px (white, 1px right border), topbar 56px (white, 1px bottom border), page padding 16px 24px, gap between page blocks 12px. Mobile topbar 56px, page padding 16px.
- Breakpoints: follow the boilerplate (`tailwind.md` mobile-first, `responsive-design` skill). Base styles target mobile and are enriched upward. The mockups switch the major structure (permanent sidebar, table instead of cards, inline filters instead of a sheet) at about 900px; the recommended Tailwind equivalent is `lg` (1024px), and `md` for lighter adjustments such as two-column forms. Use shadcn's standard mobile hook/behavior for the sidebar and keep ONE shared definition of "mobile layout" so components do not disagree (decision D2).
- Design viewports to verify: 320, 375, 768, 1023, 1024, 1366x650, 1440x778 (primary reference), 1440x900.
- Density: `comfortable` (row 50px) and `compact` (row 44px, header 40px). Data screens use compact. Target: at least 8 visible table rows at 1440x778; the table body keeps >= 5 rows minimum, otherwise the page scrolls instead of crushing the table.

### 3.5 Component specs (names are suggestions; build on shadcn primitives)
- Button: variants primary (blue fill), outline (white, #E5E7EB border), destructive-outline (white, red border and text), accent (orange, rare), ghost/text. 40px desktop / 44px mobile; icon on the left optional; label never wraps.
- Input / Select / DatePicker / Textarea: label ABOVE the field (12-13px/600), white field, 1px #E5E7EB border, 8px radius, hover border #D1D5DB, focus border primary + ring, disabled bg #F3F4F6 text #9CA3AF, error = red border + red helper text. DatePicker shows a calendar icon at the right, format DD/MM/YYYY, locale vi. Select has an optional "Tất cả" option that maps to `undefined`.
- Checkbox, Switch (36x20, primary when on, needs an accessible name).
- Tabs: variant `pill` (white container 1px border, active = blue fill white text) and `underline` (no container, gap 24px, 14px/500 text, selected = blue text + 2px blue indicator over a 1px bottom border). Weight is CONSTANT in all states. Scrollable on mobile, never wraps.
- Legend: variant `strip` (bg #E8F0FE, radius 8, padding 10x14, title "Chú thích") and `inline` (no bg, 12px, 8px dots, gap 16px).
- Table (DataTable): white, no vertical borders, 1px horizontal dividers, header titles blue 13px/600 on white with sticky positioning, rows hover #F9FAFB, action column icons 18px (view gray #6B7280, download blue, delete red). Built-in loading (skeleton rows of real row height), empty and error (retry) states.
- Pagination footer: left "Hiển thị [10|20|30|50] từ X đến Y của N kết quả"; right 36x36 rounded-square buttons (8px radius, 1px border), current = blue fill white text, first/prev/next/last + ellipsis. Mobile: "‹ Trang x/y ›".
- KPI card: white card, small gray uppercase label, 32px/600 dark number (never colored), gray caption. No delta/percent badges.
- Banner/Alert: white card with gray border, only the left icon is colored (info/success/warning/error).
- Chip: small outlined pill, blue text (task codes, counts). NOT used for status.
- Sidebar: parent item = icon 20px + label 14px + optional count (plain gray 12px text, no pill) + chevron when it has children. Selected item: bg #E8F0FE, text and icon primary, 3px left indicator drawn with `box-shadow: inset 3px 0 0` (no layout change), font-weight 500 CONSTANT (never bold on select: bold widens text and wraps long labels, shifting layout). Items min-height 44px, padding 6x12, gap 12; label up to 2 lines (line-clamp) with tooltip when truncated; icon and count never shrink. Child items indented with a dot (selected dot orange). Group header "QUẢN TRỊ" 11px/600 uppercase gray, admin-only.
- Topbar (desktop): no page title. Right side: bell with 8px red dot, 36px avatar circle (initial), "Xin chào, <name>" in primary 14px/600. Mobile: menu button, logo, truncated app name, bell.
- Dialog (desktop) / bottom sheet or full screen (mobile). Dev tools panel (mock toggles) is DEV-only, collapsed gear button fixed bottom-right, never in the layout flow, absent in production.

### 3.6 Icons (decided: lucide-react only)
`lucide-react` is the only icon library (shadcn standard). No MUI icons, no other icon packs, no emoji, no hand-drawn SVG icons. Stroke style (Lucide default), 18px in tables, 20px in menus and buttons, 24px in the topbar, `aria-hidden` unless the icon is the only content (then `aria-label`). Import named icons (`import { Search } from "lucide-react"`) so they tree-shake.
| Use | Lucide icon |
|---|---|
| Dashboard / Tasks / Messages | LayoutDashboard / ListChecks / MessagesSquare |
| Lessons / System texts / Today's to-do | GraduationCap / Languages / CircleCheckBig |
| Users / Roles / Departments | Users / Lock / Network |
| Menu / filter / close | Menu / ListFilter / X |
| Search / calendar | Search / CalendarDays |
| Add / edit / delete | Plus / Pencil / Trash2 |
| View / download / copy | Eye / Download / Copy |
| Approve / request changes | CheckCheck / FilePenLine |
| Warning / urgent | TriangleAlert / CircleAlert |
| Bell | Bell |
| Chevrons / back | ChevronDown, ChevronRight / ArrowLeft |
| First / last page | ChevronsLeft / ChevronsRight |
| Not found / offline / retry / home / clock | SearchX / WifiOff / RefreshCw / House / Clock |
Names above are suggestions; verify they exist in the installed `lucide-react` version.

### 3.7 shadcn component map (use the standard components, customize in place)
Customize the generated shadcn components in place to match section 3 (tokens, radius, heights, flat look) and add variants with `cva`, following the boilerplate `components` skill. Where to put higher-level pieces (for example the data table) is decided by the boilerplate's structure rules, not by this brief.
| Need | shadcn component | Customization notes |
|---|---|---|
| Button | `button` | variants: default (primary blue), outline, destructive (outline red), secondary/accent (orange, rare), ghost/link; sizes 40px desktop / 44px mobile (via responsive size or `useIsMobile` in the component) |
| Inputs | `input`, `textarea`, `label`, `select`, `checkbox`, `switch` | label above field; heights 40/44; focus ring from tokens; Select supports an "all" option mapped to `undefined` |
| Date | `calendar` + `popover` (DatePicker pattern) | format DD/MM/YYYY, locale vi, from <= to validation |
| Forms | shadcn form primitives (`form`/`field` depending on the installed version) + RHF + Zod | follow the boilerplate `form-validation` skill |
| Tabs | `tabs` | add variants `pill` and `underline` with constant font weight |
| Table | `table` (+ TanStack Table only if sorting/selection becomes necessary) | data-table behavior per section 3.5 (sticky header, density variants, mobile cards); place it where the boilerplate structure says |
| Pagination | `pagination` | rounded-square buttons, first/prev/next/last, ellipsis, page-size `select` |
| Shell | `sidebar`, `sheet`, `separator`, `scroll-area`, `tooltip`, `breadcrumb`, `avatar`, `dropdown-menu` | sidebar items constant weight, 2-line labels with tooltip, selected inset indicator |
| Overlays | `dialog`, `alert-dialog`, `sheet`, `drawer` | dialog on desktop; bottom sheet/drawer or full screen on mobile |
| Feedback | `sonner` (toast), `alert`, `skeleton`, `progress` | alert = white card with colored icon only; skeleton rows match real row height |
| Not for status | `badge` | status is text only (StatusText); badge only for counts/codes if at all |
Do not add components that are not on this list without a reason; ask first.

## 4. Layout behavior (app shell and fixed-height pages)
- Desktop: the shell is a fixed-height app (`100dvh`, not `100vh`). Sidebar and topbar fixed; the main area is a flex column with `min-h-0`; list pages do NOT scroll as a whole: header, tabs, filters stay put and ONLY the table body scrolls (sticky header, footer pinned inside the card). Every flex ancestor between the shell and the scroll region needs `min-h-0` (and `min-w-0` horizontally). A missing `min-h-0` is the usual cause of footers pushed off screen.
- Short viewports (<700px high): reduce padding/gap one step; the table keeps its 5-row minimum, otherwise let the main area scroll.
- Mobile: the page scrolls normally (no inner scroll area); sidebar becomes a left `Sheet` (about 296px, shadcn Sidebar mobile mode) opened from the topbar; tables become card lists; filters become search + "Bộ lọc" button opening a bottom `Sheet`/`Drawer`; the primary create action becomes a 56px floating button; decision screens get a sticky bottom action bar; forms are single column with a sticky Huỷ/Tạo bar.
- Content never overflows horizontally: no `100vw` widths, no fixed widths over the viewport; long text truncates or wraps (titles 2 lines on mobile).
- Same React tree across breakpoints for stateful children (filters, forms). Reflow with CSS/responsive classes or conditional wrappers that keep the child at the same position, so resizing never remounts and never loses typed input.
- Only ONE create action may exist in the accessibility tree (button in header on desktop, FAB on mobile; conditional render, not CSS-hidden duplicates).

## 5. Screens (boards on the canvas in parentheses)

### 5.1 Task list `/tasks` (Main.dc.html, M-danh-sach, M-bo-loc, M-drawer)
- Header row: H1 "Danh sách nhiệm vụ" left, primary button "Thêm nhiệm vụ" (Plus) right. Nothing else on that row.
- One white card (padding 16, gap 12) containing in order: Row A = underline Tabs (left) + inline legend (right); Row B = filter bar; Row C = table + footer.
- Scope tabs (URL `scope`): `mine` / `created` / `all`. Proposed labels "Giao cho tôi" / "Tôi giao" / "Tất cả" (old code: "Của tôi", "Tôi giao", "Tất cả"; decision D3). Show counts per scope (independent of active filters). "All" is limited by permission and current view scope. Changing tab keeps filters, resets to page 1, per-tab empty messages ("Bạn chưa được giao nhiệm vụ nào", etc.). Show "N bộ lọc đang bật - Xoá hết" when filters are active.
- Filters (one row, equal widths, labels above): Từ ngày, Đến ngày (from <= to enforced), Mã / Tên nhiệm vụ (Enter applies), Phòng ban (Tất cả phòng ban), Trạng thái (Tất cả trạng thái; options from statusMeta), then a 40x40 blue search button. Draft values live in the filter component; "Áp dụng"/search writes the URL; Reset clears drafts immediately AND the URL.
- Legend (inline on desktop): Đang thực hiện, Chờ phê duyệt, Hoàn thành, Quá hạn, Mới tạo (dots from statusMeta). On mobile a compact strip or inside the filter sheet.
- Table columns on desktop (widths sum to 100%, fixed layout): STT 5% (center, zero padded 01), Mã NV 12% (link to detail, primary, weight 500), Nhiệm vụ 27%, Phòng ban 15%, Người xử lý 15%, Hạn 10% (DD/MM/YYYY), Trạng thái 10% (StatusText), Thao tác 6% (right: view eye, download). Row click opens detail.
- Mobile card: line 1 code (blue) + status (right); line 2 title (up to 2 lines); line 3 "Phòng ban • Hạn dd/MM". STT, separate columns and action icons are hidden (actions as trailing action). Pagination "‹ Trang 1/8 ›", FAB for create.
- URL contract: `scope, search, fromDate (YYYY-MM-DD), toDate, department, status, page (1-based), size (10|20|30|50)`. Defaults are NOT written (page 1, size 10, scope default). Invalid values fall back safely; page beyond the last page is replaced (history replace) by the last page once the total is known. Page change = push, size change = replace and reset page to 1, apply/reset/tab change = reset page to 1. One hook is the single writer of the list URL and uses functional `setSearchParams(prev => ...)`.

### 5.2 Task detail `/tasks/:id` (Chi-tiet-nhiem-vu)
Breadcrumb "← Danh sách nhiệm vụ › NV-2026-0891". Header card: title (for example "Module API đồng bộ dữ liệu V16.8") + code chip, status row (● Chờ phê duyệt nghiệm thu, ! Khẩn cấp), actions Chỉnh sửa (outline), Giao lại (outline), Phê duyệt nghiệm thu (primary). Tabs: Tổng quan / Lịch sử xử lý / Bình luận. Left card: Mô tả + Lịch sử xử lý (timeline: date-time + event). Right: card Thông tin (người xử lý, phòng ban, người giao, tệp đính kèm) and card Tiến độ và SLA (progress bar, % and due date).

### 5.3 Approve acceptance `/tasks/:id/approve` (Chi-tiet-nghiem-thu, M-phe-duyet)
Stacked header (never two columns below 1200px, nothing wraps): breadcrumb (one line, back arrow icon, last item blue) -> title "Phê duyệt nghiệm thu" + code chip -> status row -> one-line description with ellipsis -> action row: "Yêu cầu chỉnh sửa bổ sung" (outline, note icon), "Từ chối nghiệm thu" (outline destructive), "Xác nhận & Phê duyệt hoàn thành" (primary). Body: checklist nghiệm thu (4 items with check icons), "Ghi chú phê duyệt" textarea, side card with info (người xử lý, phòng ban, hạn, ngày nộp, tệp đính kèm). Mobile: back topbar + sticky bottom bar with the primary button full width on top and the two others half-width below. Reject/request-changes open a confirm dialog requiring a reason; approve uses a default-tone confirm (not red).

### 5.4 Create task `/tasks/new` (Them-nhiem-vu, M-them-nhiem-vu)
Form fields: Tên nhiệm vụ, Mô tả (textarea), Phòng ban, Người xử lý, Hạn hoàn thành, Mức ưu tiên (default Bình thường), Tệp đính kèm. Two columns desktop, one column mobile, footer buttons Huỷ + "Tạo nhiệm vụ" (sticky bar on mobile). Zod schema, API field errors mapped, unsaved-changes guard.

### 5.5 Reassign (dialog) (Giao-lai)
Chip with task code, "Người xử lý hiện tại: ...", fields Phòng ban nhận, Người nhận, Lý do giao lại (required textarea), buttons Huỷ / "Xác nhận giao lại". Dialog on desktop; bottom sheet or full screen on mobile.

### 5.6 Lessons learned `/lessons` (Bai-hoc-kinh-nghiem)
Header "Bài học kinh nghiệm" + "Thêm bài học"; white card with a warning line in red text and icon ("Chú ý quy định: [Bài học #3] ..."; not a tinted banner); filter row (Từ khoá, Nhóm, Trạng thái, search); table: Mã (BH-006), Tiêu đề, Nhóm (Quy trình, SLA, Phân quyền, Biểu mẫu), Số quy định, Ngày tạo, Trạng thái (Đang áp dụng green / Lưu nháp gray), Thao tác (view, edit).

### 5.7 Messages `/messages` (Bang-tin-nhan)
Header + "Soạn tin"; tabs Tất cả / Chưa đọc / Đã gửi; master-detail: left 1/3 list (avatar initial, sender, snippet, time, unread = bold name), right 2/3 message (subject, sender, time, linked task chip, body, reply textarea + "Gửi"). Stacked on mobile.

### 5.8 Today's to-do `/todo` (Viec-can-lam)
Header "Việc cần làm hôm nay" + count chip ("4 việc"); card with rows: checkbox, task code link, title, due (Hôm nay/Mai), status text; footer "Đã hoàn thành 0 trên 4 việc" + "Làm mới".

### 5.9 SLA detail `/sla` (Chi-tiet-SLA)
Breadcrumb "Bảng điều khiển › Chi tiết SLA", H1, period select (Tháng 11/2026). Four flat KPI cards: NHIỆM VỤ MỚI TRONG KỲ 189, ĐÃ HOÀN THÀNH 134, ĐÚNG HẠN 117, HOÀN THÀNH TRỄ 17. Note line (how on-time rate is computed, period 01/11/2026 ~ 30/11/2026). Table by member: Mã NV (IT-00102), Tên nhân sự, Phòng ban, Giao trong kỳ, Đã hoàn tất, Đúng hạn, Trễ hạn (red only when > 0), Tỉ lệ đạt (plain text, e.g. 95,4%), Trạng thái (text), Thao tác. 212 members in mock.

### 5.10 Admin (Quan-ly-nguoi-dung, Vai-tro-phan-quyen, Phong-ban)
- Users: filters (Từ khoá, Phòng ban, Vai trò, Trạng thái); table Mã NV, Họ tên, Phòng ban, Vai trò, Đăng nhập gần nhất, Hoạt động (Switch), Thao tác (edit, lock); button "Thêm người dùng".
- Roles and permissions: left list of roles (Quản trị viên, Trưởng bộ phận, Người duyệt, Nhân viên), right permission matrix (rows: Xem nhiệm vụ; Tạo và giao nhiệm vụ; Giao lại nhiệm vụ; Phê duyệt nghiệm thu; Quản lý bài học kinh nghiệm; Quản trị hệ thống; columns Xem / Tạo / Sửa / Duyệt as checkboxes), buttons Huỷ / Lưu thay đổi.
- Departments: tree table, root "Ban Công Nghệ (BP-IT)" with children indented (Hạ Tầng Mạng BP-IT-01, An Toàn Thông Tin BP-IT-02, Phần Mềm Lõi BP-IT-03, Kiểm Thử QA/QC BP-IT-04, Cơ Sở Dữ Liệu BP-IT-05 inactive); columns Phòng ban, Mã, Trưởng bộ phận, Số nhân sự, Hoạt động, Thao tác.

### 5.11 Dashboard `/dashboard` (NOT designed in the new style; build it flat)
Original content to keep: current-view scope ("Góc nhìn hiện tại: BP. IT", change department action), lessons-learned reminder (3 rules, link "Mở trong danh sách"), period statistics with a period select (Tháng này), KPI cards (new tasks 189 with sub-metrics quá hạn 0 and đang xử lý 66; completed 134 with sub-metrics đúng hạn 117 and hoàn thành trễ 17), SLA note with link "Chi tiết SLA", last update line ("Cập nhật lúc ... - 212 NV hiển thị - tự cập nhật mỗi 3 phút"), actions Danh sách, Giao lại, Thêm nhiệm vụ, refresh, and the per-member table. New style requirements: white cards with gray borders only, no tinted banners, no black/green action buttons (all blue/outline), numbers dark (not green), no percent/delta badges, status as colored text, compact density, KPI row + table within the fixed-height rules. Design it first on the canvas or propose a layout and get approval.

### 5.12 Error pages (full page, outside the app shell) (Khong-tim-thay, Khong-co-quyen, Loi-he-thong, M-loi)
One `ErrorState` with a status config (single source). Layout: header 64px (logo, app name, "Hỗ trợ" link), content column max 560px left-aligned: caption row (icon 18px + uppercase 12px/600 tracking .06em, tone color, e.g. "Lỗi 404 • Không tìm thấy") -> H1 32px/600 (26px mobile) -> description 16px/#6B7280 -> actions (primary left, outline right; stacked full width <600px) -> bottom section; footer "© 2026 Điều Phối • Phiên bản V16.8". No illustrations, no giant numbers, no emoji. Never show raw error text in production.
| Status | Icon / tone | Title | Actions | Bottom |
|---|---|---|---|---|
| 404 | SearchX / primary | Không tìm thấy trang này | Về trang chính (primary), Quay lại | "Có thể bạn đang tìm": up to 4 menu links the user may access |
| 403 | Lock / warning #B45309 | Bạn chưa có quyền xem trang này | Về trang chính, Quay lại | same links |
| 401 | Lock / warning | Phiên đăng nhập đã hết hạn | Đăng nhập lại | - |
| 408/429 | Clock / warning | Bạn thao tác quá nhanh hoặc kết nối quá chậm | Thử lại | - |
| 500/502/503/504 | CircleAlert / destructive | Hệ thống đang gặp sự cố (503 "Hệ thống đang bảo trì", 504 "phản hồi quá chậm") | Tải lại trang (primary), Về trang chính | Reference code box "Mã tham chiếu: ERR-7F3A21 • dd/MM/yyyy HH:mm" + copy button; technical details box ONLY in DEV |
| network | WifiOff / destructive | Không thể kết nối | Thử lại, Về trang chính | reference code |
Descriptions are plain language and constructive (what happened, not the user's fault, what to do next). 500: "Đây là lỗi từ phía hệ thống, không phải do bạn. Hãy thử tải lại sau ít phút. Nếu lỗi vẫn còn, gửi mã tham chiếu bên dưới cho bộ phận hỗ trợ." Router: root `errorElement` renders the full-page ErrorState; `*` catch-all and permission guard also render full-page 404/403; a small class ErrorBoundary around the app; lazy-chunk load failures map to the network variant with "Tải lại trang". An error must never leave the sidebar visible with an empty content area.

### 5.13 Not designed yet (ask before inventing; propose with existing components)
Văn bản hệ thống (system texts / translations manager), Cài đặt cá nhân, Đăng nhập, Đổi bộ phận / góc nhìn, Cấu hình SLA, Danh mục dùng chung, Quản lý quy định, Cấu hình thông báo, Đồng bộ dữ liệu, Nhật ký hệ thống, empty/loading states library, mobile layouts for screens not on the canvas.

## 6. Structure and architecture: owned by the boilerplate
This brief does not define layers, templates or folder layouts. Use the boilerplate's `architecture.md` rule and `project-structure` skill (and its `components`, `tanstack-query`, `http-client`, `zustand`, `form-validation`, `error-handling`, `testing-architecture`, `performance` skills) as written. A previous prototype used extra layers and "page templates"; they are NOT requirements here. Introduce a shared abstraction only when the boilerplate's rules call for it or when real duplication appears across screens (and then place it where the boilerplate says shared code goes).
Project-specific facts the structure must accommodate (not how to organize them):
- Feature areas: tasks, dashboard, lessons, messages, to-do, SLA, admin (users, roles and permissions, departments), plus app-level error pages and auth/session.
- Routes: `/` -> `/tasks`; `/tasks`, `/tasks/new`, `/tasks/:id`, `/tasks/:id/approve`; `/dashboard`; `/sla`; `/lessons`; `/messages`; `/todo`; admin `/admin/users`, `/admin/roles`, `/admin/departments`; `/login`; catch-all 404. Navigation (sidebar items, labels, icons, groups, badges, permissions) comes from one route/nav configuration.
- Permission keys (defaults, confirm with the user): task.view, task.create, task.update, task.assign, task.reassign, task.approve, lesson.view, lesson.manage, system.manage. Role-to-permission mapping and role-to-default-tab mapping live in a single config.
- Product requirements that hold regardless of structure (implement them using the matching boilerplate skills): list state (filters, tab/scope, page, size) lives in the URL with the contract in 5.1; server data via TanStack Query with typed query keys; API calls cancellable and errors normalized to a small set of codes mapped to i18n keys (never raw `error.message` in the UI); forms with Zod + React Hook Form and API field errors mapped back; Zustand only for session, role, locale, UI prefs and dev toggles; all UI strings via i18n; mocks via MSW with the same schemas as the client.

## 7. Domain model and mocks
```ts
type TaskStatus = 'new'|'draft'|'in_progress'|'pending'|'approved'|'done'|'overdue'|'rejected'
type Task = { id: string /* NV-2026-0891 */; title: string; department: string; assignee: string;
              dueDate: string /* YYYY-MM-DD */; status: TaskStatus; urgent?: boolean }
type TaskListParams = { scope:'mine'|'created'|'all'; search?: string; fromDate?: string; toDate?: string;
                        department?: string; status?: TaskStatus; page: number /*1-based*/; pageSize: 10|20|30|50 }
type TaskListResponse = { items: Task[]; total: number }
```
- `GET /api/tasks?scope&search&fromDate&toDate&department&status&page&pageSize` -> `TaskListResponse` (Zod validated, same schema in the MSW handler). Out-of-range page returns empty `items` with the real `total`.
- Mock volume: 190 tasks generated (faker) plus the named sample rows; 212 members; nav badges tasks 73, lessons 6, to-do 0.
- Sample tasks: NV-2026-0891 "Phân tích nhóm AP đang đợi bị lỗi V18.8" (Ban Công Nghệ, Phan Trung Hiếu, 21/11/2026, pending); 0874 "Nâng cấp hệ thống quản lý Trình Thiện" (Lê Hải Nam, 18/11/2026, in_progress); 0852 "Rà soát chính sách an toàn thông tin" (An Toàn Thông Tin, 12/11/2026, overdue); 0871/0870 "Hoàn tất hồ sơ nhân sự" (done); 0866 "Cập nhật thông tin hệ thống". Departments: Ban Công Nghệ, Hạ Tầng Mạng, An Toàn Thông Tin, Phần Mềm Lõi, Kiểm Thử QA/QC, Cơ Sở Dữ Liệu.
- Mock users: Phan Trung Hiếu (20160), Lê Xuân Hải, Nguyễn Hồng Quân, Trần Minh Tuấn, Phạm Thị Lan, Ngô Bảo Châu, Nguyễn An (current user in later runs).
- MSW: one handler file per feature, validated with the same Zod schemas, `delay()` latency, and the same handlers run in Vitest. Dev toggles (DEV-only panel): normal, slow, empty, 401, 403, 404, 500, offline.

## 8. Lessons from the first implementation (apply when consistent with the boilerplate rules)
1. Nav item bold-on-select widened text, a long label ("Nội dung văn bản hệ thống") wrapped and shifted the layout -> constant weight; max 2 lines; shorten labels to about 24 characters ("Văn bản hệ thống"); `scrollbar-gutter: stable`.
2. A title-row + tabs-row + legend-strip + generous padding left only ~5 table rows at 778px height -> merge rows (tabs + legend on one line inside the card), topbar 56px, page padding 16x24, compact density, 8+ rows target.
3. The default React Router error screen leaked to users -> root `errorElement`, full-page `ErrorState`, never show raw messages in production, reference codes instead.
4. Duplicated "mobile" detection (page-level hook vs component-level hooks) and a first-render flash from async media-query hooks -> one source (`noSsr`-style synchronous initial value), pages never read it.
5. Different JSX trees for mobile and desktop remounted the filters and lost typed input -> same tree, responsive wrappers.
6. Reset button did nothing when the URL was already default -> reset clears drafts and URL.
7. Two create buttons (header + FAB) both exposed to assistive tech and neither navigated -> one conditional element with a target route.
8. Hard-coded status options drifted from the legend -> single `statusMeta`.
9. Sentinel values ('all' vs '') with casts -> `undefined` means no filter; Select gets an `allOption`.
10. Column widths summed to 102% -> must sum to 100%.
11. A column hidden on mobile was also dropped on desktop -> mobile roles (`title|subtitle|status|meta|hidden`) apply to mobile only; add `renderMobile` instead of `if (mobile)` inside render functions; `render(row, index)` for the STT column (no row remapping).
12. List state split between component state and URL -> URL is the source, defaults omitted, `replace` vs `push` rules, clamp page, single writer hook.
13. Data layer: no `AbortSignal`, network errors surfaced as English messages, unvalidated JSON, raw string query keys, no `keepPreviousData` (skeleton flash, total dropping to 0) -> use the boilerplate `http-client` and `tanstack-query` skills (cancellable calls, normalized errors, typed keys, previous data kept while refetching).
14. Domain components (TaskRowActions...) inside the shared library and presentation flags on shared components bloated the library -> domain stays in features; named variants only.
15. `paths.ts` in `app/` while features needed it (upward import) -> `lib/paths.ts`.
16. Deep imports into component internals (`statusMeta`) -> expose shared pieces through the module's public entry point instead (per the boilerplate structure rules).
17. `ErrorState` in-layout variant showed an empty gray content area with a visible sidebar -> errors are full page outside the shell.
18. Bundle 1.48 MB because mocks/faker landed in production -> dynamic import of mocks in DEV only; code-split every route.
19. Storybook/Playwright failed with `spawn EPERM` on the Windows dev machine (antivirus or permissions) -> document the fix (exclusions, reinstall node_modules, install Playwright browsers).
20. Fixed-height table scrolling broke whenever a flex ancestor lacked `min-h-0`; use `100dvh`.

## 9. Roadmap for the new repo (each phase has an exit criterion)
| Phase | Scope | Exit criterion |
|---|---|---|
| 0 Bootstrap | Create the repo from the boilerplate template; read its rules and skills; adapt only what this brief requires (project profile, status tokens, light-only theme); install extra deps (MSW, faker, Vitest, Playwright, Storybook + a11y) only if no existing skill or rule objects; lint/CI per the existing rules; no new skills, agents, commands or rules | `npm run check` green; boilerplate structure untouched except documented overrides |
| 1 App shell | Sidebar, topbar, mobile drawer, route/nav config, error pages (section 5.12), session and role stub, dev panel for mock toggles | Shell verified at 320/375/768/1024/1366x650/1440x778; errors never leave an empty content area |
| 2 Tasks slice | list (reference screen), detail, approve, create, reassign, mutations + toasts, permissions | Create -> approve flow works at 375 and 1440 on mocks; list shows >= 8 rows at 1440x778 |
| 3 Dashboard and SLA | dashboard (flat design approved first), SLA detail | Numbers consistent with task data |
| 4 Collaboration | messages, lessons, to-do | No new styling decisions |
| 5 Admin | users, roles/permissions matrix, departments | Permission guard and nav group verified per role |
| 6 Hardening | a11y pass, long-text locale, performance, empty/error states everywhere, e2e, docs | Definition of done holds for all screens |

Definition of done (every screen): follows the boilerplate rules and the section 3 visual spec; loading, empty and error states; list state in the URL; one create action in the accessibility tree; verified at the design viewports with no horizontal overflow or layout shift on active states; keyboard and screen-reader basics; no literal strings; lint, typecheck, tests, build and Storybook build pass.

## 10. Decisions
Already decided:
- UI: shadcn/ui standards, Tailwind, `lucide-react` only. No MUI, no Emotion, no other icon library.
- Structure and architecture: the boilerplate's rules and skills. No layers/templates from the previous prototype.
- Agent configuration is frozen: no new skills, agents, commands or rules; no edits to existing ones; deviations are documented in docs/, not in `.claude/`.
- Light theme only for v1 (dark mode deferred, no `dark:` classes).
- Status is colored text only; flat style (no shadows/gradients/tinted cards); constant font weight on active states; compact table density on data screens; full-page error screens; URL is the source of truth for list state.
Still open (ask the user, propose a default):
- D2 Where the major layout switch happens: recommended Tailwind `lg` (1024px); portrait tablets get the mobile layout.
- D3 Scope tab labels and default scope per role ("Giao cho tôi / Tôi giao / Tất cả", counts, optional "Cần tôi xử lý" later).
- D4 "Thêm nhiệm vụ" (design) vs "Tạo nhiệm vụ". Default: "Thêm nhiệm vụ".
- D5 "Bảng điều khiển" vs "Tổng quan"; "Văn bản hệ thống". Default: design names.
- D6 Roles, permission keys, primary user (assignee vs dispatcher).
- D7 Zustand scope. Default: session, role, locale, UI prefs, dev toggles.
- D8 First-release scope. Default: shell, error pages, tasks slice, minimal login and personal settings.

## 11. First message to the agent in the new repo
"Read docs/PROJECT_BRIEF.md, then the boilerplate's CLAUDE.md, AGENTS.md, every file in .claude/rules and the skills project-structure, components, tanstack-query, http-client, zustand, form-validation, error-handling, responsive-design, design-tokens, dashboard-design. This project follows the boilerplate's structure and conventions completely; the brief supplies product, design and screen requirements only. Do NOT introduce layers, templates, 'composed' folders or any structure from the brief or from earlier plans. Do NOT create new skills, agents, commands or rules and do NOT edit existing ones; use the existing skills only (name which skill you invoke for each task) and ask me about any conflict. First answer in writing, quoting the boilerplate files: (1) the exact folder structure and file placement rules they prescribe; (2) where route-level pages, shared components, hooks, API code, schemas, stores and tests go; (3) which boilerplate rules or skills, if any, mention page templates or reusable page layouts. Then list real conflicts between the brief and the boilerplate (quote both sides), propose resolutions, and wait for my approval before changing files."