# 06 — Contract Verification Plan (Safe Read-Only Probes)

> **Purpose**: Safe, read-only `GET` probes the user can run against the live legacy backend after logging in via the browser (copying `username` and `x-session-token` from DevTools → Network or `sessionStorage.getItem('dispatch_session_v15')`), to capture real JSON shapes and confirm `[INFERRED]` / `[UNKNOWN]` fields.
>
> **Safety rules**:
> - **READ-ONLY `GET` endpoints ONLY.** Never run `POST`, `PUT`, or `DELETE` during contract capture.
> - **Never commit raw JSON captures** to git (save them outside the repo or in a temporary ignored folder, and redact before sharing).
> - **Never paste real tokens, passwords, or PII** into prompts or docs.

---

## 1. Safe Read-Only `GET` Probes

| # | Path | Auth Required | Purpose | What to Look For / Verify |
|---|---|---|---|---|
| 1 | `GET /api/session/verify` | Yes | Confirm exact `user` object shape | Presence & format of `menu_perms` (JSON string vs object vs null), `role`, `dept`, `site`, `auth_source`, `status`, `email`, `title`, `id`. |
| 2 | `GET /api/meta/sites` | No | Confirm site catalog envelope | `{ sites, allSites, otherValue }` keys, `active` boolean vs `0/1`, `builtin` flag. |
| 3 | `GET /api/meta/depts` | No | Confirm department catalog envelope | `{ depts, allDepts }` keys, Traditional vs Simplified `value` strings, `source` (`local` / `ad_ou`), `ou_dn`. |
| 4 | `GET /api/i18n/overrides` | No | Confirm server i18n override format | `{ success, version, items }` — exact structure of `items` (object map vs array, language keys `zh`/`tw`/`vn`/`en`?). |
| 5 | `GET /api/users/directory` | Yes | Confirm directory user fields | Bare array vs envelope; exact keys (`username`, `fullname`, `dept`, `site`, `role?`, `status?`). |
| 6 | `GET /api/tasks` | Yes | Confirm full Task object & lack of server pagination | Confirm bare array; inspect 1–2 normal, 1 recurring, 1 split-group, 1 paused, 1 project (`work_items`), 1 confidential task. Check exact date formats (`YYYY-MM-DD HH:mm:ss` vs ISO), `attachments`, `type_detail`, `req_depts`, `split_members`, `work_items`, `paused`, `confidential`, `readers`, `cross_viewers`, `first_response_mins`, `reporter_dept`, `reporter_name`. |
| 7 | `GET /api/tasks/<TASK_ID>/reports` | Yes | Confirm Report object shape | Bare array; check `id`, `task_id`, `username`, `fullname`, `content`, `progress`, `attachments`, `km_link`, `pause_action`, `work_topics`, `createdAt`, `updatedAt?`. |
| 8 | `GET /api/tasks/history/mine?limit=5` | Yes | Confirm clone-history envelope | `{ items: [...] }` vs bare array; whether fields match `GET /api/tasks`. |
| 9 | `GET /api/tasks/dup-check?title=__probe_nonexistent__&due=2099-12-31` | Yes | Confirm duplicate-check response shape | `{ success, duplicate: false, ... }`. |
| 10 | `GET /api/lessons` | Yes | Confirm lessons envelope & fields | `{ list: [...] }` envelope; fields (`id`, `title`, `keywords`, `keyword_list`, `content`, `images`/`attachments`, `category?`, `status?`, `createdAt`). |
| 11 | `GET /api/todos?date=2026-11-20` | Yes | Confirm todo response shape | `{ task_data: [{ id, start_time }] }` vs other keys. |
| 12 | `GET /api/messages` | Yes | Confirm message & reply fields | Bare array; `id`, `username`, `fullname`, `content`, `createdAt`, `ip`, `replies[]`. |
| 13 | `GET /api/work-records?user=<USERNAME>&start=2026-11-01&end=2026-11-20` | Yes | Confirm work-record row fields | Bare array; check `task_id`, `task_title?`, `content`, `progress`, `createdAt`, etc. |
| 14 | `GET /api/pocket/task-types` | Yes | Confirm task-type pocket shape | Bare array `[{ id, value }]`. |
| 15 | `GET /api/pocket/type-detail` | Yes | Confirm type-detail pocket shape | Bare array `[{ id, kind, value }]`. |
| 16 | `GET /api/pocket/req-dept` | Yes | Confirm req-dept pocket shape | Bare array `[{ id, value }]`. |
| 17 | `GET /api/pocket/contacts` | Yes | Confirm contact pocket shape | Bare array `[{ id, contact, fullname, dept, source, status }]`. |
| 18 | `GET /api/reports/tasks?purpose=kpi&start=2026-11-01&end=2026-11-30&basis=final` | Yes | Confirm KPI report task payload | Bare array; confirm presence and shape of `all_reports`, `kpi_at`, `recur_cycle_start`, and whether `include_cycles=1` adds virtual cycle rows. |
| 19 | `GET /api/webreports` | Yes | Confirm archived web-reports envelope | `{ success, items: [...] }` fields (`id`, `title`, `report_no`, `range_start`, `range_end`, `subject_label`, `size_bytes`, `file_base`, `createdAt`). |
| 20 | `GET /api/admin/users` *(admin/superadmin only)* | Yes | Confirm admin user record | Bare array; check `menu_perms`, `online`, `last_seen`, `last_login`, `auth_source`, `ad_state`, `ad_synced_at`, `dept_source`, `dept_ou_dn`, `merged_into`. |
| 21 | `GET /api/admin/sites` *(superadmin only)* | Yes | Confirm admin site record | `{ success, sites: [{ value, name, vn, label, users, builtin, active, created_by, createdAt }] }`. |

---

## 2. Excluded or Run-With-Care Endpoints

| Endpoint | Why Excluded / Caution |
|---|---|
| All `POST` / `PUT` / `DELETE` endpoints | Mutate database, session state, or server filesystem (e.g. `POST /api/session/heartbeat`, `POST /api/admin/archive`, `POST /api/admin/ad/sync`). **Do NOT run.** |
| `GET /api/admin/ad/diagnose` | **Run with care / exclude from routine capture**: performs live DNS lookups, TCP port probes, and LDAP bind/search against Domain Controllers, and **mutates server state** if it finds a working DC (`"已自动采用可用位址"` at `Dispatch.html:L5359`). |
| `GET /api/admin/ad/users?disabled=1&refresh=1` | **Exclude** unless specifically testing AD: queries live Active Directory and returns sensitive employee PII/DNs. |
| `GET /api/admin/ad/ous?refresh=1` | **Exclude** unless needed: queries live AD. |
| `GET /api/admin/archive/info` | **Run with care**: exposes server filesystem paths (`defaultPath`, `uploadsDir`, `dbPath`). Redact all paths before sharing. |
| `GET /api/webreports/:id` | Returns full HTML containing task/employee data; unnecessary for JSON contract verification. |

---

## 3. PowerShell Probe Template (Placeholders Only)

Replace `<ORIGIN>`, `<USERNAME>`, `<TOKEN>`, and `<TASK_ID>` with values copied from your own logged-in browser session (DevTools → Application → Session Storage → `dispatch_session_v15`). Run in PowerShell outside the git repo (e.g., `$env:TEMP\dispatch-probes`).

```powershell
# === FILL IN FROM YOUR OWN BROWSER SESSION (NEVER COMMIT) ===
$Origin   = "<ORIGIN>"     # e.g. http://192.168.x.x:3000 (no trailing slash)
$Username = "<USERNAME>"   # raw username, e.g. jdoe
$Token    = "<TOKEN>"      # x-session-token from sessionStorage['dispatch_session_v15']
$TaskId   = "<TASK_ID>"    # an existing visible task ID (numeric)
$OutDir   = Join-Path $env:TEMP "dispatch-probes"

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$Headers = @{
    "username"        = [uri]::EscapeDataString($Username)
    "x-session-token" = $Token
}

$Probes = @(
    @{ Name = "01-session-verify";   Path = "/api/session/verify";                                   Auth = $true  }
    @{ Name = "02-meta-sites";       Path = "/api/meta/sites";                                       Auth = $false }
    @{ Name = "03-meta-depts";       Path = "/api/meta/depts";                                       Auth = $false }
    @{ Name = "04-i18n-overrides";   Path = "/api/i18n/overrides";                                   Auth = $false }
    @{ Name = "05-users-directory";  Path = "/api/users/directory";                                  Auth = $true  }
    @{ Name = "06-tasks";            Path = "/api/tasks";                                            Auth = $true  }
    @{ Name = "07-task-reports";     Path = "/api/tasks/$TaskId/reports";                            Auth = $true  }
    @{ Name = "08-history-mine";     Path = "/api/tasks/history/mine?limit=5";                       Auth = $true  }
    @{ Name = "09-dup-check";        Path = "/api/tasks/dup-check?title=__probe__&due=2099-12-31";   Auth = $true  }
    @{ Name = "10-lessons";          Path = "/api/lessons";                                          Auth = $true  }
    @{ Name = "11-todos";            Path = "/api/todos?date=$(Get-Date -Format 'yyyy-MM-dd')";      Auth = $true  }
    @{ Name = "12-messages";         Path = "/api/messages";                                         Auth = $true  }
    @{ Name = "13-work-records";     Path = "/api/work-records?user=$([uri]::EscapeDataString($Username))&start=$(Get-Date -Format 'yyyy-MM-01')&end=$(Get-Date -Format 'yyyy-MM-dd')"; Auth = $true }
    @{ Name = "14-pocket-types";     Path = "/api/pocket/task-types";                                Auth = $true  }
    @{ Name = "15-pocket-detail";    Path = "/api/pocket/type-detail";                               Auth = $true  }
    @{ Name = "16-pocket-reqdept";   Path = "/api/pocket/req-dept";                                  Auth = $true  }
    @{ Name = "17-pocket-contacts";  Path = "/api/pocket/contacts";                                  Auth = $true  }
    @{ Name = "18-reports-kpi";      Path = "/api/reports/tasks?purpose=kpi&start=$(Get-Date -Format 'yyyy-MM-01')&end=$(Get-Date -Format 'yyyy-MM-dd')&basis=final"; Auth = $true }
    @{ Name = "19-webreports";       Path = "/api/webreports";                                       Auth = $true  }
    # Uncomment only if logged in as admin / superadmin:
    # @{ Name = "20-admin-users";    Path = "/api/admin/users";                                      Auth = $true  }
    # @{ Name = "21-admin-sites";    Path = "/api/admin/sites";                                      Auth = $true  }
)

foreach ($p in $Probes) {
    $url = "$Origin$($p.Path)"
    $outFile = Join-Path $OutDir "$($p.Name).json"
    try {
        $reqParams = @{ Uri = $url; Method = "Get"; TimeoutSec = 30 }
        if ($p.Auth) { $reqParams.Headers = $Headers }
        $resp = Invoke-WebRequest @reqParams
        $resp.Content | Set-Content -Encoding UTF8 -Path $outFile
        Write-Host "[OK $($resp.StatusCode)] $($p.Name) -> $outFile"
    } catch {
        Write-Warning "[FAIL] $($p.Name): $($_.Exception.Message)"
    }
}
```

---

## 4. Redaction Checklist (Before Sharing Samples)

Before pasting any captured JSON into chat, tickets, or documentation, redact **every** occurrence of:

- [ ] **Session / Remember tokens**: `token`, `remember_token`, `x-session-token`, cookies.
- [ ] **Usernames & Full names**: `username`, `fullname`, `assign_person`, `reporter`, `reporter_name`, `req_contact`, `readers`, `cross_viewers`, `split_members` assignee names, `work_items` owners/deputies, and any Vietnamese/Chinese names inside free-text `title`, `content`, `precautions`, or `replies`.
- [ ] **Contact & HR identifiers**: `email`, `mail`, `telephone`, `mobile`, `ipPhone`, `employeeID`, `employeeNumber`.
- [ ] **Network & AD infrastructure**: `ip` (in `/api/messages`), server origin/IP, AD `domain`, `url`, `baseDN`, `dn`, `ou_dn`, `bindUser`, `guid`.
- [ ] **Server filesystem & upload paths**: `dbPath`, `uploadsDir`, `defaultPath`, attachment `path`/`name` if they contain sensitive filenames or internal paths, `km_link` internal URLs.
- [ ] **Confidential task bodies**: drop or replace `title`, `content`, `precautions`, `cost_estimate` for any task with `confidential > 0` or sensitive business data.
- [ ] **Keep structure intact**: keep 1–3 representative objects per array (truncating the rest) so field names, value types, nullability, and delimiter formats remain visible.
