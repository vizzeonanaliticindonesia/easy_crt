# Bug #73 — session-detail `useEffect` no cleanup / `AbortController`

**Severity:** MEDIUM · **Effort:** ~5 min · **Status:** OPEN
**Affected file:** `app/session-detail.tsx:52-54`

## Problem

```tsx
useEffect(() => { fetchData(); }, [user]);
```

No cleanup. If user navigates away while fetch is in flight, `setSessions`/`setLoading` fire on an unmounted component → React warning, potential memory leak. Re-runs on every `user` reference change (even if id is the same).

## Impact

"Can't perform a React state update on an unmounted component" warnings in dev. Memory pressure if the user navigates fast.

## Fix

```tsx
useEffect(() => {
  let cancelled = false;
  (async () => {
    try {
      if (!user) { if (!cancelled) setLoading(false); return; }
      const res = await getDashboardData();
      if (!cancelled) setSessions(res.data ?? []);
    } catch (e) {
      if (!cancelled) notify('Error', '...');
    } finally {
      if (!cancelled) setLoading(false);
    }
  })();
  return () => { cancelled = true; };
}, [user?.id]);   // depend on id, not whole user reference
```

## Related

Bug #71, #72 (combine — same file's fetch flow) · Bug #32 (same pattern in profile)
