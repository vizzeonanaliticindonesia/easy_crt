# Bug #46 — `FlatList keyExtractor` expects string but `item.id` is numeric

**Severity:** HIGH · **Effort:** ~2 min · **Status:** OPEN
**Affected file:** `app/(school-tabs)/invoices.tsx:325`

## Problem

```tsx
// app/(school-tabs)/invoices.tsx:325
keyExtractor={(item) => item.id}
```

`getInvoiceData()` returns invoice records where `id` is **numeric** (see signature of `openLogs(id: number)` at line 175 and `getPaymentLogs(paymentId: number)`). React's `FlatList.keyExtractor` requires a **string** return value.

## Impact

- React emits warnings: `Warning: Each child in a list should have a unique "key" prop. ...keys must be strings`
- Worse: if React tries to compare numeric IDs as keys via implicit string coercion, `id: 10` and `id: '10'` (if some come back from the API as strings) collide → wrong items re-rendered or duplicated
- Memory churn on every list update because React can't reliably diff items

## Fix

```tsx
// app/(school-tabs)/invoices.tsx:325
keyExtractor={(item) => String(item.id)}
```

If you want stronger guarantees, define the invoice record's `id` type as `string` in the service / repository layer and `String(...)` everywhere it's converted from a numeric backend response.

## Acceptance criteria

- [ ] React no longer warns about non-string keys
- [ ] List re-renders correctly when invoices are added/removed
- [ ] No item duplication in the rendered list
- [ ] Regression test at `__tests__/regressions/bug-046-keyextractor-numeric-id.test.tsx`

## Related

- Tiny mechanical fix — bundle with #44, #45, #47 (same file) in a single PR
