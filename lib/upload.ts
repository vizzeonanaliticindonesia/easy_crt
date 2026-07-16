import { fetchResource } from '@/lib/api';

export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

export type UploadFileCandidate = {
    name?: string;
    mimeType?: string;
    size?: number | null;
};

export function hasAllowedExtension(fileName: string): boolean {
    const lower = fileName.toLowerCase();
    return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function validateUploadFile(
    file: UploadFileCandidate,
    options?: {
        allowedMimeTypes?: string[];
        maxSizeBytes?: number;
    }
) {
    const allowedMimeTypes = options?.allowedMimeTypes ?? ALLOWED_MIME_TYPES;
    const maxSizeBytes = options?.maxSizeBytes ?? MAX_FILE_SIZE_BYTES;
    const mimeType = (file.mimeType || '').trim();
    const validMime = allowedMimeTypes.includes(mimeType);
    const validExtension = hasAllowedExtension(file.name || '');

    if (!validMime && !validExtension) {
        return {
            isValid: false,
            error: 'Only PDF, JPG, and PNG files are allowed.',
        } as const;
    }

    if ((file.size || 0) > maxSizeBytes) {
        return {
            isValid: false,
            error: 'File size must be 2MB or less.',
        } as const;
    }

    return {
        isValid: true,
        normalizedMimeType: mimeType || 'application/octet-stream',
    } as const;
}

export async function createUploadBlob(uri: string, mimeType: string) {
    const response = await fetchResource(uri);
    const arrayBuffer = await response.arrayBuffer();
    return new Blob([arrayBuffer], { type: mimeType || 'application/octet-stream' });
}
