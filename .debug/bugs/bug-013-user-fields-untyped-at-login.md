# Bug #13 — `active`, `verification_status`, `verification_logs` written to User but missing from interface

**Severity:** MEDIUM · **Effort:** ~10 min · **Status:** OPEN
**Affected file:** `contexts/AuthContext.tsx:119-121` (write site) and `types/index.ts` (missing fields)

## Problem

```ts
// contexts/AuthContext.tsx:119-121
const userWithToken = {
  ...
  active: data.active,
  verification_status: data.verification_status,
  verification_logs: data.verification_logs ?? [],
} as User;
```

None of these are declared on `User`. The `as User` cast hides it.

## Impact

Downstream code reads `user.verification_status` with `as any` casts (Bugs #18, #55). Type system can't enforce defaults or shape. Enables Bug #43 (fail-open default).

## Fix

Add to `User` interface (same change as Bug #18):

```ts
export interface User {
  ...
  active?: 0 | 1;
  verification_status?: 0 | 1 | 2;
  verification_logs?: VerificationLog[];
}
```

## Related

Bug #18 (consumer side — fix together) · Bug #43 (fail-open consequence) · Bug #55 (`as any` cast)
