import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TeachingSession, SessionStatus } from '@/types';
import { Colors } from '@/constants/Colors';
import { AppCard, AppStatusBadge, useResponsiveSpacing, resolveSessionStatus } from '@/components/ui/AppPrimitives';

interface SessionCardProps {
    session: TeachingSession;
    onPress?: () => void;
    userRole: 'teacher' | 'school';
}

// ── HELPER: format tanggal ────────────────────────────────
function formatScheduleDate(dateStr: string): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; // fallback ke raw string
    return date.toLocaleDateString('en-AU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

// ── HELPER: format elapsed time ───────────────────────────
function formatElapsed(createdAt: string): string {
    if (!createdAt) return '';
    const created = new Date(createdAt).getTime();
    if (isNaN(created)) return '';

    const diffMs = Date.now() - created;
    if (diffMs < 0) return 'Just now';

    const totalSeconds = Math.floor(diffMs / 1000);
    const days    = Math.floor(totalSeconds / 86400);
    const hours   = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0)    return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0)   return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

// ── HOOK: realtime elapsed ────────────────────────────────
function useElapsedTime(createdAt: string, active: boolean): string {
    const [elapsed, setElapsed] = useState(() => formatElapsed(createdAt));

    useEffect(() => {
        if (!createdAt || !active) return;
        const interval = setInterval(() => {
            setElapsed(formatElapsed(createdAt));
        }, 1000);
        return () => clearInterval(interval);
    }, [createdAt, active]);

    return elapsed;
}

export default function SessionCard({ session, onPress, userRole }: SessionCardProps) {
    const spacing = useResponsiveSpacing();

    // Ambil schedule_date dari schedules[0], fallback '—' kalau kosong
    const firstScheduleDate = session.schedules?.[0]?.schedule_date ?? '';
    const displayDate = firstScheduleDate
        ? formatScheduleDate(firstScheduleDate)
        : '—';

    const currentStatus: SessionStatus = resolveSessionStatus(session.status);

    const isOpen = currentStatus === 'open';

    // Realtime waiting time dari createdAt — only ticks while the card is actually showing it
    const elapsed = useElapsedTime(session.createdAt, isOpen);

    return (
        <TouchableOpacity
            style={[styles.touchable, { marginBottom: Math.max(10, spacing.sectionGap - 2) }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <AppCard padding={Math.max(14, spacing.cardPadding - 6)} style={styles.card}>

                {/* ── HEADER ── */}
                <View style={styles.header}>
                    <View style={styles.subjectRow}>
                        <Ionicons name="book-outline" size={18} color={Colors.primary} />
                        <Text style={styles.subject}>{session.subject_name}</Text>
                    </View>
                    <AppStatusBadge status={currentStatus} size="sm" />
                </View>

                {/* ── DETAILS ── */}
                <View style={styles.details}>

                    {/* Schedule date dari schedules[0] */}
                    <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
                        <Text style={styles.detailText}>{displayDate}</Text>
                    </View>

                    {/* Lokasi */}
                    <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
                        <Text style={styles.detailText} numberOfLines={1}>
                            {[session.state, session.locality, session.pcode].filter(Boolean).join(', ') || '—'}
                        </Text>
                    </View>

                    {/* School (untuk teacher) */}
                    {userRole === 'teacher' && (
                        <View style={styles.detailRow}>
                            <Ionicons name="business-outline" size={16} color={Colors.textSecondary} />
                            <Text style={styles.detailText}>{session.school_name || '—'}</Text>
                        </View>
                    )}

                    {/* Teacher (untuk school, kalau sudah ada teacher) */}
                    {userRole === 'school' && session.teacher_id && (
                        <View style={styles.detailRow}>
                            <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
                            <Text style={styles.detailText}>
                                {[session.teacher_first_name, session.teacher_last_name].filter(Boolean).join(' ') || '—'}
                            </Text>
                        </View>
                    )}

                    {/* ── WAITING TIME — hanya kalau status open ── */}
                    {isOpen && !!elapsed && (
                        <View style={styles.waitingRow}>
                            <Ionicons name="time-outline" size={14} color='#F59E0B' />
                            <Text style={styles.waitingLabel}>Waiting: </Text>
                            <Text style={styles.waitingValue}>{elapsed}</Text>
                        </View>
                    )} 

                </View>
            </AppCard>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    touchable: {
        marginBottom: 12,
    },
    card: {
        borderRadius: 14,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    subjectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    subject: {
        fontSize: 17,
        fontWeight: '600' as const,
        color: Colors.text,
    },
    details: {
        gap: 6,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 13,
        color: Colors.textSecondary,
        flex: 1,
    },
    waitingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
    },
    waitingLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    waitingValue: {
        fontSize: 12,
        fontWeight: '600' as const,
        color: '#F59E0B',
    },
});