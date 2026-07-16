# Bug #81 — Loose `==` on `user?.role == 9 / 10` in session-detail

**Severity:** LOW · **Effort:** ~1 min · **Status:** OPEN
**Affected file:** `app/session-detail.tsx:92, 93`

## Problem

```tsx
const isTeacher = user?.role == 9;
const isSchool  = user?.role == 10;
```

`User.role` is typed `9 | 10` numeric. `==` masks the Bug #1 pattern (backend sometimes returns role as string `'9'/'10'`).

## Fix

Switch to `===` and normalize `user.role` once at the auth boundary (Bug #1's fix):
```tsx
const isTeacher = user?.role === 9;
const isSchool  = user?.role === 10;
```

Or import `isTeacher` / `isSchool` from a `lib/roles.ts` helper (per Bug #1's recommendation).

## Related

Bug #1 (root cause) · Bug #37 (broader == pattern in another file)
