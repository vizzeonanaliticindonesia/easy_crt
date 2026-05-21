import React, { useState } from 'react';
import { FlatList, Linking, Platform, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useIsFocused } from '@react-navigation/native';
import { confirmDialog, notify } from '@/lib/dialogs';
// import { SchoolDocument } from '@/types';
import { documentsRepository } from '@/lib/repositories/documentsRepository';
import {
    AppButton,
    AppEmptyState,
    AppIconButton,
    AppPageHeader,
    AppSectionHeader,
    useResponsiveSpacing,
} from '@/components/ui/AppPrimitives';
import { getSchoolDocuments, deleteSchoolDocument } from '@/lib/services/school';

export default function SchoolDocumentsScreen() {
    const router = useRouter();
    const { refresh } = useLocalSearchParams<{ refresh?: string }>();
    const insets = useSafeAreaInsets();
    const spacing = useResponsiveSpacing();
    const topPad = Platform.OS === 'web' ? 67 : insets.top;
    const isFocused = useIsFocused();
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [refreshing, setRefreshing] = React.useState(false);
    const goBack = () => {
    router.replace('/profile');
    };

    const loadDocuments = React.useCallback(async () => {
        setLoading(true);
        try {
            const saved = await getSchoolDocuments();
            setDocuments(saved.documents);
            console.log('Fetched documents:', documents);
        } catch {
            notify('Error', 'Failed to load documents');
        } finally {
            setLoading(false);
        }
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await loadDocuments();
        } finally {
            setRefreshing(false);
        }
    };

    React.useEffect(() => {
        if (isFocused) {
            loadDocuments();
        }
    }, [loadDocuments, refresh, isFocused]);

    async function handleDelete(documentId: string) {
        const shouldDelete = await confirmDialog({
            title: 'Delete Document',
            message: 'Are you sure you want to delete this document?',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            destructive: true,
        });
        if (!shouldDelete) return;

        try {
            const updated = await deleteSchoolDocument(documentId);
            await loadDocuments();
            notify('Success', 'Document deleted successfully');
        } catch {
            notify('Error', 'Failed to delete document');
        }
    }

    return (
        <View style={[styles.container, { paddingTop: topPad + spacing.topOffset }]}>
            <View style={{ paddingHorizontal: spacing.horizontal }}>
                                    <AppIconButton
                                        icon="arrow-back"
                                        onPress={goBack}
                                        size={spacing.iconGlyphSize}
                                        containerSize={spacing.iconButtonSize}
                                        style={{ marginBottom:12 }}
                                    />
            </View>
            <View style={{ paddingHorizontal: spacing.horizontal }}>
                <AppPageHeader title="School Documents" subtitle="Manage your uploaded school files" style={styles.title} />
                <AppButton
                    title="Upload Document"
                    onPress={() => router.push('/create-document')}
                    icon="cloud-upload-outline"
                    size="md"
                    style={styles.uploadBtn}
                />
                <AppSectionHeader title="Document List" style={styles.sectionTitle} />
            </View>

            <FlatList
                data={documents}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                    styles.list,
                    {
                        paddingHorizontal: spacing.horizontal,
                        paddingBottom: spacing.bottomPadding,
                    },
                ]}
                renderItem={({ item }) => (
                    <View style={[styles.card, { padding: spacing.cardPadding - 4 }]}>
                        <View style={styles.cardTopRow}>
                            <View style={styles.fileInfoWrap}>
                                <TouchableOpacity onPress={() => Linking.openURL(item.file_url)}>
                                    <View style={styles.fileRow}>
                                        <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
                                        <Text style={styles.fileName}>
                                        {/* {item.document_name.split('/').pop()} */}
                                        {item.document_name}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                <Text style={styles.metaText}>Name: {item.document_name}</Text>
                                <Text style={styles.metaText}>No: {item.document_number || '-'}</Text>
                                <Text style={styles.metaText}>Issued by: {item.issued_by || '-'}</Text>
                                <Text style={styles.metaText}>Issue: {item.issue_date || '-'} | Expiry: {item.expiry_date || '-'}</Text>
                            </View>
                        </View>

                        <View style={styles.actionRow}>
                            <TouchableOpacity activeOpacity={0.8} style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                                <Ionicons name="trash-outline" size={16} color={Colors.error} />
                                <Text style={styles.deleteText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
                ListEmptyComponent={
                    <AppEmptyState
                        icon="folder-open-outline"
                        title="No documents yet"
                        subtitle="Tap Upload Document to add your first file"
                        padding={spacing.cardPadding}
                    />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    title: {
        marginBottom: 8,
    },
    uploadBtn: {
        marginBottom: 10,
    },
    sectionTitle: {
        marginBottom: 8,
    },
    list: {
        paddingBottom: 100,
        gap: 12,
    },
    card: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 14,
        marginBottom: 12,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
    },
    fileInfoWrap: {
        flex: 1,
    },
    fileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    fileName: {
        fontSize: 15,
        fontWeight: '700' as const,
        color: Colors.text,
        flex: 1,
    },
    metaText: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
    },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: Colors.error + '40',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: Colors.errorBg,
    },
    deleteText: {
        fontSize: 12,
        fontWeight: '700' as const,
        color: Colors.error,
    },
});
