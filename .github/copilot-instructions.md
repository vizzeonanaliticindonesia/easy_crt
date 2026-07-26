# Copilot Instructions — TEMPLATE for the dev team

> **NOTE (QA → dev team):** This is a QA-authored template for `.github/copilot-instructions.md`, which is a workspace-level Copilot configuration that ships in the repo. The dev team decides whether to adopt it, edit it, or replace it — QA does not commit source-controlled files.
>
> **To activate:** copy this file to `.github/copilot-instructions.md` in the repo root, edit to fit team conventions, and commit. Copilot Chat and Copilot Edits automatically read it as standing context for every interaction in this workspace.
>
> The content below is derived from the 83 confirmed bugs in `qa/bug-report.md`. Its goal is to **prevent re-introducing the same bug classes**, not to dictate style.

---

# SubTeach — Project conventions for Copilot

You are helping develop **SubTeach**, a React Native Expo app for substitute-teacher booking. Two user roles: teachers (role = 9) and schools (role = 10). The backend is CodeIgniter; bearer-token auth.

When suggesting code, follow these rules.

<!-- ## 1. Role handling -->

- `User.role` is **numeric: `9 | 10`**. Never compare it to string literals (`'teacher'`, `'school'`, `'9'`, `'10'`).
- Use helpers `isTeacher(user)` and `isSchool(user)` from `lib/roles.ts` — do not write the comparison inline.
- API responses may arrive with role in any shape (number, string, `role_id` field). Normalization happens **once**, in `contexts/AuthContext.tsx` at login. Downstream code can assume `user.role` is `9 | 10 | undefined`.
- Why: cross-school data leakage bug (every school saw every other school's bookings) was caused by `user.role === 'school'` always being false.

<!-- ## 2. HTTP requests -->

- All HTTP calls go through `lib/api.ts`. Use `api.get / api.post / api.put / api.del`.
- **Do NOT call `fetch(...)` directly** from screens, contexts, or services. The api wrapper handles bearer-token injection, base URL, JSON parsing, error normalization.
- **Never hardcode the backend URL.** The URL is set via `expo.extra.apiBaseUrl` in `app.json` (or `EXPO_PUBLIC_API_BASE_URL` env var) and resolved once in `lib/api.ts`.
- Why: a domain migration (`vizzeon.com` → `kreatifa.com`) only touched 3 of 4 sites, producing a split-brain backend.

<!-- ## 3. Logging — never log secrets or PII -->

- **Never** `console.log` any of: bearer tokens, `user.token`, `data.token`, the full `user` object, full booking objects, full API response payloads, Stripe `paymentMethod.id`, password, email + name combinations.
- For dev logging, use `if (__DEV__) console.log(...)` or a `devLog()` helper that no-ops in production. Hermes still executes `console.log` in production builds and the output reaches `logcat`, iOS unified log, and crash-reporter breadcrumbs.
- Strip ALL existing `console.log(...)` calls before merging if they contain anything from the list above. Generic "what just happened" logs are fine in dev only.

<!-- ## 4. Type safety -->

- The `User`, `TeachingSession`, `AppNotification`, and `SchoolProfile` types are the contract. **Do not write fields that aren't declared on the type.** If a backend response includes new fields, add them to the type FIRST.
- `as any` casts and `as Type` casts on object literals are **prohibited** unless absolutely necessary, with a comment explaining why.
- API uses snake_case (`school_id`, `teacher_first_name`, `is_read`, `created_at`). Internal types may use either, but **pick one per type and stick to it**. Current canonical: snake_case for entities that come from the API; camelCase for purely-internal types.
- Enable `noUncheckedIndexedAccess: true` in `tsconfig.json` if not already on.
- Why: persistent type drift produced "render `undefined undefined`" bugs and silent fail-open security gates.

<!-- ## 5. AsyncStorage — never persist secrets -->

- The persisted `User` object must NOT include `password`. The bearer `token` is the only secret stored. Ideally even `token` moves to `expo-secure-store` (track separately).
- When adding new persisted fields, ask: "would I be comfortable with this in a device backup?" If no, don't persist it.

<!-- ## 6. State updaters — keep them pure -->

- Never `await` or fire side effects inside a `setState((prev) => ...)` updater. The updater must be a pure transformation.
- Persistence belongs in a `useEffect` keyed off the relevant state, not inside the setter.

<!-- ## 7. Async UI patterns -->

- Every async action button must guard against double-tap. Use a `busy` state and `disabled={busy}` on the button.
- Every async fetch must have try/catch with `finally { setLoading(false) }` — never put state resets outside `finally`.
- Every async fetch in a screen must use an `AbortController` or `cancelled` flag in `useEffect` cleanup.
- Show explicit error UI (not just a console log) when a fetch fails. Provide a retry path.

<!-- ## 8. Status comparisons — no magic values -->

- Statuses like `SessionStatus`, `InvoiceStatus`, `is_confirm` are typed unions or named constants. **Never compare to magic strings like `'1'`, `'2'`** without going through a named constant.
- Use `===` not `==` everywhere.

<!-- ## 9. Role-aware screens -->

- If a screen is reachable by both roles (teacher AND school), every action handler must branch on `user.role` and call the role-appropriate service.
- A teacher screen MUST NOT call `lib/services/school.ts` functions, and vice-versa. If a service is genuinely shared, put it in `lib/services/shared.ts`.
- Why: the document-edit flow called `editSchoolDocument` for teachers too, risking cross-tenant data writes.

<!-- ## 10. Defense in depth on multi-tenant data -->

- When listing data owned by the current user (invoices, bookings, sessions), filter on the client too — even if the backend should already filter. `result.filter(item => item.school_id === user.id)`.
- Clear the list state when `user.id` changes, so a logout/login race doesn't briefly show the previous user's data.

## 11. Status machine

- The legal `SessionStatus` transitions are:
  ```
  pending → accepted → checked_in → attendance_confirmed → completed
         → completion_confirmed → invoice_sent → payment_uploaded → payment_confirmed → reviewed
                                                                            ↘ declined (from any pre-completed state)
  ```
- Never skip states. Never write a "testing helper" that forces a session into a later state in the production data loader.
<!-- - Action buttons should be visible only when the prerequisite state is true (e.g., "Check Out" requires `check_in_time != null`, not just `status === 0`). -->

<!-- ## 12. Forms -->

- Validate every field that's submitted, not just visually-required ones. If the field is in the payload, validate it.
- Email validation: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(...)`, not `.includes('@')`.
- Persist drafts of long forms to AsyncStorage; restore on mount.
- Always coerce numeric form values with `Number(x) || 0` before submission.

<!-- ## 13. File uploads -->

- Use explicit `isNewFile` flag to track "user picked a new file" — never infer from URI substring.
- On web, build `Blob` with explicit `type: file.mimeType` — don't rely on inheritance from `fetch`.
- Validate MIME and size before submitting.

<!-- ## 14. Money formatting -->

- Use a centralized `formatCurrency(amount)` from `lib/format.ts` (built on `Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' })`).
- Confirm whether backend sends dollars or cents — coerce explicitly. Never just `\`$${amount}\``.

<!-- ## 15. Components must defend against missing fields -->

- When rendering a value (`{session.state}, {session.locality}`), filter empty values: `{[a, b, c].filter(Boolean).join(', ') || '—'}`.
- Don't render `undefined undefined` or `, ,` to the user.

<!-- ## 16. Testing — when adding a fix -->

- For each bug from `qa/bug-report.md`, the corresponding fix should land with a regression test at `__tests__/regressions/bug-NNN-slug.test.tsx`.
- Test asserts the bug behavior (fails before the fix) and the corrected behavior (passes after).
- Don't merge a fix without its regression test.

<!-- ## 17. When QA-reported bugs reference per-bug files -->

- Per-bug files live at `qa/bugs/bug-NNN-slug.md`.
- They contain: the failing code excerpt, the impact, the recommended fix, and acceptance criteria.
- Treat the per-bug file as the source of truth for that bug. Read it before proposing a fix.

---

**This file is gitignored** as part of QA artifacts. To make it canonical for the dev team, copy to `.github/copilot-instructions.md` (which is NOT gitignored) and commit. See `qa/bug-report.md` for the full bug inventory it derives from.
