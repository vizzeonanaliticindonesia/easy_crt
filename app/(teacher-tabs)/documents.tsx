import React, { useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { confirmDialog, notify } from '@/lib/dialogs';
import { teacherDocumentsRepository } from '@/lib/repositories/teacherDocumentsRepository';
import {
    AppButton,
    AppEmptyState,
    AppIconButton,
    AppPageHeader,
    AppSectionHeader,
    useResponsiveSpacing,
} from '@/components/ui/AppPrimitives';
import { getTeacherDocuments, deleteTeacherDocument } from '@/lib/services/teacher';
import { useIsFocused } from '@react-navigation/native';

export default function TeacherDocumentsScreen() {
    const router = useRouter();
    const { refresh } = useLocalSearchParams<{ refresh?: string }>();
    const insets = useSafeAreaInsets();
    const isFocused = useIsFocused();
    const spacing = useResponsiveSpacing();
    const topPad = Platform.OS === 'web' ? 67 : insets.top;
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const goBack = () => {
        router.replace('/profile');
    };

    const loadDocuments = React.useCallback(async () => {
        setLoading(true);
        try {
            const raw = await getTeacherDocuments();
            console.log('getTeacherDocuments raw:', raw);
            const res = typeof raw === 'string' ? JSON.parse(raw) : raw;

            let list: any[] = [];
            if (Array.isArray(res)) {
                list = res;
            } else if (res?.data) {
                list = res.data;
            } else if (res?.documents) {
                list = res.documents;
            } else if (res?.items) {
                list = res.items;
            } else {
                list = res ? [res] : [];
            }

            console.log('Parsed documents list length:', list.length);
            setDocuments(list);
        } catch (err) {
            console.error('Load documents error:', err);
            notify('Error', 'Failed to load documents');
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        if (isFocused) {
            loadDocuments();
        }
    }, [loadDocuments, refresh, isFocused]);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await loadDocuments();
        } finally {
            setRefreshing(false);
        }
    };

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
            const res = await deleteTeacherDocument(documentId);
            console.log('deleteTeacherDocument response:', res);
            // refresh list after successful delete
            await loadDocuments();
            notify('Success', 'Document deleted successfully');
        } catch (err) {
            console.error('Delete document error:', err);
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
                    style={{ marginBottom: 12 }}
                />
            </View>
            <View style={{ paddingHorizontal: spacing.horizontal }}>
                <AppPageHeader title="Teacher Documents" subtitle="Manage your uploaded teacher files" style={styles.title} />
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
                                <View style={styles.fileRow}>
                                    <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
                                    <Text style={styles.fileName}>{item.document_name}</Text>
                                </View>
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
                    refreshing={refreshing}
                    onRefresh={onRefresh}
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
