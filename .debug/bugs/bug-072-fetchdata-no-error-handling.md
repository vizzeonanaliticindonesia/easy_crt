# Bug #72 — `fetchData` has no try/catch — failure leaves infinite "Loading..." spinner

**Severity:** HIGH · **Effort:** ~10 min · **Status:** OPEN
**Pattern:** extends Bug #31 (state reset outside finally)
**Affected file:** `app/session-detail.tsx:44-54`

## Problem

```tsx
// app/session-detail.tsx:44-54
const fetchData = async () => {
  if (user) {
    const fetchedSessions = await getDashboardData();
    setSessions(fetchedSessions.data);
    setLoading(false);
  }
};
```

Two issues:

1. **No try/catch.** Any rejection (network down, 401, 500, the Bug #70 TypeError) → unhandled rejection → `setLoading(false)` never reached → screen stuck on "Loading session details..." forever. No retry, no error message.

2. **If `user` is null on first render, `loading` stays `true` forever.** State is initialized to `loading: true` and the `if (user)` early-return prevents `setLoading(false)` from being called.

## Impact

User-facing:
- Screen stuck on "Loading session details..."
- No retry button
- No error message
- User force-quits the app

Backend errors (timeouts, transient 500s, the Bug #70 TypeError) all manifest as a frozen spinner with no diagnostic.

The "no error UI" symptom is compounded by the dead `errorText` style in the same file (Bug #82) — someone designed an error UI but never wired it up.

## Fix

```tsx
// app/session-detail.tsx:44-54
const fetchData = async () => {
  try {
    if (!user) {
      setLoading(false);   // ← prevent infinite loading when user is null
      return;
    }
    const res = await getDashboardData();   // or branch on role per Bug #71
    setSessions(res.data ?? []);
  } catch (err) {
    console.error('Failed to load session detail:', err);   // dev only — strip per Bug #80
    notify('Error', 'Failed to load session. Pull down to retry.');
  } finally {
    setLoading(false);   // ← ALWAYS called
  }
};
```

Also surface an error UI when state is in error:

```tsx
{!loading && !session && (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>Session not found or failed to load.</Text>
    <AppButton title="Retry" onPress={fetchData} />
  </View>
)}
```

The `errorText` style (Bug #82) can finally be put to use.

## Acceptance criteria

- [ ] When API returns 500, screen shows error message + retry button instead of infinite spinner
- [ ] When user is null at mount, screen does not spin forever
- [ ] Retry button re-attempts and succeeds when network returns
- [ ] Regression test at `__tests__/regressions/bug-072-fetchdata-no-error-handling.test.tsx`

## Related

- Bug #31 — same state-reset-outside-finally pattern in another file
- Bug #71 — combine fixes (both touch `fetchData`)
- Bug #82 — `errorText` style now has a real use
- Bug #80 — `console.log('decline res:', ...)` in the same file — strip together
