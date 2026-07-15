# Bug #83 — `await fetchData()` before `router.replace` on decline → UX hang on slow networks

**Severity:** LOW · **Effort:** ~3 min · **Status:** OPEN
**Affected file:** `app/session-detail.tsx:130-135`

## Problem

```tsx
const res = await declineSession(session.rn_id);
console.log('decline res:', res);          // Bug #80 — also strip
await fetchData();                          // ← refetches data we are about to leave
router.replace('/sessions');                // ← then leaves the screen
```

`fetchData()` re-pulls the entire dashboard before navigating away, just to throw the result away. On slow networks the user sees a noticeable hang after tapping Decline before the route changes.

Also: no `notify('Success', ...)` on decline (asymmetric with Accept, which probably has one).

## Fix

```tsx
const res = await declineSession(session.rn_id);
notify('Success', 'Session declined.');
router.replace('/sessions');
// Let the sessions list refresh itself on focus.
```

## Related

Bug #80 (combine — strip the log too) · Bug #74 (busy guard in same screen)
