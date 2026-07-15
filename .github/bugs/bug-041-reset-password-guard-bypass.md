# Bug #41 — Reset-password guard is duplicated AND bypassable via substring match

**Severity:** HIGH · **Effort:** ~10 min · **Status:** OPEN
**Affected file:** `app/_layout.tsx:21-24, 36-38`

## Problem

```ts
// app/_layout.tsx:19-24 (early in the effect)
useEffect(() => {
  if (isLoading) return;
  if (pathname.includes('reset-password')) {
    console.log('[RootNavigation] skip reset-password');
    return;
  }
  // ...

// app/_layout.tsx:36-38 (deeper in the same effect — UNREACHABLE)
  if (!user) {
    if (!isPublicRoute) {
      if (pathname.includes('reset-password')) {   // ← already returned above, never runs
        return;
      }
      router.replace('/login');
    }
  }
```

Two issues:

1. **Dead code:** the second `pathname.includes('reset-password')` check is unreachable because the first one already returned.

2. **Substring match is too loose:** `pathname.includes('reset-password')` matches any route whose URL contains the substring — e.g. `/admin/reset-password-history`, `/notes/about-reset-password.md`, etc. Anyone who can construct such a deep link bypasses the auth gate.

## Impact

The reset-password screen is supposed to be accessible without authentication (the user is, by definition, locked out and trying to recover). But the current implementation:
- Has unmaintainable dead code that confuses reviewers
- Is bypassable via deep links containing the substring `'reset-password'` anywhere in the path

This is a moderate authorization concern. The substring exploit requires the attacker to know a route name that contains the substring — but as the app grows, such a route is easy to introduce.

## Fix

**Step 1 — Use strict path comparison:**

```ts
// app/_layout.tsx:19-24 — REPLACE
const isResetPassword = pathname === '/reset-password' || segments[0] === 'reset-password';
if (isResetPassword) {
  return;   // skip route check for reset-password screen
}
```

**Step 2 — Add `'reset-password'` to the `publicRoutes` array** so the unauthenticated-redirect block treats it consistently:

```ts
const publicRoutes = ['index', 'login', 'register-select', 'register-teacher', 'register-school', '+not-found', 'reset-password'];
```

**Step 3 — Delete the unreachable code** at lines 36-38.

**Step 4 — Delete the dev `console.log('[RootNavigation] skip reset-password')`** (or wrap in `__DEV__`).

After these changes, the guard logic becomes:

```ts
useEffect(() => {
  if (isLoading) return;

  const firstSegment = segments[0] as string;
  const publicRoutes = ['index', 'login', 'register-select', 'register-teacher', 'register-school', '+not-found', 'reset-password'];
  const isPublicRoute = !firstSegment || publicRoutes.includes(firstSegment);
  // ...

  if (!user) {
    if (!isPublicRoute) {
      router.replace('/login');
    }
    return;
  }
  // ... rest unchanged
}, [user, isLoading, segments, pathname, router]);
```

## Acceptance criteria

- [ ] `/reset-password` route is accessible without login (unchanged user-facing behavior)
- [ ] `/admin/reset-password-history` (hypothetical) would NOT bypass auth — gets redirected to `/login`
- [ ] No unreachable code remains in the effect
- [ ] Manual test: deep-link to `/reset-password?email=x&reset_hash=y` from a fresh app install → screen loads
- [ ] Regression test at `__tests__/regressions/bug-041-reset-password-guard-bypass.test.tsx`

## Related

- Bug #42 — unrecognized role leaves user stuck on `/login` (same effect, different branch)
- Bug #48 — missing `return` after `router.replace` calls in the same effect
- Bug #59 — informal log labels in this file
