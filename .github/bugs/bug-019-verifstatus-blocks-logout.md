# Bug #19 — `verifStatus == 2` blocks logout — user trapped in app

**Severity:** HIGH · **Effort:** ~10 min · **Status:** OPEN
**Affected files:**
- `app/(school-tabs)/profile.tsx:307-310`
- `app/(teacher-tabs)/profile.tsx:329-333`

## Problem

```tsx
// app/(school-tabs)/profile.tsx:307-310 (and same in teacher version)
if (verifStatus == 2) {
  notify('Info', 'Please save your profile before logging out.');
  return;
}
```

The logout button is intercepted whenever `verifStatus` equals the magic number `2`. The user sees "Please save your profile before logging out" — but:
- It's not clear what they need to save
- They may have already saved (the flag isn't tied to actual unsaved-data state)
- They have no other escape from the screen

## Impact

If the backend ever returns `verification_status: 2` (whatever that means), the user is **stuck in the app**. They cannot log out, cannot switch accounts, cannot exit gracefully. The only escape is force-quit + reinstall (which loses persisted state).

Worse: the magic `2` isn't documented anywhere. If the backend interpretation of `2` changes, the lockout changes silently.

## Fix

**Remove the logout block entirely.** Logout is a user-controlled action and should never be gated by client-side state.

```tsx
// app/(school-tabs)/profile.tsx — DELETE these 4 lines
// if (verifStatus == 2) {
//   notify('Info', 'Please save your profile before logging out.');
//   return;
// }

// Logout should be unconditional:
await logout();
router.replace('/login');
```

**Also apply** to the teacher version at `app/(teacher-tabs)/profile.tsx:329-333`.

If the dev team has a genuine reason to warn the user before logout when `verifStatus == 2` (e.g. unsaved verification documents), change the UX from a block to a confirmation dialog using the existing `confirmDialog` helper:

```tsx
if (verifStatus === 2) {
  const shouldLogout = await confirmDialog({
    title: 'Logout?',
    message: 'You have unsaved verification info. Logging out will lose unsaved changes.',
    confirmText: 'Logout anyway',
    cancelText: 'Cancel',
  });
  if (!shouldLogout) return;
}
await logout();
```

Note the `===` instead of `==` (also addresses **Bug #37**).

## Acceptance criteria

- [ ] Logout button works unconditionally regardless of `verifStatus` value
- [ ] If a confirmation dialog is added, "Logout anyway" actually logs out
- [ ] Same fix applied to both profile screens (school and teacher)
- [ ] Regression test at `__tests__/regressions/bug-019-verifstatus-blocks-logout.test.tsx`

## Related

- Bug #18, #43, #55 — `verification_status` type drift makes this whole flow fragile
- Bug #37 — loose `==` throughout, including this `verifStatus == 2`
