import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { notify } from '@/lib/dialogs';
import { documentsRepository } from '@/lib/repositories/documentsRepository';
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
import { insertSchoolDocument } from '@/lib/services/school';
import { useAuth } from '@/contexts/AuthContext';

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

export default function CreateDocumentScreen() {
    const { user } = useAuth();
    const router = useRouter();
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

        if (!selectedFile) {
            notify('Error', 'Please upload a file first.');
            return;
        }

        setLoading(true);

        try {
            // FormData is prepared here so integration with API can be added later without changing form flow.
            const formData = new FormData();
            formData.append('document_name', documentName.trim());
            formData.append('document_number', documentNumber.trim());
            formData.append('issued_by', issuedBy.trim());
            formData.append('issue_date', issueDate);
            formData.append('expiry_date', expiryDate);
            formData.append('file', {
                uri: selectedFile.uri,
                name: selectedFile.name,
                type: selectedFile.mimeType,
            } as any);

            await insertSchoolDocument({
                document_name: documentName.trim(),
                document_number: documentNumber.trim() ,
                issued_by: issuedBy.trim(),
                issue_date: issueDate,
                expiry_date: expiryDate,
                fileUri: selectedFile.uri,
                fileMimeType: selectedFile.mimeType,
                fileSize: selectedFile.size,
            });

            notify('Success', 'Document uploaded successfully.', () => {
                if (user?.role == 10) {
                    router.replace({
                        pathname: '/(school-tabs)/documents',
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
            notify('Error', 'Upload failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={[styles.container, { paddingTop: topPad }]}>
            <AppTopBar
                title="Create Document"
                onBack={() => router.replace('/profile')}
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
                    title="Upload New Document"
                    subtitle="Fill document details and attach a PDF/JPG/PNG file"
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
                            <View style={styles.filePreview}>
                                <Text style={styles.fileName}>{selectedFile.name}</Text>
                                <Text style={styles.fileMeta}>{(selectedFile.size / 1024).toFixed(1)} KB</Text>
                            </View>
                        ) : null}
                    </View>

                    <AppButton
                        title="Submit"
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
