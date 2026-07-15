# Bug #54 — Invoice status compared as magic strings `'1'/'2'/'3'` in 4 sites → Pay button on already-paid invoice

**Severity:** MEDIUM · **Effort:** ~30 min · **Status:** OPEN
**Affected file:** `app/(school-tabs)/invoices.tsx:62-72, 146-149, 375-401`

## Problem

```ts
if (filteredInvoice === '1') return 'Paid';
...
{item.status === '1' ? (...) : item.status === '2' ? (...) : (...)}
```

Status compared as string `'1'/'2'/'3'` in four separate places. If backend returns integer `1` (not `'1'`), comparison `=== '1'` silently fails → status mapped as "Unpaid" → **Pay button appears on an already-paid invoice → double payment possible**.

## Impact

If wire format ever drifts from string-encoded to numeric, every invoice shows as unpaid and the Pay button is active. User pays a second time. Money lost.

## Fix

Centralize the status enum + coerce once at parse time:

```ts
export const INVOICE_STATUS = {
  PAID: '1',
  WAITING: '2',
  REJECTED: '3',
} as const;

// At the data boundary (where invoices are loaded):
const normalized = data.map(inv => ({ ...inv, status: String(inv.status) }));

// Then everywhere:
if (item.status === INVOICE_STATUS.PAID) { ... }
```

## Related

Bug #45 (filter UI missing statuses) · Bug #22 (similar magic-status comparison on bookings)
