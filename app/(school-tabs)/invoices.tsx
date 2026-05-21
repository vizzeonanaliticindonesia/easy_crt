import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    Modal,
    Platform,
    ScrollView,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { notify } from '@/lib/dialogs';
import { invoicesRepository } from '@/lib/repositories/invoicesRepository';
import { resetInvoices } from '@/lib/invoices';
import { useIsFocused } from '@react-navigation/native';
import { InvoicePaymentMethod, InvoiceReasonLog, InvoiceRecord, InvoiceStatus } from '@/types';
import {
    AppButton,
    AppCard,
    AppChipGroup,
    AppEmptyState,
    AppPageHeader,
    AppStatusBadge,
    useResponsiveSpacing,
} from '@/components/ui/AppPrimitives';
import { getInvoiceData, getPaymentLogs, insertInvoice } from '@/lib/services/school';

type FilterStatus = 'all' | 'unpaid' | 'waiting_confirmation' | 'paid' | 'rejected';

const STATUS_FILTERS: FilterStatus[] = ['all', 'unpaid', 'waiting_confirmation', 'paid', 'rejected'];

function formatCurrency(amount: number): string {
    return `$${amount}`;
}

function formatShortDateTime(value?: string): string {
    if (!value) return '-';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return '-';

    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    const hh = String(dt.getHours()).padStart(2, '0');
    const min = String(dt.getMinutes()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
}

function toMethodLabel(method?: InvoicePaymentMethod): string {
    if (!method) return '-';
    return method === 'credit_card' ? 'Credit Card' : 'Bank Transfer';
}

function getStatusLabel(filteredInvoice: InvoiceStatus): string {
    if (filteredInvoice === '1') return 'Paid';
    if (filteredInvoice === '2') return 'Waiting Confirmation';
    if (filteredInvoice === '3') return 'Rejected';
    return 'Unpaid';
}

function getStatusTone(filteredInvoice: InvoiceStatus): 'pending' | 'complete' | 'declined' | 'neutral' {
    if (filteredInvoice === '1') return 'complete';
    if (filteredInvoice === '2') return 'pending';
    if (filteredInvoice === '3') return 'declined';
    return 'neutral';
}

function getFilterLabel(status: FilterStatus): string {
    if (status === 'all') return 'All';
    if (status === 'waiting_confirmation') return 'Waiting';
    if (status === 'paid') return 'Paid';
    if (status === 'rejected') return 'Rejected';
    return 'Unpaid';
}

function getDefaultProofName(bookingId: string): string {
    return `proof_${bookingId.toLowerCase().replace(/[^a-z0-9]/g, '')}.png`;
}

export default function SchoolInvoicesScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const spacing = useResponsiveSpacing();
    const topPad = Platform.OS === 'web' ? 67 : insets.top;
    const isFocused = useIsFocused();
    const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

    const [logsVisible, setLogsVisible] = useState(false);
    const [logsTitle, setLogsTitle] = useState('');
    const [activeLogs, setActiveLogs] = useState<any[]>([]);

    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [paymentTarget, setPaymentTarget] = useState<InvoiceRecord | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<InvoicePaymentMethod>('credit_card');
    const [paymentProofFileName, setPaymentProofFileName] = useState('');
    const [paymentProofUri, setPaymentProofUri] = useState('');
    const [paymentProofMimeType, setPaymentProofMimeType] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, unpaid: 0, waiting: 0, paid: 0 });
    
    const [reviewVisible, setReviewVisible] = useState(false);
    const [reviewData, setReviewData] = useState<any>(null);

    // Fungsi refresh data
    const refreshData = useCallback(async () => {
        try {
            setLoading(true);
            const item = await getInvoiceData();
            setFilteredInvoices(item.invoice);
            setStats(item);
        } catch (error) {
            console.error('Failed to refresh data:', error);
            notify('Error', 'Failed to refresh data.');
        } finally {
            setLoading(false);
        }
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refreshData();
        } finally {
            setRefreshing(false);
        }
    }, [refreshData]);

    // const loadInvoices = useCallback(async () => {
    //     if (!user || user.role !== 9) {
    //         setInvoices([]);
    //         setLoading(false);
    //         return;
    //     }

    //     setLoading(true);
    //     try {
    //         const items = await getInvoiceData();
    //         setFilteredInvoices(items.invoice);
    //     } catch {
    //         notify('Error', 'Failed to load invoices.');
    //     } finally {
    //         setLoading(false);
    //     }
    // }, [user]);

    useEffect(() => {
        if (isFocused) {
            refreshData();
        }
    }, [user, isFocused, refreshData]);

    const filteredData = useMemo(() => {
        const q = search.toLowerCase();

        return filteredInvoices.filter((item) => {
            function mapStatus(status: string) {
                if (status === '1') return 'paid';
                if (status === '2') return 'waiting_confirmation';
                if (status === '3') return 'rejected';
                return 'unpaid';
            }

            // 1. filter status
            if (statusFilter !== 'all' && mapStatus(item.status) !== statusFilter) {
                return false;
            }

            // 2. kalau search kosong → tampil semua
            if (!q) return true;

            // 3. gabung semua text
            const text = `
                ${item.booking_id}
                ${item.subject_name}
                ${item.first_name}
                ${item.last_name}
                ${item.status}
            `.toLowerCase();

            // 4. cek apakah mengandung search
            return text.includes(q);
        });

    }, [filteredInvoices, search, statusFilter]);

    async function openLogs(id: number) {
        const paymentLogs = await getPaymentLogs(id);
        const item = paymentLogs.payment_logs;
        setLogsTitle(`Payment ID : ${id}`);
        setActiveLogs(item);
        setLogsVisible(true); 
    }

    function openPayModal(item: InvoiceRecord) {
        setPaymentTarget(item);
        setPaymentMethod(item.paymentMethod || 'credit_card');
        setPaymentProofFileName(item.paymentProofFileName || '');
        setPaymentProofUri('');
        setPaymentModalVisible(true);
    }

    function closePayModal() {
        if (submitting) return;
        setPaymentModalVisible(false);
        setPaymentTarget(null);
        setPaymentProofUri('');
    }

    async function handlePickPaymentProof() {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/jpeg', 'image/png'],
                copyToCacheDirectory: true,
                multiple: false,
            });

            if (result.canceled || !result.assets?.[0]) return;

            const file = result.assets[0] as any;
            const name = file.name || getDefaultProofName(paymentTarget?.booking_id || 'proof');
            const uri = file.uri || '';
            const mime = String(file.mimeType || file.type || file.contentType || '');

            setPaymentProofFileName(name);
            setPaymentProofUri(uri);
            setPaymentProofMimeType(mime);
        } catch (err) {
            console.error(err);
            notify('Error', 'Failed to pick payment proof file.');
        }
    }

    async function handleSubmitPayment() {
        if (!paymentTarget) return;

        if (!paymentProofFileName.trim()) {
            notify('Error', 'Please attach payment proof file.');
            return;
        }

        setSubmitting(true);
        try {
            const updated = await insertInvoice(paymentTarget.id, paymentMethod, {
                fileUri: paymentProofUri,
                fileMimeType: paymentProofMimeType || 'application/octet-stream',
                fileName: paymentProofFileName,
            });

            //update state 
            setInvoices(prev =>
                prev.map(i => i.id === updated.id ? updated : i)
            );

            setPaymentModalVisible(false);

            notify('Submitted', 'Payment proof uploaded. Invoice is now waiting confirmation.');
            // refresh the invoice list
            await refreshData();        
        } catch (err) {
            console.error(err);
            notify('Error', 'Failed to submit payment proof.');
        } finally {
            setSubmitting(false);
        }
    }

    async function simulatePaid(item: InvoiceRecord) {
        try {
            const updated = await invoicesRepository.updateStatus(
                item.id,
                'paid',
                'Payment verified by finance team.'
            );

            setInvoices(prev =>
                prev.map(i => i.id === updated.id ? updated : i)
            );

            notify('Success', 'Invoice marked as paid.');
            await refreshData();
        } catch (err) {
            console.error(err);
            notify('Error', 'Failed to update invoice status.');
        }
    }

    async function handleResetDemoData() {
        try {
            const items = await resetInvoices();
            setInvoices(items.filter((item) => item.schoolId === user?.id));
            notify('Reset', 'Dummy invoice data restored for testing.');
            await refreshData();
        } catch (err) {
            console.error(err);
            notify('Error', 'Failed to reset dummy invoice data.');
        }
    }

    function handleReview(item: InvoiceRecord) {
        if (item.review_id !== null) {
            setReviewData(item);
            setReviewVisible(true);
            return;
        }
        router.push({ pathname: '/review-teacher', params: { id: item.booking_id } });
    }

    return (
        <View style={[styles.container, { paddingTop: topPad + spacing.topOffset }]}>
            <View style={{ paddingHorizontal: spacing.horizontal }}>
                <View style={styles.headerRow}>
                    <AppPageHeader 
                        title="Invoices" 
                        subtitle="Track payments, status, and logs" 
                        style={styles.header}
                    />
                    {/* <TouchableOpacity 
                        onPress={refreshData} 
                        style={styles.refreshBtn}
                        disabled={loading}
                    >
                        <Ionicons 
                            name="refresh" 
                            size={20} 
                            color={loading ? Colors.textMuted : Colors.primary} 
                        />
                    </TouchableOpacity> */}
                </View>

                <AppCard padding={spacing.cardPadding - 2} style={styles.statCard}>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.total}</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: Colors.warning }]}>{stats.unpaid}</Text>
                            <Text style={styles.statLabel}>Unpaid</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: Colors.statusActive }]}>{stats.waiting}</Text>
                            <Text style={styles.statLabel}>Waiting</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: Colors.statusComplete }]}>{stats.paid}</Text>
                            <Text style={styles.statLabel}>Paid</Text>
                        </View>
                    </View>
                </AppCard>

                <View style={[styles.searchWrap, { marginTop: spacing.sectionGap }]}>
                    <Ionicons name="search" size={18} color={Colors.textMuted} />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search booking, teacher, subject..."
                        placeholderTextColor={Colors.textMuted}
                        style={styles.searchInput}
                    />
                </View>
            </View>

            <View style={[styles.filterWrap, { marginTop: spacing.sectionGap - 2, marginBottom: spacing.sectionGap / 2 }]}>
                <AppChipGroup
                    horizontal
                    size="sm"
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterGroup}
                    contentContainerStyle={{
                        paddingHorizontal: spacing.horizontal,
                        paddingBottom: 4,
                        paddingTop: 2,
                    }}
                    items={STATUS_FILTERS.map((status) => ({
                        id: status,
                        label: getFilterLabel(status),
                        selected: statusFilter === status,
                        onPress: () => setStatusFilter(status),
                        tone: status === 'paid' ? 'secondary' : status === 'rejected' ? 'danger' : status === 'waiting_confirmation' ? 'warning' : status === 'all' ? 'primary' : 'neutral',
                        variant: 'soft',
                    }))}
                />
            </View>

            <FlatList
                data={filteredData}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{
                    paddingHorizontal: spacing.horizontal,
                    paddingTop: spacing.sectionGap,
                    paddingBottom: spacing.bottomPadding,
                }}
                refreshing={refreshing}
                onRefresh={onRefresh}
                renderItem={({ item }) => (
                    <AppCard padding={spacing.cardPadding - 4} style={styles.invoiceCard}>
                        <View style={styles.invoiceHeader}>
                            <View style={styles.invoiceTitleWrap}>
                                <Text style={styles.bookingId}>Booking ID : {item.booking_id}</Text>
                                <Text style={styles.metaText}>{item.subject_name || 'General Invoice'}</Text>
                            </View>
                            <AppStatusBadge
                                label={getStatusLabel(item.status)}
                                tone={getStatusTone(item.status)}
                                size="sm"
                            />
                        </View>

                        <View style={styles.detailsBlock}>
                            <View style={styles.rowItem}>
                                <Text style={styles.rowLabel}>Amount</Text>
                                <Text style={styles.rowValueStrong}>{formatCurrency(item.total_amount)}</Text>
                            </View>
                            <View style={styles.rowItem}>
                                <Text style={styles.rowLabel}>Payment Method</Text>
                                <Text style={styles.rowValue}>{toMethodLabel(item.payment_method)}</Text>
                            </View>
                            <View style={styles.rowItem}>
                                <Text style={styles.rowLabel}>Paid At</Text>
                                <Text style={styles.rowValue}>{formatShortDateTime(item.paid_at)}</Text>
                            </View>
                            <View style={styles.rowItem}>
                                <Text style={styles.rowLabel}>Teacher</Text>
                                <Text style={styles.rowValue}>{item.first_name + ' ' + item.last_name || '-'}</Text>
                            </View>
                        </View>

                        <View style={styles.primaryActionsRow}>
                            <AppButton
                                title="Payment Logs"
                                onPress={() => openLogs(item.id)}
                                variant="outline"
                                size="md"
                                style={styles.flexActionBtn}
                            />

                            {item.status === '1' ? (
                                <AppButton
                                    title="Review"
                                    onPress={() => handleReview(item)}
                                    variant="secondary"
                                    size="md"
                                    style={styles.flexActionBtn}
                                />
                            ) : item.status === '2' ? (
                                <AppButton
                                    title="Waiting"
                                    onPress={() => { }}
                                    disabled
                                    variant="outline"
                                    size="md"
                                    style={styles.flexActionBtn}
                                />
                            ) : (
                                <AppButton
                                    title="Pay"
                                    onPress={() => openPayModal(item)}
                                    variant="primary"
                                    size="md"
                                    style={styles.flexActionBtn}
                                /> 
                            ) }
                        </View>

                    </AppCard>
                )}
                // refresh handled via `refreshing` + `onRefresh`
                ListEmptyComponent={
                    <AppEmptyState
                        icon="receipt-outline"
                        title="No invoices found"
                        subtitle="Invoice data will appear here after generation"
                        padding={spacing.cardPadding}
                    />
                }
            />

            <Modal visible={logsVisible} transparent animationType="fade" onRequestClose={() => setLogsVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { padding: spacing.cardPadding }]}>
                        <Text style={styles.modalTitle}>{logsTitle}</Text>
                        <ScrollView
                            style={styles.logsScroll}
                            contentContainerStyle={styles.logsContent}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    colors={[Colors.primary]}
                                    tintColor={Colors.primary}
                                    progressBackgroundColor={Colors.surface}
                                />
                            }
                        >
                            {activeLogs.length === 0 ? (
                                <Text style={styles.emptyLogText}>No entries</Text>
                            ) : (
                                activeLogs.map((log, index) => (
                                    <View key={log.id} style={styles.logRow}>
                                        <Text style={styles.logNo}>{index + 1}.</Text>
                                        <View style={styles.logBodyWrap}>
                                            <Text style={styles.logTime}>{formatShortDateTime(log.changed_at)}</Text>
                                            <Text style={styles.logNotes}>{log.notes}</Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                        <AppButton title="Close" onPress={() => setLogsVisible(false)} variant="outline" size="md" />
                    </View>
                </View>
            </Modal>

            <Modal visible={reviewVisible} transparent animationType="fade" onRequestClose={() => setReviewVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { padding: spacing.cardPadding }]}>
                        
                        {/* Title */}
                        <Text style={styles.modalTitle}>Review</Text>

                        <ScrollView
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    colors={[Colors.primary]}
                                    tintColor={Colors.primary}
                                    progressBackgroundColor={Colors.surface}
                                />
                            }
                        >
                            
                            {/* 🔹 Teacher Info (API nanti) */}
                            <View style={styles.reviewHeader}>
                                <Text style={styles.teacherName}>
                                    {reviewData?.first_name || '-'}, {reviewData?.last_name || '-'}
                                </Text>
                                <Text style={styles.sessionInfo}>
                                    {reviewData?.subject_name || '-'} - {reviewData?.request_date || '-'}
                                </Text>
                            </View>

                            {/* 🔹 Rating */}
                            <View style={styles.stars}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Ionicons
                                        key={star}
                                        name={star <= (reviewData?.teacher_rating || 0) ? 'star' : 'star-outline'}
                                        size={28}
                                        color={Colors.warning}
                                    />
                                ))}
                            </View>

                            <Text style={styles.ratingText}>
                                {reviewData?.teacher_rating || 0} / 5
                            </Text>

                            {/* 🔹 Comment */}
                            <View style={styles.commentBox}>
                                <Text style={styles.commentText}>
                                    {reviewData?.teacher_review || 'No review available'}
                                </Text>
                            </View>

                            {/* 🔹 Date */}
                            <Text style={styles.dateText}>
                                {reviewData?.created_at_review || ''}
                            </Text>

                        </ScrollView>

                        {/* Close Button */}
                        <AppButton
                            title="Close"
                            onPress={() => setReviewVisible(false)}
                            variant="outline"
                            size="md"
                        />
                    </View>
                </View>
            </Modal>

            <Modal visible={paymentModalVisible} transparent animationType="slide" onRequestClose={closePayModal}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { padding: spacing.cardPadding }]}>
                        <Text style={styles.modalTitle}>Pay Invoice</Text>
                        {paymentTarget ? (
                            <>
                                <Text style={styles.summaryText}>Booking ID: {paymentTarget.booking_id}</Text>
                                <Text style={styles.summaryText}>Total Amount: {formatCurrency(paymentTarget.total_amount)}</Text>

                                <View style={styles.bankInfoBox}>
                                    <Text style={styles.bankTitle}>Destination Bank Details</Text>
                                    <Text style={styles.bankText}>Bank: BCA</Text>
                                    <Text style={styles.bankText}>Account Number: 1234567890</Text>
                                    <Text style={styles.bankText}>Account Holder: John Doe</Text>
                                    <Text style={styles.bankText}>Branch: Jakarta Sudirman</Text>
                                </View>

                                <Text style={styles.fieldLabel}>Payment Method</Text>
                                <View style={styles.methodRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.methodBtn,
                                            paymentMethod === 'credit_card' && styles.methodBtnActive,
                                        ]}
                                        onPress={() => setPaymentMethod('credit_card')}
                                    >
                                        <Text style={[styles.methodBtnText, paymentMethod === 'credit_card' && styles.methodBtnTextActive]}>Credit Card</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.methodBtn,
                                            paymentMethod === 'bank_transfer' && styles.methodBtnActive,
                                        ]}
                                        onPress={() => setPaymentMethod('bank_transfer')}
                                    >
                                        <Text style={[styles.methodBtnText, paymentMethod === 'bank_transfer' && styles.methodBtnTextActive]}>Bank Transfer</Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.fieldLabel}>Payment Proof</Text>
                                <View style={styles.proofBox}>
                                    <Text style={styles.proofFileName}>{paymentProofFileName || '-'}</Text>
                                    <TouchableOpacity
                                        style={styles.pickFileBtn}
                                        onPress={handlePickPaymentProof}
                                    >
                                        <Ionicons name="attach-outline" size={16} color={Colors.primary} />
                                        <Text style={styles.pickFileText}>{paymentProofFileName ? 'Replace File' : 'Choose File'}</Text>
                                    </TouchableOpacity>
                                </View>
                                {paymentProofUri ? (
                                    <Text style={styles.uploadMetaText}>Selected: {paymentProofUri}</Text>
                                ) : null}

                                <View style={styles.modalActionRow}>
                                    <AppButton
                                        title="Cancel"
                                        onPress={closePayModal}
                                        variant="outline"
                                        size="md"
                                        style={styles.flexActionBtn}
                                    />
                                    <AppButton
                                        title="Confirm Payment"
                                        onPress={handleSubmitPayment}
                                        loading={submitting}
                                        size="md"
                                        style={styles.flexActionBtn}
                                    />
                                </View>
                            </>
                        ) : null}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    headerRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 8 
    },
    header: { flex: 1, marginBottom: 0 },
    refreshBtn: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        marginLeft: 12,
    },
    statCard: { borderRadius: 14 },
    statsRow: { flexDirection: 'row', alignItems: 'center' },
    statItem: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, height: 34, backgroundColor: Colors.border },
    statValue: { fontSize: 20, fontWeight: '800' as const, color: Colors.text },
    statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: { flex: 1, fontSize: 14, color: Colors.text, paddingVertical: 0 },
    resetDemoBtn: {
        marginTop: 10,
        alignSelf: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.primary + '40',
        backgroundColor: Colors.primaryBg,
    },
    resetDemoText: { fontSize: 12, fontWeight: '700' as const, color: Colors.primary },
    filterWrap: {
        zIndex: 2,
        elevation: 2,
    },
    filterGroup: {
        minHeight: 46,
    },
    invoiceCard: { marginBottom: 12, borderRadius: 14 },
    invoiceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
        gap: 10,
    },
    invoiceTitleWrap: { flex: 1 },
    bookingId: { fontSize: 16, fontWeight: '800' as const, color: Colors.text },
    metaText: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    detailsBlock: {
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
        borderRadius: 12,
        padding: 10,
        marginBottom: 12,
        gap: 8,
    },
    rowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
    rowLabel: { fontSize: 12, color: Colors.textSecondary },
    rowValue: { fontSize: 12, color: Colors.text, fontWeight: '600' as const, flexShrink: 1, textAlign: 'right' },
    rowValueStrong: { fontSize: 14, color: Colors.text, fontWeight: '800' as const },
    primaryActionsRow: { flexDirection: 'row', gap: 8 },
    flexActionBtn: { flex: 1 },
    testActionsRow: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    testAction: { paddingVertical: 4, paddingHorizontal: 2 },
    testActionText: { fontSize: 12, fontWeight: '700' as const },
    testDivider: { color: Colors.textMuted, fontSize: 12 },
    modalOverlay: {
        flex: 1,
        backgroundColor: '#00000050',
        justifyContent: 'center',
        padding: 20,
    },
    modalCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        maxHeight: '85%',
    },
    modalTitle: { fontSize: 18, fontWeight: '800' as const, color: Colors.text, marginBottom: 10 },
    logsScroll: { maxHeight: 340, marginBottom: 14 },
    logsContent: { gap: 10 },
    emptyLogText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginVertical: 12 },
    logRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
    logNo: { width: 20, fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    logBodyWrap: {
        flex: 1,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 10,
        padding: 9,
        backgroundColor: Colors.background,
    },
    logTime: { fontSize: 11, color: Colors.textMuted, marginBottom: 4 },
    logNotes: { fontSize: 13, color: Colors.text },
    summaryText: { fontSize: 13, color: Colors.text, marginBottom: 4 },
    bankInfoBox: {
        marginTop: 10,
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
        padding: 10,
    },
    bankTitle: { fontSize: 13, fontWeight: '700' as const, color: Colors.text, marginBottom: 6 },
    bankText: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
    fieldLabel: { fontSize: 13, fontWeight: '700' as const, color: Colors.text, marginBottom: 8 },
    methodRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    methodBtn: {
        flex: 1,
        height: 38,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
    },
    methodBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
    methodBtnText: { fontSize: 13, fontWeight: '700' as const, color: Colors.textSecondary },
    methodBtnTextActive: { color: Colors.primary },
    proofBox: {
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
        borderRadius: 12,
        padding: 10,
        marginBottom: 12,
    },
    proofFileName: { fontSize: 12, color: Colors.text, marginBottom: 8 },
    pickFileBtn: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: Colors.primary + '40',
        borderRadius: 9,
        backgroundColor: Colors.primaryBg,
    },
    pickFileText: { fontSize: 12, fontWeight: '700' as const, color: Colors.primary },
    uploadMetaText: { fontSize: 11, color: Colors.textMuted, marginBottom: 10 },
    modalActionRow: { flexDirection: 'row', gap: 8 },
    teacherName: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: Colors.text,
        textAlign: 'center',
    },

    reviewHeader: {
        alignItems: 'center',
        marginBottom: 12,
    },

    sessionInfo: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 4,
    },

    stars: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 6,
    },

    ratingText: {
        textAlign: 'center',
        fontSize: 13,
        marginBottom: 12,
        color: Colors.textSecondary,
    },

    commentBox: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 10,
        padding: 10,
        backgroundColor: Colors.background,
        marginBottom: 10,
    },

    commentText: {
        fontSize: 13,
        color: Colors.text,
    },

    dateText: {
        fontSize: 11,
        color: Colors.textMuted,
        textAlign: 'right',
        marginBottom: 10,
    },
});
