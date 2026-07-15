# Bug #45 — Invoice filter UI missing `waiting_confirmation` and `rejected` options

**Severity:** HIGH · **Effort:** ~15 min · **Status:** OPEN
**Affected file:** `app/(school-tabs)/invoices.tsx:35-37, 141-173`

## Problem

```ts
// app/(school-tabs)/invoices.tsx:35-37
type FilterStatus = 'all' | 'unpaid' | 'paid';
const STATUS_FILTERS: FilterStatus[] = ['all', 'unpaid', 'paid'];

// And the status-to-label mapper (line 141 area):
function mapStatus(status: string) {
  if (status === '1') return 'paid';
  if (status === '2') return 'waiting_confirmation';
  if (status === '3') return 'rejected';
  return 'unpaid';
}
```

Invoice records have four real statuses: `paid`, `waiting_confirmation`, `rejected`, `unpaid`. But the filter UI only exposes three buckets: `all`, `unpaid`, `paid`.

Users cannot filter to show only `waiting_confirmation` or `rejected` invoices, even though both exist in the data and even though stats cards may already display counts for them.

## Impact

- School user has 50 invoices, 3 of them rejected. To find the rejected ones, they have to scroll through the "all" view manually. No drill-down.
- The dashboard / stats may show a "Waiting" count card, but tapping it doesn't filter the list — confusing UX.

## Fix

Add the missing options to both the type and the constant:

```ts
// app/(school-tabs)/invoices.tsx
type FilterStatus = 'all' | 'unpaid' | 'paid' | 'waiting' | 'rejected';
const STATUS_FILTERS: FilterStatus[] = ['all', 'unpaid', 'paid', 'waiting', 'rejected'];

function getFilterLabel(status: FilterStatus): string {
  switch (status) {
    case 'all': return 'All';
    case 'unpaid': return 'Unpaid';
    case 'paid': return 'Paid';
    case 'waiting': return 'Waiting';
    case 'rejected': return 'Rejected';
  }
}
```

Update the filter function:

```ts
const filtered = useMemo(() => {
  if (filter === 'all') return invoices;
  return invoices.filter(inv => mapStatus(inv.status) === (filter === 'waiting' ? 'waiting_confirmation' : filter));
}, [invoices, filter]);
```

Or normalize `mapStatus` to return the same shape as `FilterStatus`:

```ts
function mapStatus(status: string): 'paid' | 'waiting' | 'rejected' | 'unpaid' {
  if (status === '1') return 'paid';
  if (status === '2') return 'waiting';
  if (status === '3') return 'rejected';
  return 'unpaid';
}
```

## Acceptance criteria

- [ ] Filter pills show: All, Unpaid, Paid, Waiting, Rejected
- [ ] Each filter shows only invoices in that bucket
- [ ] Stats card counts match filtered list counts (e.g., "Waiting: 3" → tap filter → 3 items shown)
- [ ] Regression test at `__tests__/regressions/bug-045-invoice-filter-missing-statuses.test.tsx`

## Related

- Bug #54 — invoice status compared as magic strings throughout — bigger pattern; fix #54 to also use a typed enum, then #45 leverages it cleanly
- Bug #44 — same screen, currency formatting bug
- Bug #46 — same screen, keyExtractor bug
