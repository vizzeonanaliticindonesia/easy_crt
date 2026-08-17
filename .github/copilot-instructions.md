# Copilot Instructions — SubTeach project conventions

> **Revision note (2026-08-15):** Rewritten after a QA-led fixing pass closed ~30 of the original 83 documented bugs (plus ~10 new ones found along the way) across 3 priority tiers: type-system unification, auth/security cluster, and a session-detail/profile/create-session cleanup pass. Every rule below reflects **verified current code state**, not aspiration — checked via `tsc --noEmit` (114 → 20 errors) and the Jest suite (10/10 passing) after each tier. Where something is still incomplete or unverified, it's called out explicitly rather than glossed over — a wrong assumption here is worse than an honest gap. Full detail: `qa/fixing-session-report.pdf` and `qa/priority-order.pdf`.

---

# SubTeach — Project conventions for Copilot

You are helping develop **SubTeach**, a React Native Expo app for substitute-teacher booking. Two user roles: teachers (`role = 9`) and schools (`role = 10`). Backend is CodeIgniter at `https://teacher-relief.kreatifa.com/api`; bearer-token auth.

When suggesting code, follow these rules.

## 1. Role handling

- `User.role` is **numeric: `9 | 10`**. Never compare it to string literals (`'teacher'`, `'school'`, `'9'`, `'10'`), and prefer `===` over `==` even for numeric comparisons.
- `lib/roles.ts` exports `normalizeRole`/`isTeacher`/`isSchool`. `normalizeRole` is a real dependency (used by `lib/services/document-routing.ts`). `isTeacher`/`isSchool` are correct but **not yet adopted** — most screens still do `user?.role === 9` inline. Prefer the helpers in new code; don't block a PR over existing inline checks.
- Role normalization happens once, in `contexts/AuthContext.tsx` at login. Downstream code can assume `user.role` is `9 | 10 | undefined`.
- **Incident this rule prevents:** cross-school data leakage — `user.role === 'school'` was always false because `role` had already been normalized to numeric, silently disabling a filter.

## 2. HTTP requests

- All HTTP calls go through `lib/api.ts`'s `api.get / api.post / api.put / api.del`. **Do not call `fetch(...)` directly** from screens, contexts, or services — the wrapper handles bearer-token injection, base URL, JSON parsing, and error normalization (`request()` throws `{status, message, data}` on non-2xx; catch and inspect that shape, don't re-parse a raw `Response`).
- The base URL is `export const BASE_URL` in `lib/api.ts` — import it, never hardcode the host string. (Previously duplicated as a literal in 3 places in `AuthContext.tsx`; now centralized.)
- **Incident this rule prevents:** a backend domain migration (`vizzeon.com` → `kreatifa.com`) only touched some call sites, producing a split-brain backend where auth and data hit different hosts.

## 3. Logging — never log secrets or PII

- Never `console.log` any of: bearer tokens, `user.token`, the full `user` object, full booking/session objects, full API response payloads, Stripe `paymentMethod.id`, password, or raw suburb/upload API responses.
- `console.error(...)` in a `catch` block is fine for debugging — it's the *response-body-dumping* `console.log` calls that leaked data (a fixing pass removed ~25 of them across `_layout.tsx`, `invoices.tsx`, both profile screens, `session-confirmation-detail.tsx`).
- Hermes production builds still execute `console.log`; output reaches `adb logcat`, iOS unified log, and crash-reporter breadcrumbs.

## 4. Type safety — `types/index.ts` is the contract, but verify it against real usage first

- `TeachingSession` and `AppNotification` are **snake_case** (`school_id`, `teacher_id`, `subject_name`, `is_read`, `created_at`, `schedules: ScheduleSlot[]` with `schedule_date`/`start_time`/`end_time`). This is now enforced consistently across `SessionContext.tsx`, `mockData.ts`, `SessionCard.tsx`, `upload-payment.tsx`, `review-teacher.tsx`, and the repository files — this was the single largest bug cluster in the codebase (~55 of 114 original TS errors traced to this one unresolved rename).
- **Known gap, don't assume it's fixed elsewhere:** `app/session-detail.tsx` and `app/session-confirmation-detail.tsx` fetch real API data typed as `any` (via `getDashboardData()`/`getTeacherDashboardData()`/`getSessionConfirmationDetails()`), and that payload's actual field names (`request_status`, `teacher_user_id`, `notification_status`, `rn_id`) **do not match** the `TeachingSession` type at all. Don't assume a field exists on `TeachingSession` just because it's used in `session-detail.tsx` — check the file directly.
- `InvoiceRecord`/`InvoiceStatus`/`InvoicePaymentMethod`/`SchoolDocument`/`TeacherDocument`/`SubjectItem` exist in `types/index.ts` (previously imported in 6+ files but never defined). **They model the mock/local repository system** (`lib/invoices.ts`, `lib/mockData.ts`), not the real `invoices.tsx` screen, which uses its own untyped snake_case shape with numeric status codes (`'1'`/`'2'`/`'3'`). Don't force these types onto real invoice data — two genuinely different shapes exist under similar names.
- `as any` on object literals should come with a one-line comment explaining why, not be silent.

## 5. Two parallel session/data models exist — know which one you're touching

- **Model A (real, live):** `session-detail.tsx`, `create-session.tsx`, `session-confirmation-detail.tsx`, `invoices.tsx` — call `lib/services/school.ts`/`lib/services/teacher.ts` directly, get real snake_case API responses, mostly typed `any`.
- **Model B (mock/local):** `SessionContext.tsx` + `lib/mockData.ts` + `lib/repositories/*` — AsyncStorage-backed, seeded from `mockData.ts`, typed against `TeachingSession`/`AppNotification`. Used by `upload-payment.tsx`, `review-teacher.tsx`'s display header, and notification bookkeeping.
- **These do not share data.** A real booking created via `create-session.tsx` never appears in Model B's `sessions` array. Before wiring a new screen to `useSession()`, check whether the data you need is actually real-booking data (→ use Model A / a direct service call) or session-bookkeeping/notification data (→ Model B is fine). `upload-payment.tsx` is currently broken *because* it queries Model B for what should be Model A data — it's also an orphaned route today (nothing navigates to it), left unfixed pending a product decision on where a bank-transfer-proof-upload flow should live.

## 6. AsyncStorage — never persist secrets

- The persisted `User` object does **not** include `password` (`AuthContext.register()` used to write it, though that function turns out to be dead code, never called from any screen). Don't reintroduce a `password` field on `User`.
- The bearer `token` is the only secret stored client-side.

## 7. Async UI patterns

- Guard every async action handler with a `busy`/`actionBusy` state + `disabled={busy}` on the trigger — see `session-detail.tsx`'s `handleTeacherAction` for the pattern (early-return guard + `disabled`/`loading` props on the button, not just one or the other).
- Every async fetch needs try/catch/finally with a real error UI + retry path, not just `console.error` and an infinite spinner (`session-detail.tsx`'s `fetchData` is the reference implementation: `loading`/`loadError` states, a "Retry" button).
- Full `AbortController` cancellation isn't available — `lib/api.ts`'s `request()` doesn't accept a signal. Where unmount-safety matters, use a `mountedRef` guard around `setState` calls instead (see `session-detail.tsx`).

## 8. Status comparisons — no magic values, and verify before "fixing"

- Use `===`, never `==`.
- Status codes ARE consistently `'1'` = paid/completed, `'2'` = waiting/pending-confirm, `'3'` = rejected across `ScheduleCard.tsx`'s `normalizeStatus`, `invoices.tsx`, and `session-confirmation-detail.tsx`. **Don't "fix" a `booking_status === '1'` comparison without checking `ScheduleCard.tsx` first** — a previous dev doubted their own correct code in a comment; the value was right, only the `==`→`===` needed tightening.
- `resolveSessionStatus` (in `components/ui/AppPrimitives.tsx`) takes the *session-level* status string, not a per-schedule-slot field. `session-detail.tsx` needs `session.request_status`, not `session.status`/`session.is_confirm` (neither exists on the real payload). If you see `resolveSessionStatus(session.status, ...)` anywhere else, check whether that call site has the same bug.

## 9. Role-aware screens must actually route by role

- If a screen is reachable by both roles, every action handler must branch on role and call the role-appropriate service function — and that function must actually exist. `lib/services/document-routing.ts`'s `updateDocumentForRole` is the reference pattern (dependency-injected `editTeacherDocument`/`editSchoolDocument`, throws on unrecognized role).
- **`editTeacherDocument`, `editSchoolDocument`, and `getTeacherDashboardData` (in `lib/services/teacher.ts`/`school.ts`) have unverified endpoint paths** (`/school/document/update`, `/teacher/document/update`, `/teacher/dashboard/get_data` — following the established `/school/X/insert`+`/school/X/delete` and `/school/dashboard/get_data` naming conventions, but never confirmed against real backend routes). Same for `confirmAttendance`/`unableAttendance` (`/teacher/session/confirm_attendance`, `/teacher/session/unable_attendance`) and `create-session.tsx`'s `deleted_request_ids` payload field. **Do not treat these as confirmed contracts** — verify against the actual CodeIgniter routes (or ask the backend dev) before relying on them further, and update the `NOTE:` comments in-file once confirmed.

## 10. Defense in depth on multi-tenant data

- `lib/tenant.ts` exports `filterSchoolOwnedItems`/`filterTeacherOwnedItems` (split from a single `filterTenantOwnedItems` that had an OR-logic bug: matching on *any* of school_id/teacher_id/payer_school_id let a school see a same-numbered-ID teacher's items). Not currently wired into any real screen — if you're about to add client-side tenant filtering, use these, don't write new filter logic inline.

## 11. Status machine

```
pending → accepted → checked_in → attendance_confirmed → completed
       → completion_confirmed → invoice_sent → payment_uploaded → payment_confirmed → reviewed
                                                                          ↘ declined (from any pre-completed state)
```
Also valid (slot-level attendance display, not session-level): `attended`, `unattended`.

- Never skip states. Never write a "testing helper" that force-flips status in a production data loader (the "Sarah Johnson" hack that did exactly this has been removed).
- Gate action buttons on the actual prerequisite state, not just adjacent fields — e.g. "Check Out" requires `slot.check_in_time != null`, not just `slot.status === '0'`.

## 12. Forms

- Email validation: use `isValidEmail` from `lib/forms.ts` (regex-based, tested in `__tests__/regressions/forms-validation.test.ts`). **Not** `.includes('@')`.
- Coerce numeric form values with `coerceNumber` from `lib/forms.ts`, not raw `Number(x) || 0` inline.
- Validate every field that's actually submitted in the payload, not just the visually-marked-required ones — `create-session.tsx` had a form field (`requireWwcc`) that was collected and displayed but never included in the submitted payload at all. Check the payload construction against the form state, not just the validation function.
- Not yet done anywhere: persisting drafts of long forms (register-teacher, register-school, create-session) to AsyncStorage. Worth doing if you're touching one of these forms anyway.

## 13. File uploads

- Track "is this a fresh local pick vs. an existing server file" with an explicit boolean state (`isExistingServerFile` in `edit-document.tsx` is the reference), never by pattern-matching the file URI string (`.includes('/uploads')` false-positives on Android cache paths).
- `lib/upload.ts`'s `createUploadBlob` fetches a local file/content URI directly via the global `fetch`, not through the `api` wrapper — a local URI isn't an authenticated API resource and shouldn't get `BASE_URL` prepended.

## 14. Money formatting

- Use `formatCurrency` from `lib/format.ts` (`Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' })`, handles non-numeric input via `Number.isFinite` fallback to 0, tested in `__tests__/regressions/format-currency.test.ts`). Never `` `$${amount}` ``.

## 15. Components must defend against missing fields

- `{[a, b, c].filter(Boolean).join(', ') || '—'}` — not raw `{a}, {b}, {c}` which renders stray commas/spaces for missing data. `SessionCard.tsx`'s location/teacher-name rows are the reference.

## 16. Testing

- Regression tests live in `__tests__/regressions/`, one file per bug or bug cluster. Current suite: `bug-015-teacher-edit-school-endpoint.test.tsx`, `format-currency.test.ts`, `forms-validation.test.ts`, `multi-tenant-data-filter.test.ts` (10 tests total, all passing).
- **Before merging any fix:** run `npx tsc --noEmit` and `npm test`. Use the TypeScript error *count* as a live regression gate — a change that increases it needs justification, not silent acceptance.
- A passing test against a mocked function doesn't prove the real screen is fixed — `bug-015`'s original test mocked `editTeacherDocument`/`editSchoolDocument` directly and stayed green even while `edit-document.tsx` called a function that didn't exist at all. Prefer testing at the integration boundary the bug actually lives at.

## 17. When QA-reported bugs reference per-bug files

- Per-bug files live at `qa/bugs/bug-NNN-slug.md`. Treat as source of truth for that bug's original description — but **cross-check against current code first**, since the codebase moves fast. Some documented bugs turn out to already be fixed by unrelated changes, or turn out not to be live bugs at all on closer inspection. Don't assume a per-bug file is still accurate without a quick grep first.

---

## Known-open items (deliberately not fixed, need product/backend input — see `qa/fixing-session-report.pdf` for full detail)

| Item | What's needed |
|---|---|
| `upload-payment.tsx` | Orphaned route + mock-only submit logic. Needs a product decision: does a bank-transfer-proof-upload flow exist on the backend, and where should it be triggered from? |
| `register-school.tsx` missing step 2 | Confirmed asymmetric vs. `register-teacher.tsx`. Intentional simplification or a gap? |
| Session-detail Accept/Decline authorization | No client-side check that the session was actually offered to the current teacher. This is a server-side authorization question — verify the backend enforces it, don't patch the client with a guess. |
| `getInvoiceData()` client-side scoping | Likely already backend-scoped by auth token (URL convention matches other properly-scoped `/school/*` endpoints) but unverified. |
| Suburb-selection-keyed-by-label pattern | Same architectural pattern (should key by ID, not display label) repeats across 4 files. Bigger refactor than a single-file fix. |
| Check-in time-window enforcement | No business rule specified for how early/late a check-in should be allowed. |
| `alert()` usage in profile screens | Verified fine on Expo web; **not verified on native** — `alert` isn't guaranteed global in React Native the way it is in a browser. Test on a real device before assuming it's safe. |
