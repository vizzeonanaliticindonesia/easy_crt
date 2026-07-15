# Bug #55 — `verification_status` cast via `as any`; not on `User` type

**Severity:** MEDIUM · **Effort:** ~2 min · **Status:** OPEN
**Affected file:** `app/_layout.tsx:52`

## Problem

```ts
const verificationStatus = Number((user as any)?.verification_status ?? 1);
```

`as any` cast to read a field that isn't on the `User` type, defaulted to `1` (verified — fail OPEN, see Bug #43).

## Impact

Bypasses type checking. If field is renamed or removed in backend, no compile error — silent fail-open.

## Fix

Combine with Bugs #13 + #18 + #43:
1. Add `verification_status?: 0 | 1 | 2` to `User` type (Bug #13)
2. Remove `as any` cast here
3. Change default to `0` (fail closed — Bug #43)

```ts
const verificationStatus = user?.verification_status ?? 0;   // fail closed
```

## Related

Bug #13, #18, #43 (fix all together)
