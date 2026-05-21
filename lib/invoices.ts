import AsyncStorage from '@react-native-async-storage/async-storage';
import { InvoicePaymentMethod, InvoiceRecord, InvoiceStatus } from '@/types';
import { MOCK_INVOICES } from '@/lib/mockData';

const INVOICES_KEY = '@app_invoices';

function nowIso(): string {
    return new Date().toISOString();
}

function makeLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeInvoices(value: unknown): InvoiceRecord[] {
    if (!Array.isArray(value)) return [];
    return value as InvoiceRecord[];
}

export async function saveInvoices(invoices: InvoiceRecord[]): Promise<void> {
    await AsyncStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
}

export async function resetInvoices(): Promise<InvoiceRecord[]> {
    await saveInvoices(MOCK_INVOICES);
    return MOCK_INVOICES;
}

export async function getInvoices(): Promise<InvoiceRecord[]> {
    const raw = await AsyncStorage.getItem(INVOICES_KEY);
    if (!raw) {
        return await resetInvoices();
    }

    try {
        const parsed = JSON.parse(raw) as unknown;
        const normalized = normalizeInvoices(parsed);
        if (normalized.length === 0) {
            return await resetInvoices();
        }
        return normalized;
    } catch {
        return await resetInvoices();
    }
}

export async function getInvoicesBySchoolId(schoolId: string): Promise<InvoiceRecord[]> {
    const invoices = await getInvoices();
    return invoices.filter((item) => item.schoolId === schoolId);
}

export async function updateInvoiceStatus(
    invoiceId: string,
    status: InvoiceStatus,
    note: string
): Promise<InvoiceRecord[]> {
    const invoices = await getInvoices();
    const updated = invoices.map((invoice) => {
        if (invoice.id !== invoiceId) return invoice;

        const changedAt = nowIso();
        const nextPaidAt = status === 'unpaid' ? undefined : (invoice.paidAt || changedAt);

        return {
            ...invoice,
            status,
            paidAt: nextPaidAt,
            reasonLogs: [
                ...invoice.reasonLogs,
                {
                    id: makeLogId(),
                    changedAt,
                    notes: note,
                },
            ],
        };
    });
    await saveInvoices(updated);
    return updated;
}

export async function submitInvoicePayment(
    invoiceId: string,
    paymentMethod: InvoicePaymentMethod,
    paymentProofFileName: string
): Promise<InvoiceRecord[]> {
    const invoices = await getInvoices();
    const updated = invoices.map((invoice) => {
        if (invoice.id !== invoiceId) return invoice;

        const changedAt = nowIso();
        return {
            ...invoice,
            paymentMethod,
            paymentProofFileName,
            status: 'waiting_confirmation' as const,
            paidAt: changedAt,
            reasonLogs: [
                ...invoice.reasonLogs,
                {
                    id: makeLogId(),
                    changedAt,
                    notes: `Payment proof uploaded via ${paymentMethod === 'credit_card' ? 'Credit Card' : 'Bank Transfer'}.`,
                },
            ],
        };
    });

    await saveInvoices(updated);
    return updated;
}
