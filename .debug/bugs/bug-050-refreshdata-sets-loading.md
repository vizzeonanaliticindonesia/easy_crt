# Bug #50 — `refreshData()` sets `loading=true` on pull-to-refresh — wrong indicator

**Severity:** MEDIUM · **Effort:** ~5 min · **Status:** OPEN
**Affected file:** `app/(school-tabs)/invoices.tsx:112-133`

## Problem

```ts
const refreshData = useCallback(async () => {
  try {
    setLoading(true);
    ...
  }
}, []);

const onRefresh = useCallback(async () => {
  setRefreshing(true);
  try { await refreshData(); }
  finally { setRefreshing(false); }
}, [refreshData]);
```

Pull-to-refresh triggers `setLoading(true)` via `refreshData`. But pull-to-refresh should use only the `refreshing` indicator. Mismatched state.

## Impact

Today: no full-screen spinner is wired to `loading`, so the flag is wasted. But if it were ever wired up, pull-to-refresh would briefly show the full-screen spinner — annoying. Also `loading` never resets to `false` if `getInvoiceData` resolves but `setStats` throws.

## Fix

Add a `silent` flag:
```ts
const refreshData = useCallback(async (silent = false) => {
  try {
    if (!silent) setLoading(true);
    ...
  } finally {
    if (!silent) setLoading(false);
  }
}, []);

// pull-to-refresh uses silent mode:
const onRefresh = useCallback(async () => {
  setRefreshing(true);
  try { await refreshData(true); }
  finally { setRefreshing(false); }
}, [refreshData]);
```

## Related

Bug #72 (similar try/finally hole in session-detail)
