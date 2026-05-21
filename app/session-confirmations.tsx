import React, { useMemo, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { useFocusEffect } from 'expo-router';
import {
    AppEmptyState,
    AppIconButton,
    AppPageHeader,
    AppSectionHeader,
    AppStatCard,
    useResponsiveSpacing,
} from '@/components/ui/AppPrimitives';
import { getStatusVisual } from '@/components/ScheduleCard';
import { getSessionConfirmation } from '@/lib/services/school';

export default function SessionConfirmationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const spacing = useResponsiveSpacing();
    const topPad = Platform.OS === 'web' ? 67 : insets.top;
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const goBack = () => router.replace('/(school-tabs)');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getSessionConfirmation();
            setItems(res.data?.data || res.data || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const stats = useMemo(() => {
        let confirmed = 0;
        let completed = 0;
        let awaiting = 0;

        items.forEach((booking) => {
            const status = getStatusVisual(booking.booking_status).key;
            if (status === 'confirmed') confirmed += 1;
            if (status === 'completed') completed += 1;
            if (status === 'awaiting' || status === 'on session') awaiting += 1;
        });

        return {
            total: items.length,
            confirmed,
            completed,
            awaiting,
        };
    }, [items]);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[
                styles.content,
                {
                    paddingTop: topPad + spacing.topOffset,
                    paddingHorizontal: spacing.horizontal,
                },
            ]}
        >
            <View style={[styles.topRow, { marginBottom: spacing.sectionGap }]}>
                <AppIconButton
                    icon="arrow-back"
                    onPress={goBack}
                    size={spacing.iconGlyphSize}
                    containerSize={spacing.iconButtonSize}
                />
            </View>

            <View style={styles.headerRow}>
                <AppPageHeader
                    title="Hello,"
                    subtitle={user?.name || 'School User'}
                    titleStyle={styles.helloText}
                    subtitleStyle={styles.nameText}
                    style={styles.headerTextBlock}
                />
                <AppIconButton
                    icon="refresh"
                    onPress={fetchData}
                    size={spacing.iconGlyphSize}
                    containerSize={spacing.iconButtonSize}
                />
            </View>

            <View style={[styles.statsRow, { gap: spacing.sectionGap - 4 }]}>
                <AppStatCard icon="albums" label="Total" value={stats.total} color={Colors.primary} style={styles.statCard} />
                <AppStatCard icon="checkmark-circle" label="Confirmed" value={stats.confirmed} color={Colors.secondary} style={styles.statCard} />
                <AppStatCard icon="hourglass" label="Need Review" value={stats.completed + stats.awaiting} color={Colors.statusPending} style={styles.statCard} />
            </View>

            <View style={styles.sectionWrap}>
                <AppSectionHeader title="Session Confirmations" />
                {items.length === 0 ? (
                    <AppEmptyState
                        icon="calendar-outline"
                        title="No session confirmations"
                        subtitle="Bookings that need attendance confirmation will appear here"
                        padding={spacing.cardPadding}
                    />
                ) : (
                    items.map((booking) => {
                        const statusVisual = getStatusVisual(booking.booking_status);
                        return (
                            <TouchableOpacity
                                key={String(booking.id)}
                                onPress={() =>
                                    router.push({
                                        pathname: '/session-confirmation-detail',
                                        params: { id: String(booking.id) },
                                    })
                                }
                                activeOpacity={0.78}
                                style={styles.bookingCard}
                            >
                                <View style={styles.cardHead}>
                                    <View style={styles.subjectRow}>
                                        <Ionicons name="book-outline" size={18} color={Colors.primary} />
                                        <Text style={styles.subjectText}>{booking.subject_name || '-'}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: statusVisual.backgroundColor }]}>
                                        <Text style={[styles.statusText, { color: statusVisual.color }]}>
                                            {statusVisual.label}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.metaRow}>
                                    <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
                                    <Text style={styles.metaText}>{booking.teacher_name || '-'}</Text>
                                </View>
                                <View style={styles.metaRow}>
                                    <Ionicons name="business-outline" size={16} color={Colors.textSecondary} />
                                    <Text style={styles.metaText}>{booking.school_name || '-'}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { paddingBottom: 96 },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTextBlock: { marginBottom: 0 },
    helloText: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: Colors.textSecondary,
    },
    nameText: {
        fontSize: 28,
        fontWeight: '800' as const,
        color: Colors.text,
    },
    statsRow: {
        flexDirection: 'row',
        marginBottom: 22,
    },
    statCard: {
        flex: 1,
        borderRadius: 14,
    },
    sectionWrap: {
        marginBottom: 20,
    },
    bookingCard: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
    },
    cardHead: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        gap: 10,
    },
    subjectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    subjectText: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: Colors.text,
        flex: 1,
    },
    statusBadge: {
        borderRadius: 12,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600' as const,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    metaText: {
        fontSize: 13,
        color: Colors.textSecondary,
        flex: 1,
    },
});