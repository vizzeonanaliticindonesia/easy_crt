# Bug #1 — Cross-school data leakage (role type inconsistency)

**Severity:** CRITICAL · **Effort:** ~30 min · **Status:** OPEN
**Affected files:**
- `contexts/SessionContext.tsx:326`
- `contexts/AuthContext.tsx:83-114`
- `types/index.ts:1`

## Problem

The type declares role as numeric:

```ts
// types/index.ts:1
export type UserRole = 9 | 10; // 9 = teacher, 10 = school
```

`app/_layout.tsx:46-49` compares numerically (correctly):

```ts
const role = user.role;
const isTeacherRole = role === 9 ;
const isSchoolRole = role === 10 ;
```

But `contexts/SessionContext.tsx:326` compares to a string:

```ts
// contexts/SessionContext.tsx:326
if (user.role === 'school') {
  return mapped.filter((b) => b.schoolId === user.id);   // ← only "own bookings" filter
}
return mapped;
```

Since `user.role` is always a number (9 or 10), `=== 'school'` is **always false**. The filter never runs.

Underlying issue: `AuthContext.tsx:83-114` does role normalization that can produce any of `9 | 10 | '9' | '10' | 'teacher' | 'school' | undefined` depending on the API response shape.

## Impact

Every school user sees confirmation bookings belonging to **every school in the system**, not just their own. Cross-tenant data leak — school A sees booking details from school B, C, D. Not a cosmetic issue.

## Fix

Two-part fix:

**1) Normalize `user.role` to numeric at the auth boundary.** In `contexts/AuthContext.tsx`, after receiving the API response, coerce to `9 | 10 | undefined`:

```ts
function normalizeRole(raw: unknown): 9 | 10 | undefined {
  if (raw === 9 || raw === '9' || raw === 'teacher') return 9;
  if (raw === 10 || raw === '10' || raw === 'school') return 10;
  if (typeof raw === 'string') {
    const parsed = parseInt(raw, 10);
    if (parsed === 9 || parsed === 10) return parsed as 9 | 10;
  }
  return undefined;
}
```

Use it in `login()` (replacing lines 83-114) so `user.role` is **guaranteed** to be `9 | 10`.

**2) Add a small role helper module** so the string-comparison mistake can't happen again:

```ts
// lib/roles.ts
import type { User } from '@/types';
export const isTeacher = (user: User | null | undefined) => user?.role === 9;
export const isSchool  = (user: User | null | undefined) => user?.role === 10;
```

Replace `user.role === 'school'` at `SessionContext.tsx:326` with `isSchool(user)`. Update `app/_layout.tsx:46-49` to use the helper too, for consistency.

## Acceptance criteria

- [ ] Logging in as school A only sees their own bookings in the confirmations list
- [ ] No string comparison of `user.role` remains anywhere — `grep -rn "user\\.role\\s*=*=\\s*['\"]" app/ contexts/ components/` returns nothing
- [ ] `user.role` after login is strictly typed `9 | 10` (verified via TypeScript)
- [ ] A regression test exists at `__tests__/regressions/bug-001-role-data-leak.test.tsx`

## Related

- This is the **first bug** that motivated the whole QA review. Multiple downstream patterns assume `user.role` works correctly.
- Bug #15 — teacher edit hits school endpoint (related role-confusion pattern)
- Bug #42 — unrecognized role leaves user stuck on /login
- Bug #81 — loose `==` on role comparison
