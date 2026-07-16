# Bug #37 — Loose `==` comparisons throughout `session-confirmation-detail.tsx`

**Severity:** LOW · **Effort:** ~5 min · **Status:** OPEN
**Affected file:** `app/session-confirmation-detail.tsx:185, 187, 197, 199, 205, 207, 214` (and similar in profile files)

## Problem

Six `==` comparisons:
```tsx
{booking.is_confirm == 1 && ...}
{booking.booking_status == '1' && ...}
```

Mixed-type matches (`1 == '1'` is true; `' 1' == 1` is false) hide real type bugs and make the contract with backend ambiguous (number vs string).

## Fix

Replace all `==` with `===` (and `!=` with `!==`). Coerce backend values once at parse time:
```ts
const isConfirm = String(booking.is_confirm);
if (isConfirm === '1') { ... }
```

## Related

Bug #22 (related: magic string '1' comparison) · Bug #81 (similar in session-detail)
