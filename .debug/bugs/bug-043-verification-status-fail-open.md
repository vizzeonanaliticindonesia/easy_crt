# Bug #43 — `verification_status` defaults to 1 (verified) when missing — fail-OPEN security gate

**Severity:** HIGH · **Effort:** ~5 min · **Status:** OPEN
**Affected file:** `app/_layout.tsx:52`

## Problem

```ts
// app/_layout.tsx:52
const verificationStatus = Number((user as any)?.verification_status ?? 1);
```

The default value when `verification_status` is missing or null is `1`, which the rest of the code treats as **verified**. Then routing decisions are made based on `verificationStatus === 1`.

## Impact

This is a fail-OPEN security gate. Scenarios where the default kicks in:
- Backend regression: the API stops sending `verification_status` for some reason. Every user becomes "verified".
- New user account in inconsistent state: missing the field. Treated as verified.
- Field rename on backend (`verificationStatus` vs `verification_status` vs `verify_status`): drift means the lookup returns undefined → default to 1 → bypass.

A verification gate should always **fail closed** — when in doubt, assume the user is NOT verified, and force them through the verification flow.

## Fix

Default to `0` (unverified):

```ts
// app/_layout.tsx:52
const verificationStatus = Number((user as any)?.verification_status ?? 0);
```

Or, better, use a named constant after Bug #18's fix adds the field to the `User` type:

```ts
const verificationStatus = user?.verification_status ?? VerificationStatus.Unverified;
```

Confirm with the dev team which value means "verified" and which means "unverified". If the convention is `0 = verified, 1 = unverified`, the fix is the opposite. But "fail closed" means "default to whichever value gates the user OUT of the verified-only screens."

## Acceptance criteria

- [ ] When `user.verification_status` is missing or undefined, the user is treated as **unverified** and routed to the verification flow (not the main app)
- [ ] Properly verified users (with `verification_status === 1`) continue to access the main app — unchanged
- [ ] Regression test at `__tests__/regressions/bug-043-verification-status-fail-open.test.tsx`:
  ```ts
  it('unverified user (missing verification_status field) is gated out of main app', async () => {
    setUser({ id: 'u1', role: 9 /* no verification_status */ } as User);
    // ... render the layout and assert the user is NOT in /(teacher-tabs)
  });
  ```

## Related

- Bug #18 — `verification_status` not on the type (fix that first so this can be typed cleanly)
- Bug #55 — `as any` cast in the same line (same fix surface)
- Bug #19, #20 — verification flow related, same screen group
