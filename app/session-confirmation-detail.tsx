import React, { useEffect, useState } from 'react';
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { notify } from '@/lib/dialogs';
import ScheduleCard, { getStatusVisual } from '@/components/ScheduleCard';
import {
    AppButton,
    AppEmptyState,
    AppIconButton,
    AppPageHeader,
    AppSectionHeader,
    useResponsiveSpacing,
} from '@/components/ui/AppPrimitives';
import { getSessionConfirmationDetails, confirmSession, rejectSession } from '@/lib/services/school';

export default function SessionDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const spacing = useResponsiveSpacing();
    const topPad = Platform.OS === 'web' ? 67 : insets.top;
    const { user } = useAuth();

    const [booking, setBooking] = useState<any>(null);
    const [schedules, setSchedules] = useState<any[]>([]);

    const [rejectVisible, setRejectVisible] = useState(false);
    const [selectedScheduleId, setSelectedScheduleId] = useState<string | number | null>(null);
    const [rejectNotes, setRejectNotes] = useState('');
    const [submittingReject, setSubmittingReject] = useState(false);
    const [submittingConfirmId, setSubmittingConfirmId] = useState<string | number | null>(null);

    const fetchDetail = async () => {
        try {
            const res = await getSessionConfirmationDetails(Number(id));
            setBooking(res.data?.booking || res.booking);
            setSchedules(res.data?.schedules || res.schedules || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (id) fetchDetail();
    }, [id]);

    const handleConfirmAttendance = async (scheduleId: string | number) => {
        setSubmittingConfirmId(scheduleId);
        try {
            const res = await confirmSession(Number(scheduleId), "");
            if (res.status !== 'success') {
                notify('Error', 'Failed to confirm attendance.');
                return;
            }
            await fetchDetail(); // ✅ re-fetch supaya booking status ikut update
        } catch (err) {
            console.error(err);
            notify('Error', 'Something went wrong.');
        }
        setSubmittingConfirmId(null);
    };

    const openRejectModal = (scheduleId: string | number) => {
        setSelectedScheduleId(scheduleId);
        setRejectNotes('');
        setRejectVisible(true);
    };

    const closeRejectModal = () => {
        setRejectVisible(false);
        setSelectedScheduleId(null);
        setRejectNotes('');
    };

    const submitReject = async () => {
        if (!selectedScheduleId || !rejectNotes.trim()) return;
        setSubmittingReject(true);
        try {
            const res = await rejectSession(Number(selectedScheduleId), rejectNotes.trim());
            if (res.status !== 'success') {
                notify('Error', 'Failed to reject attendance.');
                return;
            }
            await fetchDetail(); 
            closeRejectModal();
        } catch (err) {
            console.error(err);
            notify('Error', 'Something went wrong.');
        }
        setSubmittingReject(false);
    };

    if (!booking) {
        return (
            <View style={{ padding: 20 }}>
                <Text>Loading...</Text>
            </View>
        );
    }

    const bookingStatus = getStatusVisual(booking.booking_status);

    return (
        <View style={[styles.container, { paddingTop: topPad }]}>
            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    {
                        paddingHorizontal: spacing.horizontal,
                        paddingBottom: spacing.bottomPadding,
                    },
                ]}
            >
                <View style={[styles.topRow, { marginBottom: spacing.sectionGap }]}>
                    <AppIconButton
                        icon="arrow-back"
                        onPress={() => router.replace('/session-confirmations')}
                        size={spacing.iconGlyphSize}
                        containerSize={spacing.iconButtonSize}
                    />
                </View>

                <AppPageHeader
                    title="Session Confirmation"
                    subtitle={`${user?.name || 'School'} - ${booking.subject_name || '-'}`}
                />

                <View style={styles.bookingCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardSubject}>
                            {booking.subject_name || '-'}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: bookingStatus.backgroundColor }]}>
                            <Text style={[styles.statusBadgeText, { color: bookingStatus.color }]}>
                                {bookingStatus.label}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.cardMeta}>Teacher: {booking.teacher_name || '-'}</Text>
                    <Text style={styles.cardMeta}>School: {booking.school_name || '-'}</Text>
                </View>

                <View style={styles.scheduleSection}>
                    <AppSectionHeader title="Session Detail" />
                    {schedules.length === 0 ? (
                        <AppEmptyState title="No schedules found" icon={'filter'} subtitle={''} />
                    ) : (
                        schedules.map((schedule) => (
                            <ScheduleCard
                                key={String(schedule.id)}
                                schedule={schedule}
                                onConfirm={handleConfirmAttendance}
                                onReject={openRejectModal}
                            />
                        ))
                    )}
                </View>
            </ScrollView>

            <Modal visible={rejectVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Reject Attendance</Text>
                        <Text style={styles.modalSubtitle}>Please provide notes for rejection</Text>
                        <TextInput
                            style={styles.notesInput}
                            value={rejectNotes}
                            onChangeText={setRejectNotes}
                            placeholder="Write notes..."
                            placeholderTextColor={Colors.textSecondary}
                            multiline
                            numberOfLines={4}
                        />
                        <View style={styles.modalActionRow}>
                            <AppButton title="Cancel" onPress={closeRejectModal} style={styles.modalBtn} />
                            <AppButton
                                title="Submit"
                                onPress={submitReject}
                                loading={submittingReject}
                                style={[styles.modalBtn, styles.rejectSubmitBtn]}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { paddingBottom: 88 },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bookingCard: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 14,
        padding: 16,
        marginBottom: 18,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
    },
    cardSubject: {
        fontSize: 17,
        fontWeight: '700' as const,
        color: Colors.text,
        flex: 1,
    },
    statusBadge: {
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '600' as const,
    },
    cardMeta: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 5,
    },
    scheduleSection: {
        marginBottom: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    modalCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 20,
        gap: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700' as const,
        color: Colors.text,
        marginBottom: 6,
    },
    modalSubtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 12,
    },
    notesInput: {
        height: 110,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: Colors.text,
        backgroundColor: Colors.background,
        marginBottom: 14,
    },
    modalActionRow: {
        flexDirection: 'row',
        gap: 10,
    },
    modalBtn: {
        flex: 1,
    },
    rejectSubmitBtn: {
        backgroundColor: Colors.error,
    },
});