# Legacy context analysis — README

> Status: analysis only (docs). No code in `src/` was changed. No decision recorded in `docs/DEVIATIONS.md` or `docs/PROJECT_BRIEF.md` was changed by this analysis.
> Date: 2026-11-20. Analyst: AI agent (new to the project, context built only from the repo).

## 1. Scope

Rebuild "Điều Phối" (派案系统 / Hệ thống điều phối) as a **new frontend only**. The existing backend (`Dispatch.js`, Node) and its database (`dispatch_database_v10.db`) must **not** change; the new SPA must conform to the real API. There is **no backend source code**. Every statement about the backend in these documents is derived from how the legacy frontend calls it, or from legacy code comments, and carries a confidence tag.

## 2. Method

1. Orientation: read `CLAUDE.md`, `AGENTS.md`, `.claude/rules/*`, `docs/PROJECT_BRIEF.md`, `docs/DEVIATIONS.md`, `docs/DEAD-CODE-REPORT.md`, `git log`, `git status`.
2. Indexed the two legacy files: function signatures (utils: 616, html: 237 entries) and every literal `/api/...` reference (173 occurrences, ~50 distinct paths).
3. Read the legacy files in line ranges (no full dumps), driven by grep, per analysis area (API, data model, business rules, roles, screens/i18n, integration/mocks). Current repo mocks/schemas (`src/mocks`, `src/schemas`, `src/services`, `src/features/*/api`) were read-only compared against legacy reality.
4. No code was executed against any server; no network calls; no installs; no commits.

## 3. Confidence tags

| Tag | Meaning |
|---|---|
| **[OBSERVED]** | Directly visible in legacy FE code: request shape, field access, branch on a status code. |
| **[INFERRED]** | Deduced from usage; the source of the deduction is stated. |
| **[COMMENT]** | Stated only in a code comment (e.g. "后端检查 / enforced by backend"); unverified. |
| **[UNKNOWN]** | Needed but not derivable from the provided files. |
| NOT VERIFIED | The analyst did not check this claim against code. |

Evidence format: `Dispatch-utils.js:L505-L506` or `Dispatch.html:L966`, or a verbatim quote of at most 3 lines.

## 4. Files read

| File | Lines | Bytes | Notes |
|---|---|---|---|
| `docs/legacy/Dispatch-utils.js` | 11,459 | 874,407 | Shared FE library. `DU_VERSION = '16.11.0'`, `DU_BUILD = '16.11.0-r20'` (L505-L506). **Note:** the user context said build r11; the file is r20 (r11 is one of the changelog entries). L1-L500 is a changelog + comment-declared backend contract (L481-L498). |
| `docs/legacy/Dispatch.html` | 6,062 | 523,862 | Main console page. Early `<script>` at L6, CDN scripts at L463-L464 (Tailwind CDN, lucide 0.469.0 UMD), `<script src="Dispatch-utils.js?v=16.11.0-r20">` at L966, main inline script from L967 (header comment with admin API contract). |
| `docs/PROJECT_BRIEF.md` | 266 | 40,387 | Product/design brief (version label V16.8.0 in brief vs V16.11.0 in legacy). |
| `docs/DEVIATIONS.md` | 107 | 10,245 | Decisions log (D2-D8 recorded there; D6/D8 now reopened by the user). |
| `docs/DEAD-CODE-REPORT.md` | 34 | 5,252 | Stage 2 findings. |
| `CLAUDE.md`, `AGENTS.md`, `.claude/rules/*` | — | — | Boilerplate rules (frozen). |
| `src/mocks/**`, `src/schemas/**`, `src/services/http.ts`, `src/features/*/api/**` | — | — | Read-only, for the mock-fidelity comparison (see 05). |

Line counts measured with `(Get-Content <file>).Count`.

## 5. Referenced but NOT provided

| Missing item | Referenced as | Evidence (examples) | Impact |
|---|---|---|---|
| Backend `Dispatch.js` | API server, DB owner | `Dispatch-utils.js:L5-L6`, `L481-L498` | All backend behavior is [INFERRED]/[COMMENT]/[UNKNOWN]. |
| `Dispatch-task.html` | task page (93 mentions) | `Dispatch-utils.js:L9`, `L5` | Task-detail/standalone task page behavior unknown. |
| `Dispatch-cell.html` | mobile page (48 mentions), phones auto-redirect there | `Dispatch-utils.js:L522-L524` | Legacy mobile UX unknown. |
| `Dispatch-br.html` | supervisor board (主管看板) (33) | `Dispatch-utils.js:L62` | Supervisor KPI board unknown beyond shared utils. |
| `dispatch-kpi.html` | KPI page (42) | `Dispatch-utils.js:L9` | KPI page layout unknown (formulas live in utils). |
| `dispatch-learnknow.html` | lessons page (21) | grep count | Lessons management UI unknown. |
| `Dispatch-language.html` | language / i18n override editor (16) | grep count | "Văn bản hệ thống" legacy editor unknown. |
| `DU_wrLast.html`, `rep.html`, `r.html`, `info.html`, `sh.html` | *(Verified NOT missing HTML pages)* | `Dispatch-utils.js:L7692, L7731` | False positives from `.html` regex — these are JS object property accesses (`.html` string fields). |
| Database schema `dispatch_database_v10.db` | | `Dispatch-utils.js:L6` | Column types/constraints [UNKNOWN]; only FE field access known. |

## 6. Deliverables

| File | Content |
|---|---|
| [01-api-contract.md](01-api-contract.md) | Task A — endpoint inventory + contract-confidence table |
| [02-data-model.md](02-data-model.md) | Task B — entity/field catalogs + encoded-field decoding rules |
| [03-business-rules.md](03-business-rules.md) | Tasks C + D — FE business rules, roles/permissions, Role x Action matrix |
| [04-screens-map.md](04-screens-map.md) | Task E + F — legacy screens vs brief, i18n facts |
| [05-integration-and-mocks.md](05-integration-and-mocks.md) | Tasks G + H — deployment/compat facts, mock fidelity |
| [06-contract-probes.md](06-contract-probes.md) | Task I — safe read-only GET probes for the user to run |
| [07-open-questions.md](07-open-questions.md) | Task J — gaps, risks, decisions only the user can make |
