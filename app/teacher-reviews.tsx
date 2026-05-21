import React from 'react';
import { FlatList, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { AppCard, AppEmptyState, AppIconButton, AppPageHeader, useResponsiveSpacing } from '@/components/ui/AppPrimitives';
import { getTeacherProfile, getTeacherReviews } from '@/lib/services/teacher';

type ReviewItem = {
    id: string;
    schoolName: string;
    reviewText: string;
    rating: number;
    createdAt: string;
};

function formatShortDate(value: string) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

function normalizeReviews(payload: any): ReviewItem[] {
    const rawReviews =
        payload?.recent_reviews ??
        payload?.reviews ??
        payload?.data?.recent_reviews ??
        payload?.data?.reviews ??
        [];

    if (!Array.isArray(rawReviews)) return [];

    return rawReviews.map((item: any, index: number) => ({
        id: String(item?.id ?? item?.review_id ?? index),
        schoolName: item?.school_name ?? item?.schoolName ?? item?.school ?? 'School',
        reviewText: item?.review_text ?? item?.review ?? item?.comment ?? '',
        rating: Number(item?.rating ?? 0),
        createdAt: item?.created_at ?? item?.createdAt ?? '',
    }));
}

function renderStars(rating: number) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5 ? 1 : 0;
    const empty = Math.max(0, 5 - full - half);

    return (
        <View style={styles.starsRow}>
            {Array.from({ length: full }).map((_, index) => (
                <Ionicons key={`full-${index}`} name="star" size={14} color={Colors.warning} />
            ))}
            {half ? <Ionicons name="star-half" size={14} color={Colors.warning} /> : null}
            {Array.from({ length: empty }).map((_, index) => (
                <Ionicons key={`empty-${index}`} name="star-outline" size={14} color={Colors.warning} />
            ))}
        </View>
    );
}

export default function TeacherReviewsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const isFocused = useIsFocused();
    const spacing = useResponsiveSpacing();
    const topPad = Platform.OS === 'web' ? 67 : insets.top;
    const [loading, setLoading] = React.useState(true);
    const [reviews, setReviews] = React.useState<ReviewItem[]>([]);

    const loadReviews = React.useCallback(async () => {
        setLoading(true);
        try {
            const raw = await getTeacherReviews();
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            setReviews(normalizeReviews(parsed));
        } catch (error) {
            console.error('Failed to load reviews:', error);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        if (isFocused && user?.role === 9) {
            loadReviews();
        }
    }, [isFocused, loadReviews, user?.role]);

    return (
        <View style={[styles.container, { paddingTop: topPad + spacing.topOffset }]}>
            <View style={{ paddingHorizontal: spacing.horizontal }}>
                <AppIconButton
                    icon="arrow-back"
                    onPress={() => router.replace('/profile')}
                    size={spacing.iconGlyphSize}
                    containerSize={spacing.iconButtonSize}
                    style={{ marginBottom: 12 }}
                />
                <AppPageHeader
                    title="Recent Reviews"
                    subtitle="What schools have said about your sessions"
                    style={styles.header}
                />
            </View>

            <FlatList
                data={reviews}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{
                    paddingHorizontal: spacing.horizontal,
                    paddingBottom: spacing.bottomPadding,
                    gap: 12,
                }}
                refreshing={loading}
                onRefresh={loadReviews}
                ListEmptyComponent={
                    <AppEmptyState
                        icon="chatbubble-ellipses-outline"
                        title="No recent reviews"
                        subtitle="Recent school feedback will appear here once available"
                        padding={spacing.cardPadding}
                    />
                }
                renderItem={({ item }) => (
                    <AppCard variant="surface" padding={spacing.cardPadding} style={styles.reviewCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.schoolName}>{item.schoolName}</Text>
                            <Text style={styles.reviewDate}>{formatShortDate(item.createdAt)}</Text>
                        </View>

                        <View style={styles.cardBody}>
                            <Text style={styles.reviewText}>{item.reviewText || 'No review text provided.'}</Text>
                            <View style={styles.ratingRow}>
                                <Text style={styles.ratingLabel}>Rating:</Text>
                                {renderStars(item.rating)}
                                <Text style={styles.ratingValue}>({item.rating.toFixed(1)})</Text>
                            </View>
                        </View>
                    </AppCard>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        marginBottom: 8,
    },
    reviewCard: {
        borderRadius: 14,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 10,
    },
    schoolName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700' as const,
        color: Colors.text,
    },
    reviewDate: {
        fontSize: 12,
        color: Colors.textSecondary,
        flexShrink: 0,
    },
    cardBody: {
        gap: 10,
    },
    reviewText: {
        fontSize: 14,
        lineHeight: 20,
        color: Colors.text,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
    },
    ratingLabel: {
        fontSize: 12,
        fontWeight: '600' as const,
        color: Colors.textSecondary,
    },
    ratingValue: {
        fontSize: 12,
        fontWeight: '600' as const,
        color: Colors.textSecondary,
    },
    starsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
});