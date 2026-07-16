# Bug #32 — Profile `useEffect` has no `AbortController` — focus-change race

**Severity:** MEDIUM · **Effort:** ~10 min · **Status:** OPEN
**Affected files:** `app/(school-tabs)/profile.tsx:133-137`, `app/(teacher-tabs)/profile.tsx` (mirror)

## Problem

```ts
useEffect(() => {
  if (user && isFocused) {
    fetchProfile();
  }
}, [user, isFocused]);
```

No cleanup, no AbortController. If user navigates away mid-fetch and back, two `fetchProfile` calls race — later (or earlier) `setSchoolId/etc.` may fire on unmounted component (warning) OR overwrite fresh data with stale.

## Impact

Stale-overwrites-fresh: user updates a field manually, screen briefly shows that change, then earlier-but-slower fetch returns and overwrites with old data. Confusing UX.

## Fix

```ts
useEffect(() => {
  if (!user || !isFocused) return;
  let cancelled = false;
  fetchProfile({ cancelled });
  return () => { cancelled = true; };
}, [user, isFocused]);

// Inside fetchProfile, before each setState:
if (cancelled) return;
```

Or use AbortController and pass `signal` to the api call.

## Related

Bug #23 (same race surface) · Bug #73 (same pattern in session-detail)
