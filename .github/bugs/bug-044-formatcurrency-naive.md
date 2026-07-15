# Bug #44 — `formatCurrency` is naive — no decimals, no thousands, no null guard, unit ambiguity

**Severity:** HIGH · **Effort:** ~30 min · **Status:** OPEN
**Affected file:** `app/(school-tabs)/invoices.tsx:39-41` (definition) and 4 call sites (350, 461, 508, plus the Pay button)

## Problem

```ts
// app/(school-tabs)/invoices.tsx:39-41
function formatCurrency(amount: number): string {
    return `$${amount}`;
}
```

This produces:
- `formatCurrency(124.5)` → `"$124.5"` (no decimal padding)
- `formatCurrency(124.567)` → `"$124.567"` (no rounding)
- `formatCurrency(15000)` → `"$15000"` (no thousands separator — and ambiguous: is it $15,000 or 15,000 cents = $150?)
- `formatCurrency(null as any)` → `"$null"` (no guard)
- `formatCurrency(undefined as any)` → `"$undefined"` — displayed in the UI

## Impact

User-visible:
- Pay button shows misleading amounts ("$15000" might be $150 or $15,000)
- Invoice list shows raw numeric values instead of formatted currency
- Edge cases display `$undefined` or `$null`

Operationally:
- Australian users expect AUD formatting (`$15,000.00`)
- If backend returns cents, displayed dollar amount is 100x larger than reality — could lead to a user paying or expecting a wrong amount

## Fix

**Step 1 — Confirm with backend** whether `amount` is in dollars or cents. This is critical. If cents, divide by 100 first.

**Step 2 — Use `Intl.NumberFormat` for proper localization:**

```ts
// app/(school-tabs)/invoices.tsx
const AUD_FORMATTER = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(amount: number | string | null | undefined): string {
  if (amount == null) return '—';   // or '$0.00' if you want a zero placeholder
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(num)) return '—';
  // If backend sends cents, uncomment the next line:
  // return AUD_FORMATTER.format(num / 100);
  return AUD_FORMATTER.format(num);
}
```

**Step 3 — Move the formatter to a shared util** (`lib/format.ts`) so it can be reused on the teacher earnings screen, the session detail, etc. Same formatter everywhere = consistent UX.

## Acceptance criteria

- [ ] Whole-dollar amounts show as `$1,234.00` (two decimals)
- [ ] Fractional amounts round to 2 decimals (`$124.57`)
- [ ] Null / undefined / NaN show `—` (or chosen placeholder), never `$undefined`
- [ ] All currency displays use the same formatter
- [ ] Manual test on an invoice with a `124.5` amount → shows `$124.50`
- [ ] Regression test at `__tests__/regressions/bug-044-formatcurrency-naive.test.tsx`

## Related

- Bug #38 — payment flow fix (combine; same screen)
- Bug #45, #46 — also in invoices.tsx
