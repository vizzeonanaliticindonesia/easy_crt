# Bug #77 — `sessions.find((s) => s.request_id == id)` mixed string/number, no missing-id validation

**Severity:** MEDIUM · **Effort:** ~5 min · **Status:** OPEN
**Affected file:** `app/session-detail.tsx:57`

## Problem

```tsx
() => sessions.find((s) => s.request_id == id),
```

`id` from `useLocalSearchParams` is a string; `s.request_id` may be numeric. `==` works today but masks future drift. Also no validation that `id` exists — bad deep link silently shows "Session not found" with no diagnostic.

## Impact

If deep link omits `id` or has a typo, user sees a generic "Session not found" — no way to tell whether it's their bad link or a real missing session. No retry, no contact-support hint.

## Fix

```tsx
const session = useMemo(() => {
  if (!id) return null;
  return sessions.find((s) => String(s.request_id) === String(id));
}, [sessions, id]);

// In render, distinguish:
if (!id) return <ErrorState message="Invalid link" />;
if (!session && !loading) return <ErrorState message="Session not found" onRetry={fetchData} />;
```

## Related

Bug #72 (no error UI in same file) · Bug #82 (unused errorText style — now has a use)
