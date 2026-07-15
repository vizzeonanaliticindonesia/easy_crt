# Bug #14 — `ApiInvoicesRepository` uses relative URLs that fail in React Native

**Severity:** HIGH (if `mode === 'api'` is ever flipped on) · **Effort:** ~30 min
**Status:** OPEN
**Affected file:** `lib/repositories/invoicesRepository.ts:53, 63, 87`

## Problem

```ts
// lib/repositories/invoicesRepository.ts:50-94
class ApiInvoicesRepository implements InvoicesRepository {
    async getBySchoolId(schoolId: string): Promise<InvoiceRecord[]> {
        const res = await fetch(`/api/invoices?schoolId=${schoolId}`);   // ← relative URL
        if (!res.ok) throw new Error('Failed fetch invoices');
        return await res.json();
    }

    async updateStatus(...) {
        const res = await fetch(`/api/invoice/update-status`, { ... });   // ← relative
    }

    async submitPayment(...) {
        const res = await fetch(`/api/invoice/payment`, { ... });         // ← relative
    }
}
```

## Impact

React Native's `fetch` does **not support relative URLs**. Relative paths throw `TypeError: Network request failed` or similar.

Additionally:
- Bypasses the `api` wrapper in `lib/api.ts` — no auth token attached
- No error normalization
- Cannot be intercepted by MSW in tests

Currently the factory defaults to `'mock'` mode:
```ts
export function createInvoicesRepository(mode: 'mock' | 'api' = 'mock'): InvoicesRepository
```
So this code is **not running today**. But a single flag flip — or any future call site that passes `'api'` — will brick every invoice operation.

## Fix

Refactor `ApiInvoicesRepository` to use the `api` wrapper. This automatically handles base URL, auth token, JSON parsing, error normalization, and is MSW-testable:

```ts
// lib/repositories/invoicesRepository.ts
import api from '@/lib/api';

class ApiInvoicesRepository implements InvoicesRepository {
    async getBySchoolId(schoolId: string): Promise<InvoiceRecord[]> {
        return api.get('/invoices', { schoolId });
    }

    async updateStatus(invoiceId: string, status: InvoiceStatus, note: string): Promise<InvoiceRecord> {
        return api.post('/invoice/update-status', { invoiceId, status, note });
    }

    async submitPayment(invoiceId: string, method: InvoicePaymentMethod, proofFileName: string): Promise<InvoiceRecord> {
        const formData = new FormData();
        formData.append('invoiceId', invoiceId);
        formData.append('method', method);
        formData.append('proof', { uri: proofFileName, name: proofFileName, type: 'image/png' } as any);
        return api.post('/invoice/payment', formData);
    }
}
```

Verify the endpoint paths with the dev team — they may need a `/school/` prefix to match the actual backend routes.

## Acceptance criteria

- [ ] No `fetch('/...')` (relative URL) anywhere in `lib/repositories/`
- [ ] Flipping the factory to `'api'` mode allows invoices to load without crash
- [ ] Auth token is sent on every request (verified by network inspector)
- [ ] Regression test at `__tests__/regressions/bug-014-apirepository-relative-urls.test.tsx` that uses MSW to intercept and assert auth header presence

## Related

- Bug #9 — `AuthContext` similarly bypasses the api wrapper (different file, same pattern)
- Bug #38 — `insertInvoice` signature mismatch (different invoice flow, also broken)
