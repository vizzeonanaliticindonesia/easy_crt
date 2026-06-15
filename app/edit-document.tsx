import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import * as Linking from 'expo-linking';
import { Colors } from '@/constants/Colors';
import { notify } from '@/lib/dialogs';
import {
    AppButton,
    AppCard,
    AppDateField,
    AppField,
    AppPageHeader,
    AppSectionTitle,
    AppTopBar,
    AppUploadArea,
    useResponsiveSpacing,
} from '@/components/ui/AppPrimitives';
import { editSchoolDocument, getSchoolDocuments } from '@/lib/services/school';
import { getTeacherDocuments } from '@/lib/services/teacher';
import { useAuth } from '@/contexts/AuthContext';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

type SelectedFile = {
    name: string;
    uri: string;
    mimeType: string;
    size: number;
};

function hasAllowedExtension(fileName: string): boolean {
    const lower = fileName.toLowerCase();
    return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export default function EditDocumentScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const documentId = String(params.id || '');
    const insets = useSafeAreaInsets();
    const spacing = useResponsiveSpacing();
    const topPad = Platform.OS === 'web' ? 67 : insets.top;

    const [documentName, setDocumentName] = React.useState('');
    const [documentNumber, setDocumentNumber] = React.useState('');
    const [issuedBy, setIssuedBy] = React.useState('');
    const [issueDate, setIssueDate] = React.useState('');
    const [expiryDate, setExpiryDate] = React.useState('');
    const [selectedFile, setSelectedFile] = React.useState<SelectedFile | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [loadingDetail, setLoadingDetail] = React.useState(false);
    const [previewVisible, setPreviewVisible] = React.useState(false);


    const { user } = useAuth();

    React.useEffect(() => {
        async function loadDetail() {
            try {
                setLoadingDetail(true);

                const res =
                    user?.role == 10
                        ? await getSchoolDocuments()
                        : await getTeacherDocuments();

                const documents =
                    user?.role == 10
                        ? res?.documents || res?.data?.documents || []
                        : res?.data || [];

                const data = documents.find((item: any) => String(item.id) === String(documentId));

                if (!data) {
                    notify('Error', 'Document not found.');
                    return;
                }

                setDocumentName(data.document_name || '');
                setDocumentNumber(data.document_number || '');
                setIssuedBy(data.issued_by || '');
                setIssueDate(data.issue_date || '');
                setExpiryDate(data.expiry_date || '');

                if (data.file_url || data.file_path) {
                    const fileUrl = data.file_url ? data.file_url : `https://teacher-relief.kreatifa.com/${data.file_path}`;
                    const fileName = fileUrl.split('/').pop() || 'document';
                    const ext = fileName.split('.').pop()?.toLowerCase();
                    const mimeType = ext === 'pdf' ? 'application/pdf'
                        : ext === 'png' ? 'image/png'
                        : (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg'
                        : 'application/pdf';

                    setSelectedFile({
                        name: fileName,
                        uri: fileUrl,
                        mimeType, // ✅ deteksi dari ekstensi
                        size: 0,
                    });
                }
            } catch {
                notify('Error', 'Failed to load document detail.');
            } finally {
                setLoadingDetail(false);
            }
        }

        if (documentId) {
            loadDetail();
        }
    }, [documentId, user?.role]);

    async function pickFile() {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets?.[0]) {
                return;
            }

            const asset = result.assets[0];
            const mimeType = asset.mimeType || '';
            const fileSize = asset.size || 0;
            const validMime = ALLOWED_MIME_TYPES.includes(mimeType);
            const validExtension = hasAllowedExtension(asset.name || '');

            if (!validMime && !validExtension) {
                notify('Error', 'Only PDF, JPG, and PNG files are allowed.');
                return;
            }

            if (fileSize > MAX_FILE_SIZE_BYTES) {
                notify('Error', 'File size must be 2MB or less.');
                return;
            }

            setSelectedFile({
                name: asset.name,
                uri: asset.uri,
                mimeType: mimeType || 'application/octet-stream',
                size: fileSize,
            });
        } catch {
            notify('Error', 'Failed to pick file. Please try again.');
        }
    }

    async function handleSubmit() {
        if (!documentName.trim()) {
            notify('Error', 'Document Name is required.');
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();

            formData.append('document_name', documentName.trim());
            formData.append('document_number', documentNumber.trim());
            formData.append('issued_by', issuedBy.trim());
            formData.append('issue_date', issueDate);
            formData.append('expiry_date', expiryDate);

            if (selectedFile && !selectedFile.uri.includes('/uploads')) {
                if (Platform.OS === 'web') {
                    const resBlob = await fetch(selectedFile.uri);
                    const blob = await resBlob.blob();
                    formData.append('file_upload', blob, selectedFile.name);
                } else {
                    formData.append(
                        'file_upload',
                        {
                            uri: selectedFile.uri,
                            name: selectedFile.name,
                            type: selectedFile.mimeType,
                        } as any
                    );
                }
            }

            await editSchoolDocument(documentId, formData);

            notify('Success', 'Document updated successfully.', () => {
                if (user?.role == 10) {
                    router.replace({
                        pathname: '/(school-tabs)/documents' as any,
                        params: { refresh: Date.now().toString() },
                    });
                } else {
                    router.replace({
                        pathname: '/(teacher-tabs)/documents',
                        params: { refresh: Date.now().toString() },
                    });
                }
            });
        } catch {
            notify('Error', 'Failed to update document. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    if (loadingDetail) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: topPad }]}>
            <AppTopBar
                title="Edit Document"
                onBack={() =>
                router.replace(
                    user?.role == 10
                        ? '/(school-tabs)/documents'
                        : '/(teacher-tabs)/documents' as any
                )   
}
                horizontalPadding={spacing.horizontal}
                verticalPadding={spacing.topBarVertical}
                iconButtonSize={spacing.iconButtonSize}
                iconSize={spacing.iconGlyphSize}
            />

            <ScrollView
                style={styles.flex}
                contentContainerStyle={{
                    paddingHorizontal: spacing.horizontal,
                    paddingBottom: spacing.bottomPadding + 24,
                }}
                keyboardShouldPersistTaps="handled"
            >
                <AppPageHeader
                    title="Edit Document"
                    subtitle="Update document details and attach a PDF/JPG/PNG file"
                    style={{ marginBottom: spacing.sectionGap }}
                />

                <AppCard padding={spacing.cardPadding} style={styles.formCard}>
                    <AppSectionTitle title="Document Details" size="lg" />

                    <AppField
                        label="Document Name *"
                        value={documentName}
                        onChangeText={setDocumentName}
                        placeholder="e.g. School License"
                        icon="document-text-outline"
                    />

                    <AppField
                        label="Document Number"
                        value={documentNumber}
                        onChangeText={setDocumentNumber}
                        placeholder="e.g. LIC-2026-001"
                        icon="pricetag-outline"
                    />

                    <AppField
                        label="Issued By"
                        value={issuedBy}
                        onChangeText={setIssuedBy}
                        placeholder="e.g. Education Authority"
                        icon="business-outline"
                    />

                    <AppDateField
                        label="Issue Date"
                        value={issueDate}
                        onChange={setIssueDate}
                        placeholder="Select issue date"
                    />

                    <AppDateField
                        label="Expiry Date"
                        value={expiryDate}
                        onChange={setExpiryDate}
                        placeholder="Select expiry date"
                    />

                    <View style={styles.uploadBlock}>
                        <Text style={styles.label}>Upload File</Text>

                        <AppUploadArea
                            label="Choose PDF/JPG/PNG"
                            description="Maximum file size: 2MB"
                            onPress={pickFile}
                            tone="secondary"
                            disabled={loading}
                        />

                        {selectedFile ? (
                            <TouchableOpacity
                                style={styles.filePreview}
                                activeOpacity={0.8}
                                onPress={() => setPreviewVisible(true)} // ✅
                            >
                                <Text style={styles.fileName}>{selectedFile.name}</Text>
                                {selectedFile.size > 0 && (
                                    <Text style={styles.fileMeta}>{(selectedFile.size / 1024).toFixed(1)} KB</Text>
                                )}
                            </TouchableOpacity>
                        ) : null}

                        <Modal
                            visible={previewVisible}
                            animationType="slide"
                            onRequestClose={() => setPreviewVisible(false)}
                        >
                            <View style={{ flex: 1, backgroundColor: Colors.background }}>
                                {/* Header */}
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 16,
                                    paddingTop: topPad,
                                    borderBottomWidth: 1,
                                    borderBottomColor: Colors.border,
                                }}>
                                    <TouchableOpacity onPress={() => setPreviewVisible(false)}>
                                        <Ionicons name="close" size={24} color={Colors.text} />
                                    </TouchableOpacity>
                                    <Text style={{
                                        fontSize: 15,
                                        fontWeight: '700',
                                        color: Colors.text,
                                        marginLeft: 12,
                                        flex: 1,
                                    }} numberOfLines={1}>
                                        {selectedFile?.name}
                                    </Text>
                                </View>

                                {/* Content */}
                                {selectedFile?.mimeType?.startsWith('image/') ? (
                                    <Image
                                        source={{ uri: selectedFile.uri }}
                                        style={{ flex: 1 }}
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <WebView
                                        source={{ uri: selectedFile?.uri || '' }}
                                        style={{ flex: 1 }}
                                    />
                                )}
                            </View>
                        </Modal>
                    </View>

                    <AppButton
                        title="Update"
                        onPress={handleSubmit}
                        variant="secondary"
                        loading={loading}
                        disabled={loading}
                        style={styles.submitButton}
                    />
                </AppCard>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    flex: {
        flex: 1,
    },
    formCard: {
        gap: 14,
        borderRadius: 16,
    },
    uploadBlock: {
        gap: 8,
        marginTop: 4,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text,
    },
    filePreview: {
        backgroundColor: Colors.secondaryBg,
        borderColor: Colors.secondary + '30',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 4,
    },
    fileName: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
    },
    fileMeta: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    submitButton: {
        marginTop: 8,
    },
});