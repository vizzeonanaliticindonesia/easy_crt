# Bug #42 — Unrecognized role leaves user stuck on `/login` with only a console message

**Severity:** HIGH · **Effort:** ~15 min · **Status:** OPEN
**Affected file:** `app/_layout.tsx:48-105`

## Problem

```ts
// app/_layout.tsx:48-49 — only matches NUMERIC roles
const isTeacherRole = role === 9;
const isSchoolRole = role === 10;

// app/_layout.tsx (routing block)
} else if (isPublicRoute) {
  if (isTeacherRole) {
    router.replace('/(teacher-tabs)');
  } else if (isSchoolRole) {
    router.replace('/(school-tabs)');
  } else {
    console.log(' ROLE GA JELAS:', role);   // ← only log, no user-facing action
  }
}
```

If `user.role` is anything other than exactly `9` or `10` — could be `'9'`, `'10'`, `'teacher'`, `'school'`, `undefined`, `null`, a number for a future admin role, etc. — the routing block silently does nothing. The user remains on `/login` (or wherever they were).

This is partially redundant with Bug #1's fix (normalize at auth boundary), but `_layout.tsx` should still have a defensive fallback.

## Impact

Symptoms vary:
- User logs in successfully (server returns token + user data)
- Splash loader disappears
- User is dropped on `/login` (or `/index`) with no error
- They re-attempt login → same thing
- Only diagnostic is a console log they can't see

UX consequence: app appears broken. No way to recover except clearing app data.

## Fix

After Bug #1 is properly fixed (role normalized at auth boundary to `9 | 10 | undefined`), this fallback should be:

```ts
// app/_layout.tsx — in the role-routing block
} else if (isPublicRoute) {
  if (isTeacherRole) {
    router.replace('/(teacher-tabs)');
    return;
  }
  if (isSchoolRole) {
    router.replace('/(school-tabs)');
    return;
  }

  // Role is undefined or unrecognized — force logout and surface a clear error
  console.warn('[RootNavigation] Unknown user role, forcing logout:', role);
  notify('Session Error', 'Your account is in an invalid state. Please log in again.');
  await logout();           // requires importing logout from useAuth
  router.replace('/login');
}
```

This treats unknown role as a corrupt session — fail-closed, log out the user, surface the error.

Apply the same pattern to the `verificationStatus` checks earlier in the effect (combined with Bug #43's fix).

## Acceptance criteria

- [ ] Logging in with a properly-normalized role (9 or 10) → routes correctly to teacher/school tabs (unchanged)
- [ ] If `user.role` ever becomes undefined or unrecognized (simulated by manually mutating AsyncStorage) → user is logged out with an error toast, not silently stuck
- [ ] No silent `ROLE GA JELAS` log without user-facing action
- [ ] Regression test at `__tests__/regressions/bug-042-unrecognized-role-stuck.test.tsx`

## Related

- Bug #1 — fix this together; #1 normalizes at the source, #42 handles the residual fallback
- Bug #43 — same effect, fail-open verification status
- Bug #48 — missing `return` after `router.replace` (also relevant here)
- Bug #59 — `'ROLE GA JELAS'` is an informal log label; clean up
