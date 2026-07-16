# Bug #47 — `getInvoiceData()` has no client-side school filter (defense-in-depth missing)

**Severity:** HIGH · **Effort:** ~15 min · **Status:** OPEN
**Pattern:** same as Bug #1 (cross-tenant data trust issue)
**Affected file:** `app/(school-tabs)/invoices.tsx:115` (and the surrounding useEffect)

## Problem

```ts
// app/(school-tabs)/invoices.tsx:115
const item = await getInvoiceData();   // no school ID parameter
setFilteredInvoices(item.invoice);
setStats(item);
```

The client trusts the backend completely to filter invoices by the logged-in school. There's no client-side check that `inv.school_id === user.id`. This is the same trust pattern that caused Bug #1.

Additionally:
- The `useEffect` at line 135-139 has `user` in the deps array but the effect body doesn't read it, and state isn't cleared when `user` changes → race condition shows previous user's invoices briefly during user switch.

## Impact

Two compounding risks:

1. **If the backend regresses or has a bug**, the school sees invoices from other schools. No client-side safety net.

2. **User-switching race**: if a user logs out and another logs in quickly (rare but possible), the new user briefly sees the old user's invoices until the new fetch completes.

This is a defense-in-depth gap. Even if the backend is bulletproof today, future regressions in backend auth would silently leak data.

## Fix

**Step 1 — Add defensive client-side filter:**

```ts
// app/(school-tabs)/invoices.tsx
const item = await getInvoiceData();
const myInvoices = (item.invoice ?? []).filter(inv =>
  String(inv.school_id) === String(user?.id)
);
setFilteredInvoices(myInvoices);
setStats({ ...item, invoice: myInvoices });
```

**Step 2 — Clear state on user change to prevent the race:**

```ts
// app/(school-tabs)/invoices.tsx
const lastUserIdRef = useRef<string | undefined>(undefined);

useEffect(() => {
  if (user?.id !== lastUserIdRef.current) {
    setFilteredInvoices([]);
    setStats(null);
    lastUserIdRef.current = user?.id;
  }
  if (isFocused && user) {
    refreshData();
  }
}, [user, isFocused, refreshData]);
```

## Acceptance criteria

- [ ] Switching from school A to school B → school B sees no invoices momentarily before the fetch, then sees only their own (not a flash of A's data)
- [ ] If a backend mock returns invoices for multiple schools, only the logged-in school's are shown
- [ ] No warnings about user-id mismatches at runtime
- [ ] Regression test at `__tests__/regressions/bug-047-getinvoicedata-no-school-filter.test.tsx`

## Related

- Bug #1 — same trust pattern, different surface
- Bug #53 — `useEffect` with `user` in deps but not in body (same effect, same file)
