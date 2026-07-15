# Bug #39 — Stripe `paymentMethod.id` and full error bodies logged to console

**Severity:** CRITICAL · **Effort:** ~5 min · **Status:** OPEN
**Extends:** Bugs #3, #16, #40 (same pattern — production console logs of sensitive data)
**Affected file:** `app/(school-tabs)/invoices.tsx:216-230`

## Problem

```tsx
// app/(school-tabs)/invoices.tsx:216-218
console.log('PAYMENT TARGET:', paymentTarget.id);
console.log('PAYMENT METHOD:', paymentMethod.id);    // ← Stripe pm_xxx identifier
console.log('CALLING INSERT INVOICE');

// ... API call ...

// app/(school-tabs)/invoices.tsx:227-230
} catch (err: any) {
  console.log(
    'PAYMENT ERROR:',
    JSON.stringify(err?.response?.data, null, 2)    // ← full backend error body
  );
}
```

## Impact

Stripe `paymentMethod.id` values (format: `pm_xxxxxxxxxxxx`) appear in `logcat`, iOS unified log, and crash-reporter breadcrumbs. While Stripe docs note these are not directly chargeable without the publishable key, they:
- Identify a specific user's payment instrument
- Are useful for fraud correlation
- Are explicitly listed as "do not log" in Stripe's PCI guidance for client-side SDKs

The error JSON dump (`err.response.data`) can contain:
- Backend stack traces
- Internal IDs (invoice IDs, school IDs)
- Validation messages that may reveal schema details
- In some failure modes, the user's input data echoed back

Combine with Bug #3 (bearer token logged) → device log becomes a payment-fraud toolkit.

## Fix

Delete all three logs:

```tsx
// app/(school-tabs)/invoices.tsx
try {
    const { paymentMethod, error } = await createPaymentMethod({ ... });
    if (error || !paymentMethod) {
        notify('Error', error?.message || 'Failed to process card.');
        return;
    }

    // DELETE these three:
    // console.log('PAYMENT TARGET:', paymentTarget.id);
    // console.log('PAYMENT METHOD:', paymentMethod.id);
    // console.log('CALLING INSERT INVOICE');

    await insertInvoice(paymentTarget.id, paymentMethod.id, /* see Bug #38 */);

    setPaymentModalVisible(false);
    notify('Success', 'Payment completed successfully.');
    await refreshData();

} catch (err: any) {
    // DELETE the JSON.stringify log; replace with user-facing notification only:
    notify('Error', err?.response?.data?.message || 'Failed to submit payment.');
    // Optional: route err through a sanitized reporter
    // reportError('Payment failed', err);
}
```

If you want to keep dev-only logging for debugging:

```tsx
if (__DEV__) {
  console.log('Payment attempt', { invoiceId: paymentTarget.id });   // OK — no PM id
}
```

Never log `paymentMethod.id` even in dev. Dev logs end up in screenshares and Slack threads during pair programming.

## Acceptance criteria

- [ ] `grep -n "PAYMENT\\|paymentMethod\\.id\\|err\\?\\.response\\?\\.data" app/(school-tabs)/invoices.tsx` returns no `console.log` matches
- [ ] Manual test: open device log, make a payment attempt, no `pm_...` string appears in log
- [ ] Manual test: failed payment shows user-friendly toast; no JSON dump in console
- [ ] Regression test exists at `__tests__/regressions/bug-039-stripe-paymentmethod-logged.test.tsx`

## Related

- Bug #3 — bearer token logged (same kind of leak)
- Bug #16 — broader log leakage in profile + booking screens
- Bug #38 — fix together; both are in the same payment-submit flow
- Bug #40 — full user object logged on route change
