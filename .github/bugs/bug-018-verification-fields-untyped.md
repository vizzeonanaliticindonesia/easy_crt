# Bug #18 — `verification_*` / `active` fields read from User but absent from the type

**Severity:** HIGH · **Effort:** ~30 min · **Status:** OPEN
**Extends:** Bug #13 (same class — fields persisted but not declared)
**Affected files:**
- `app/(school-tabs)/profile.tsx:122-123`
- `app/(teacher-tabs)/profile.tsx:140-141`
- `app/_layout.tsx:52`
- `contexts/AuthContext.tsx:119-121` (the write site that doesn't update the type)
- `types/index.ts` (where the fields are missing)

## Problem

`AuthContext` writes three fields to the persisted user that are not declared on the `User` type:

```ts
// contexts/AuthContext.tsx:119-121 (login)
const userWithToken = {
  ...(remoteUser as any),
  ...
  active: data.active,
  verification_status: data.verification_status,
  verification_logs: data.verification_logs ?? [],
} as User;                       // ← `as User` cast hides the missing fields
```

Then the profile screens read these fields off `user` (the context value):

```ts
// app/(school-tabs)/profile.tsx:122-123
setVerificationLogs(user.verification_logs || []);
setVerifStatus(user.verification_status ?? 0);
```

```ts
// app/_layout.tsx:52
const verificationStatus = Number((user as any)?.verification_status ?? 1);
```

The `as any` casts and the missing type fields mean TypeScript can't catch when these reads break.

## Impact

Multiple downstream bugs are enabled by this type drift:

- **Bug #43 (HIGH, fail-open)**: `_layout.tsx:52` defaults `verification_status` to `1` (verified) when missing. If the API regresses and stops sending the field, every user becomes "verified" silently.
- **Bug #19**: `verifStatus == 2` blocks logout, but the field is read with `as any` so the value's provenance is unknown.
- Refactoring `User` becomes risky because consumers reach for properties that aren't part of the contract.

User-visible side effect: if `verification_logs` ever comes back undefined from the API, the verification-history panel goes blank — no error, just empty.

## Fix

**Step 1 — Add the fields to the `User` interface:**

```ts
// types/index.ts
export interface User {
  id: string;
  email: string;
  name?: string;
  teacherName: string;
  role: UserRole;
  role_id?: number;
  token?: string;
  // ... existing fields ...

  // NEW:
  active?: 0 | 1;
  verification_status?: 0 | 1 | 2;   // 0=unverified, 1=verified, 2=needs-attention (confirm with backend)
  verification_logs?: VerificationLog[];
}

// And define VerificationLog (whatever shape the backend returns)
export interface VerificationLog {
  id: string;
  status: number;
  note?: string;
  created_at: string;
  // ... whatever else
}
```

**Step 2 — Remove the `as any` casts** in the profile screens and `_layout.tsx`. They become unnecessary once the type knows about the fields. Compile errors will surface any remaining issues.

**Step 3 — Decide whether `verification_status` should be read from `user` (context) or from `res` (the API response inside the profile fetch).** Currently the profile screen reads from `user`, which means if `AuthContext` doesn't refresh the field after a status change, the screen shows stale data. Recommend reading from `res` (the fresh GET response) where possible.

**Step 4 — Verify with backend** what values `verification_status` can take and what each means. The magic numbers `0`, `1`, `2` deserve a named enum:

```ts
export const VerificationStatus = {
  Unverified: 0,
  Verified: 1,
  NeedsAttention: 2,   // ← confirm naming with backend
} as const;
```

## Acceptance criteria

- [ ] No `as any` cast remains on `user.verification_*` or `user.active`
- [ ] `User` type declares all three fields with correct types
- [ ] `tsc --noEmit` passes
- [ ] Bug #43 can be properly fixed (fail-closed default) once the type is in place
- [ ] Regression test at `__tests__/regressions/bug-018-verification-fields-untyped.test.tsx`

## Related

- Bug #13 — first instance of this pattern (`active`, `verification_status`, `verification_logs` written without typing)
- Bug #43 — direct consequence (`verification_status ?? 1` is fail-open because the type doesn't enforce it)
- Bug #55 — `as any` cast in `_layout.tsx` — same fix
