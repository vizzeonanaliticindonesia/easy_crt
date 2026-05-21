// invoices.repository.ts
import {
    getInvoicesBySchoolId,
    updateInvoiceStatus,
    submitInvoicePayment,
} from '@/lib/invoices';
import { InvoicePaymentMethod, InvoiceRecord, InvoiceStatus } from '@/types';

export interface InvoicesRepository {
    getBySchoolId(schoolId: string): Promise<InvoiceRecord[]>;
    updateStatus(invoiceId: string, status: InvoiceStatus, note: string): Promise<InvoiceRecord>;
    submitPayment(invoiceId: string, method: InvoicePaymentMethod, proofFileName: string): Promise<InvoiceRecord>;
}

// ================= MOCK =================
class MockInvoicesRepository implements InvoicesRepository {

    async getBySchoolId(schoolId: string): Promise<InvoiceRecord[]> {
        return await getInvoicesBySchoolId(schoolId);
    }

    async updateStatus(
        invoiceId: string,
        status: InvoiceStatus,
        note: string
    ): Promise<InvoiceRecord> {
        const updated = await updateInvoiceStatus(invoiceId, status, note);

        const found = updated.find(i => i.id === invoiceId);
        if (!found) throw new Error('Invoice not found after update');

        return found;
    }

    async submitPayment(
        invoiceId: string,
        method: InvoicePaymentMethod,
        proofFileName: string
    ): Promise<InvoiceRecord> {
        const updated = await submitInvoicePayment(invoiceId, method, proofFileName);

        const found = updated.find(i => i.id === invoiceId);
        if (!found) throw new Error('Invoice not found after payment');

        return found;
    }
}

// ================= API (READY TEMPLATE) =================
class ApiInvoicesRepository implements InvoicesRepository {

    async getBySchoolId(schoolId: string): Promise<InvoiceRecord[]> {
        const res = await fetch(`/api/invoices?schoolId=${schoolId}`);
        if (!res.ok) throw new Error('Failed fetch invoices');
        return await res.json();
    }

    async updateStatus(
        invoiceId: string,
        status: InvoiceStatus,
        note: string
    ): Promise<InvoiceRecord> {
        const res = await fetch(`/api/invoice/update-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invoiceId, status, note }),
        });

        if (!res.ok) throw new Error('Failed update status');
        return await res.json();
    }

    async submitPayment(
        invoiceId: string,
        method: InvoicePaymentMethod,
        proofFileName: string
    ): Promise<InvoiceRecord> {
        const formData = new FormData();
        formData.append('invoiceId', invoiceId);
        formData.append('method', method);
        formData.append('proof', {
            uri: proofFileName,
            name: proofFileName,
            type: 'image/png',
        } as any);

        const res = await fetch(`/api/invoice/payment`, {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) throw new Error('Failed submit payment');
        return await res.json();
    }
}

// ================= FACTORY =================
export function createInvoicesRepository(mode: 'mock' | 'api' = 'mock'): InvoicesRepository {
    return mode === 'api'
        ? new ApiInvoicesRepository()
        : new MockInvoicesRepository();
}

const MODE = __DEV__ ? 'mock' : 'api';

export const invoicesRepository = createInvoicesRepository(MODE);