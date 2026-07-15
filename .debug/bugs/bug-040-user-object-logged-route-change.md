# Bug #40 — Full `user` object logged on every route change

**Severity:** CRITICAL · **Effort:** ~2 min · **Status:** OPEN
**Extends:** Bug #3 (same pattern, different surface)
**Affected file:** `app/_layout.tsx:25`

## Problem

```ts
// app/_layout.tsx:25 (inside the route-check useEffect)
console.log('[RootNavigation] run route check', { user, isLoading, segments });
```

This fires on **every navigation event** — every push, replace, deep-link, and hot navigation. It logs the entire `user` object, which contains:

- `id`, `email`, `name`, `teacherName`
- `role`, `role_id`
- `token` (the bearer — see Bug #3)
- `verification_status`, `verification_logs`, `active`
- `password` (if Bug #2 isn't fixed yet)
- All other persisted fields

## Impact

Same emission surfaces as Bug #3 (logcat, iOS unified log, crash reporter breadcrumbs) — but now with the **frequency** of every route change. A single user session generates dozens to hundreds of these log lines, each containing the full credential record.

This is the easiest log to grep — `grep '\[RootNavigation\] run route check'` finds the credentials.

## Fix

**Option A (minimal)** — remove the `user` from the payload:

```ts
// app/_layout.tsx:25
console.log('[RootNavigation] run route check', {
  isAuthenticated: !!user,    // safe — just a boolean
  isLoading,
  segments,
});
```

**Option B (preferred)** — wrap the whole log in `__DEV__`:

```ts
if (__DEV__) {
  console.log('[RootNavigation] run route check', {
    isAuthenticated: !!user,
    isLoading,
    segments,
  });
}
```

**Option C (cleanest)** — delete entirely. Route changes are visible via React DevTools / Reactotron; this `console.log` adds noise without diagnostic value.

```ts
// app/_layout.tsx:25 — DELETE
```

## Acceptance criteria

- [ ] `grep -n "console\\.log" app/_layout.tsx` returns no matches that include the `user` variable as an argument
- [ ] Manual test: open Metro terminal, navigate between tabs, no "user" object dumps appear
- [ ] Combined with Bug #3 fix, `grep -rn "console\\.log.*user\\b" app/ contexts/` returns nothing dangerous
- [ ] Regression test (combined with Bugs #3, #16, #39): one test asserting that during a full login + navigation flow, the bearer token never appears in `console.log` output

## Related

- Bug #3 — bearer token logged in API client (the same token leaks here too via `user.token`)
- Bug #16 — broader pattern of console.log PII leaks
- Bug #39 — Stripe paymentMethod.id logged
- Bug #59 — informal log labels in `_layout.tsx` ("ROLE GA JELAS") — fix in the same PR
