# Bug #49 — `<Stack key={user?.role}>` remounts the entire navigator on every login/logout

**Severity:** MEDIUM · **Effort:** ~2 min · **Status:** OPEN
**Affected file:** `app/_layout.tsx:118`

## Problem

```tsx
<Stack key={user?.role} screenOptions={{ headerShown: false }}>
```

When `user.role` changes from `undefined → 10` (login) or back (logout), the React `key` change triggers a full unmount + remount of the entire Stack. All screen state (form drafts, scroll positions, open modals, event listeners) is destroyed.

## Impact

Hot-reload also re-keys → visible blank flash during dev. Login of one user → all their previously-open screens reset. Annoying when navigating fast.

## Fix

Drop the prop entirely, or use a coarser key:
```tsx
<Stack key={user ? 'authed' : 'public'} screenOptions={{ headerShown: false }}>
```

This only remounts on login/logout (necessary), not on role variation within a session.

## Related

Bug #1 (role normalization makes this less of an issue, but the remount is still wrong)
