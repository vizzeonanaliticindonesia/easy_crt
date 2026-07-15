# Bug #16 — Console logs leak upload responses, suburb data, full booking objects

**Severity:** CRITICAL · **Effort:** ~30 min · **Status:** OPEN
**Extends:** Bug #3 (same pattern, different surfaces)

**Affected files (multiple):**
- `app/(school-tabs)/profile.tsx:187, 350, 354, 377`
- `app/(teacher-tabs)/profile.tsx:203, 326, 374, 378`
- `app/session-confirmation-detail.tsx:125` (logs `booking` on every render)
- `app/create-session.tsx:207, 221, 242, 287, 442, 494` (six `console.error` with API response objects)

## Problem

Examples:

```tsx
// app/(school-tabs)/profile.tsx:187, 350, 354
console.log('SUBURB RES:', res)
console.log('UPLOAD DATA:', { uri, name, type });
console.log('UPLOAD RES:', res);
```

```tsx
// app/session-confirmation-detail.tsx:125
console.log(booking);   // logs full booking object on every render
```

```tsx
// app/create-session.tsx:442
console.error('Failed to load teacher info:', err);   // err.response may contain teacher PII
```

## Impact

Same emission surfaces as Bug #3 (logcat, iOS unified log, crash reporter breadcrumbs), but the payloads now include:

- Signed photo URLs (uploaded profile pics) — clickable by anyone with the log
- Full upload responses — including backend IDs, validation messages, internal paths
- Booking PII — teacher names, schedules, contact details, session IDs
- Suburb-API responses — large data dump
- API error bodies — may contain teacher email, phone (per `loadPrivateTeacherInfo`)

Combine with Bug #3 (bearer token also logged) → device log becomes a one-stop credential + PII dump.

The `console.log(booking)` line at `session-confirmation-detail.tsx:125` is the worst — fires **on every render**, not just on action.

## Fix

**Step 1 — delete every `console.log` and `console.error` in the affected files** that logs a response, an upload, a booking, or any user-provided data. The list above is exhaustive based on QA's audit.

**Step 2 — for any debug log you genuinely want to keep**, wrap in `__DEV__`:

```ts
if (__DEV__) {
  console.log('Upload completed for:', name);   // OK — no token, no full response
}
```

Or use the `devLog` helper from Bug #3's fix:
```ts
import { devLog } from '@/lib/logger';
devLog('Upload completed for:', name);
```

**Step 3 — for error reporting**, route through a sanitized handler instead of raw `console.error`:
```ts
// lib/logger.ts
export function reportError(message: string, err: unknown): void {
  if (__DEV__) console.error(message, err);
  // production: send to crash reporter with PII stripped
}
```

## Acceptance criteria

- [ ] `grep -rn "console\\.log\\|console\\.error" app/` returns no matches that include `res`, `booking`, `data`, `err`, `paymentMethod`, `user`, or `payload` as arguments
- [ ] `app/session-confirmation-detail.tsx:125` no longer has `console.log(booking)`
- [ ] Manual test: open device log via Metro / logcat / Console.app; perform a profile photo upload; the log does NOT contain the full upload response body
- [ ] Manual test: log shown for declined / confirmed bookings does NOT contain teacher PII

## Related

- Bug #3 — original token-logging finding
- Bug #39 — Stripe `paymentMethod.id` logged
- Bug #40 — full user object logged in route changes
- Bug #61 — suburb error logged in registration
- Bug #80 — decline response logged
