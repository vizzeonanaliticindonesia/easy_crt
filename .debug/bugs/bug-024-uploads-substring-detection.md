# Bug #24 — `/uploads` substring detection wrongly classifies new files as "existing server file"

**Severity:** HIGH · **Effort:** ~15 min · **Status:** OPEN
**Affected file:** `app/edit-document.tsx:175`

## Problem

```tsx
// app/edit-document.tsx:175
if (selectedFile && !selectedFile.uri.includes('/uploads')) {
    // ...append file_upload to FormData
}
```

The intent: "if the user picked a new file (not the existing one already on the server), append it to the FormData so the backend re-uploads."

The detection method: check if the URI contains `/uploads`. If yes → assume existing server file → skip upload.

The problem: on Android, the document picker often returns URIs with cache paths that happen to contain `/uploads` (user-named folders, document-picker cache directory, downloaded files). When that false-positive triggers, the user's newly-picked file is **silently dropped** from the FormData. The backend gets a "no file" update and keeps the old file. The user sees "Document updated successfully" — but the old file remains attached.

## Impact

User-facing:
- User goes to edit a document
- User picks a new file (perhaps a corrected PDF after the first one was rejected)
- App says "Document updated successfully"
- Backend still has the OLD file
- User assumes the update worked; later discovers it didn't

This is the worst class of bug — silent data loss with a misleading success message.

## Fix

Track an explicit `isNewFile` flag set when `pickFile` is called:

```tsx
// app/edit-document.tsx
const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
const [isNewFile, setIsNewFile] = useState(false);   // NEW

async function pickFile() {
  const result = await DocumentPicker.getDocumentAsync({ ... });
  if (result.canceled) return;
  // ... validation ...
  setSelectedFile({
    name: result.assets[0].name,
    uri: result.assets[0].uri,
    mimeType: result.assets[0].mimeType ?? '',
    size: result.assets[0].size ?? 0,
  });
  setIsNewFile(true);   // ← user picked a new file
}

async function handleSubmit() {
  // ... existing validation ...
  if (selectedFile && isNewFile) {
    // append to FormData
    if (Platform.OS === 'web') {
      const resBlob = await fetch(selectedFile.uri);
      const blob = await resBlob.blob();
      formData.append('file_upload', blob, selectedFile.name);
    } else {
      formData.append('file_upload', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType,
      } as any);
    }
  }
  // submit ...
}
```

This makes the intent explicit. No fragile substring matching.

## Acceptance criteria

- [ ] Editing a document without picking a new file → backend keeps existing file (no `file_upload` sent)
- [ ] Editing a document AND picking a new file (even with `/uploads` in the URI path) → backend receives and stores the new file
- [ ] Success toast only appears when the actual update happened
- [ ] Manual test on Android: pick a file from a folder containing "uploads" in the path → verify it uploads correctly
- [ ] Regression test at `__tests__/regressions/bug-024-uploads-substring-detection.test.tsx`

## Related

- Bug #25 — Web `Blob` upload missing MIME type (combine fixes — both in the same code block)
- Bug #15 — same screen routes teacher edits to school endpoint (combine fixes — both in handleSubmit)
- Bug #26 — silent `catch {}` blocks in this file mask the error if upload does fail
