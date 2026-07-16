# Bug #53 — `useEffect` deps include `user` but body doesn't read it; state not cleared on user change

**Severity:** MEDIUM · **Effort:** ~5 min · **Status:** OPEN
**Affected file:** `app/(school-tabs)/invoices.tsx:135-139`

## Problem

```ts
useEffect(() => {
  if (isFocused) { refreshData(); }
}, [user, isFocused, refreshData]);
```

`user` is in deps but not read in the body. Refetch fires when user changes, but invoice state from the previous user isn't cleared between the user-change and the new fetch completing.

## Impact

When user switches accounts: brief flash of previous user's invoices before new data arrives. See Bug #47 for the security implication (no client-side school filter).

## Fix

```ts
const lastUserIdRef = useRef<string | undefined>(undefined);

useEffect(() => {
  if (user?.id !== lastUserIdRef.current) {
    setFilteredInvoices([]);
    setStats(null);
    lastUserIdRef.current = user?.id;
  }
  if (isFocused && user) refreshData();
}, [user, isFocused, refreshData]);
```

## Related

Bug #47 (combine fixes — same hook)
