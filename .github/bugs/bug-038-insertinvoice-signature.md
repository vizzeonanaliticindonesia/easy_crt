# Bug #38 — `insertInvoice` signature mismatch — credit card payment crashes

**Severity:** CRITICAL · **Type:** REGRESSION (introduced by the recent rewrite)
**Effort:** ~30 min · **Status:** OPEN · **Priority:** P0 hotfix
**Affected files:**
- **Caller:** `app/(school-tabs)/invoices.tsx:220`
- **Service:** `lib/services/school.ts:210`

## Problem

The caller passes 2 arguments; the service requires 3 and immediately reads the third:

```tsx
// app/(school-tabs)/invoices.tsx:220 (CALLER — only 2 args)
await insertInvoice(paymentTarget.id, paymentMethod.id);
```

```ts
// lib/services/school.ts:210 (SERVICE — requires 3 args)
export async function insertInvoice(
  invoiceId: string,
  paymentMethod: string,
  payload: { fileUri: string; fileMimeType: string; fileName: string }   // ← MISSING
) {
  const formData = new FormData();
  formData.append('invoice_id', invoiceId);
  formData.append('payment_method', paymentMethod);

  if (Platform.OS === 'web') {
    const resBlob = await fetch(payload.fileUri);   // ← TypeError here
    // ...
  }
}
```

When `payload` is `undefined`, the next line throws:
```
TypeError: Cannot read properties of undefined (reading 'fileUri')
```

## Impact

**Every credit-card payment attempt fails.** Steps to reproduce:
1. Log in as a school
2. Go to Invoices tab
3. Tap "Pay" on any unpaid invoice
4. Enter card details (test card 4242 4242 4242 4242 works)
5. Submit

→ Crash. Generic "Failed to submit payment" toast shown to user. No payment is processed.

This is a regression introduced by the recent rewrite. The service signature changed (from "upload proof of payment" to "Stripe paymentMethod flow") but the caller was never updated.

## Fix — pick one option

The right fix depends on whether the new Stripe flow still requires the user to upload a proof of payment (e.g., bank transfer screenshot) OR if Stripe paymentMethod alone is the source of truth.

### Option A (preferred if Stripe is the only payment source)

Make `payload` optional in the service:

```ts
// lib/services/school.ts:210
export async function insertInvoice(
  invoiceId: string,
  paymentMethod: string,
  payload?: { fileUri: string; fileMimeType: string; fileName: string }
) {
  const formData = new FormData();
  formData.append('invoice_id', invoiceId);
  formData.append('payment_method', paymentMethod);

  if (payload) {
    if (Platform.OS === 'web') {
      const resBlob = await fetch(payload.fileUri);
      const blob = await resBlob.blob();
      formData.append('file_payment', blob, payload.fileName || 'file');
    } else {
      formData.append('file_payment', { uri: payload.fileUri, ... });
    }
  }

  return api.post('/school/invoice/insert', formData);
}
```

The caller stays as-is (`insertInvoice(paymentTarget.id, paymentMethod.id)`).

### Option B (if proof upload is required)

Add a file picker in the payment modal (`app/(school-tabs)/invoices.tsx`), and pass the picked file as the third argument:

```tsx
const [proofFile, setProofFile] = useState<{uri:string;mimeType:string;name:string}|null>(null);
// ... add a `DocumentPicker.getDocumentAsync` flow that sets proofFile ...
await insertInvoice(paymentTarget.id, paymentMethod.id, {
  fileUri: proofFile.uri,
  fileMimeType: proofFile.mimeType,
  fileName: proofFile.name,
});
```

Disable the Submit button while `proofFile` is null.

## Acceptance criteria

- [ ] Tap "Pay" on an unpaid invoice → modal opens
- [ ] Submit with valid card details → no `TypeError`; success toast shown
- [ ] Invoice status updates to "Waiting Confirmation" or "Paid" in the list (depends on backend)
- [ ] Network inspector shows a single POST to `/school/invoice/insert`
- [ ] A regression test exists at `__tests__/regressions/bug-038-insertinvoice-signature.test.tsx`
- [ ] Stripe `paymentMethod.id` is **not** logged to console (also addresses **Bug #39** — fix together)

## Related

- Bug #39 — Stripe `paymentMethod.id` and full error bodies logged in the same flow
- Bug #44 — `formatCurrency` is broken; even if pay works, the invoice list shows garbage amounts
- Bug #46 — invoice list `keyExtractor` is broken (numeric id passed as React key)
- Bug #54 — invoice status comparison uses magic strings — pay button shown on already-paid invoices
- This is one of **two regressions** introduced by the recent pull. The other is Bug #70.
