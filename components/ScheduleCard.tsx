import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { AppButton, useResponsiveSpacing } from '@/components/ui/AppPrimitives';

export interface SessionSchedule {
    id: string | number;
    schedule_date: string;
    start_time: string;
    end_time: string;
    attendance_status?: string | number;
    attendance_notes?: string;
    attendance_check_in?: string;
    attendance_check_out?: string;
}

type StatusKey = 'confirmed' | 'rejected' | 'completed' | 'on session' | 'awaiting';

type StatusVisual = {
    key: StatusKey;
    label: string;
    color: string;
    backgroundColor: string;
};

const normalizeStatus = (raw: string | number | undefined): StatusKey => {
    const value = String(raw ?? '').trim().toLowerCase();

    if (value === '1' || value === 'completed') return 'completed';
    if (value === '2' || value === 'confirmed') return 'confirmed';
    if (value === '3' || value === 'rejected')  return 'rejected';
    if (value === 'on session')                 return 'on session';
    return 'awaiting';
};

export const getStatusVisual = (raw: string | number | undefined): StatusVisual => {
    const key = normalizeStatus(raw);

    if (key === 'confirmed') {
        return {
            key,
            label: 'Completed',
            color: Colors.statusComplete,
            backgroundColor: Colors.secondary + '1F',
        };
    }
    if (key === 'rejected') {
        return {
            key,
            label: 'Rejected',
            color: Colors.error,
            backgroundColor: Colors.error + '16',
        };
    }
    if (key === 'completed') {
        return {
            key,
            label: 'Completed',
            color: Colors.statusComplete,
            backgroundColor: Colors.statusComplete + '1A',
        };
    }
    if (key === 'on session') {
        return {
            key,
            label: 'On Session',
            color: Colors.primary,
            backgroundColor: Colors.primary + '1A',
        };
    }
    return {
        key,
        label: 'Awaiting',
        color: Colors.warning,
        backgroundColor: Colors.warningBg,
    };
};

const formatReadableDate = (dateString: string) => {
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return dateString;

    return parsed.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: '2-digit',
    });
};

interface ScheduleCardProps {
    schedule: SessionSchedule;
    onConfirm: (scheduleId: string | number) => void;
    onReject: (scheduleId: string | number) => void;
}

const ScheduleCard = ({ schedule, onConfirm, onReject }: ScheduleCardProps) => {
    const spacing = useResponsiveSpacing();
    const [expanded, setExpanded] = useState(false);
    const statusVisual = useMemo(() => getStatusVisual(schedule.attendance_status), [schedule.attendance_status]);
    const canManageAttendance =
        statusVisual.key === 'completed' ||
        statusVisual.key === 'on session' ||
        statusVisual.key === 'awaiting';

    return (
        <Pressable
            onPress={() => setExpanded((prev) => !prev)}
            style={({ pressed }) => [
                styles.card,
                { padding: Math.max(14, spacing.cardPadding - 6), opacity: pressed ? 0.9 : 1 },
            ]}
        >
            <View style={styles.headerRow}>
                <View style={styles.dateWrap}>
                    <Text style={styles.dateText}>{formatReadableDate(schedule.schedule_date)}</Text>
                    <Text style={styles.timeText}>{schedule.start_time} - {schedule.end_time}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: statusVisual.backgroundColor }]}>
                    <Text style={[styles.badgeText, { color: statusVisual.color }]}>{statusVisual.label}</Text>
                </View>
            </View>

            {expanded && (
                <View style={styles.expandedSection}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Check-in</Text>
                        <Text style={styles.detailValue}>{schedule.attendance_check_in || '-'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Check-out</Text>
                        <Text style={styles.detailValue}>{schedule.attendance_check_out || '-'}</Text>
                    </View>
                    <View style={styles.detailColumn}>
                        <Text style={styles.detailLabel}>Notes</Text>
                        <Text style={styles.detailValue}>{schedule.attendance_notes || 'No notes yet.'}</Text>
                    </View>

                    {canManageAttendance && (
                        <View style={[styles.actionRow, { marginTop: Math.max(10, spacing.sectionGap - 2) }]}>
                            <AppButton
                                title="Confirm Attendance"
                                onPress={() => onConfirm(schedule.id)}
                                variant="secondary"
                                icon="checkmark-circle"
                                style={styles.actionBtn}
                            />
                            <AppButton
                                title="Reject Attendance"
                                onPress={() => onReject(schedule.id)}
                                icon="close-circle"
                                style={[styles.actionBtn, styles.rejectBtn]}
                            />
                        </View>
                    )}
                </View>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 14,
        marginBottom: 12,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
    },
    dateWrap: {
        flex: 1,
        gap: 4,
    },
    dateText: {
        fontSize: 15,
        fontWeight: '700' as const,
        color: Colors.text,
    },
    timeText: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    badge: {
        borderRadius: 12,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600' as const,
    },
    expandedSection: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    detailColumn: {
        gap: 4,
    },
    detailLabel: {
        fontSize: 13,
        fontWeight: '600' as const,
        color: Colors.textSecondary,
    },
    detailValue: {
        fontSize: 13,
        color: Colors.text,
    },
    actionRow: {
        flexDirection: 'column',
        gap: 10,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 14,
    },
    rejectBtn: {
        backgroundColor: Colors.error,
    },
});

export default ScheduleCard;