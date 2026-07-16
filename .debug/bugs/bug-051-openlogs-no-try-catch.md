# Bug #51 — `openLogs(id)` has no try/catch and no loading state

**Severity:** MEDIUM · **Effort:** ~10 min · **Status:** OPEN
**Affected file:** `app/(school-tabs)/invoices.tsx:175-181`

## Problem

```ts
async function openLogs(id: number) {
    const paymentLogs = await getPaymentLogs(id);
    const item = paymentLogs.payment_logs;
    setLogsTitle(`Payment ID : ${id}`);
    setActiveLogs(item);
    setLogsVisible(true);
}
```

No error handling. If `paymentLogs` is undefined/null, `.payment_logs` throws `TypeError`. No spinner during fetch → user can double-tap the "Payment Logs" button.

## Impact

Network failure → unhandled rejection → ErrorBoundary or app crash. Double-tap → duplicate modals or duplicate fetches.

## Fix

```ts
const [openingLogs, setOpeningLogs] = useState(false);

async function openLogs(id: number) {
  if (openingLogs) return;
  setOpeningLogs(true);
  try {
    const res = await getPaymentLogs(id);
    setLogsTitle(`Payment ID : ${id}`);
    setActiveLogs(res?.payment_logs ?? []);
    setLogsVisible(true);
  } catch (e) {
    notify('Error', 'Failed to load payment logs.');
  } finally {
    setOpeningLogs(false);
  }
}
```

Pass `disabled={openingLogs}` to the trigger button.

## Related

Bug #72, #74 (same loading/idempotency family)
