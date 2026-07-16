# Bug #25 — Web `Blob` upload sends `application/octet-stream`, backend MIME validation rejects valid files

**Severity:** MEDIUM · **Effort:** ~10 min · **Status:** OPEN
**Affected file:** `app/edit-document.tsx:177-179`

## Problem

```ts
const resBlob = await fetch(selectedFile.uri);
const blob = await resBlob.blob();
formData.append('file_upload', blob, selectedFile.name);
```

The `Blob` from `resBlob.blob()` inherits the Content-Type from the local fetch (often `application/octet-stream`). Backend MIME validation rejects legitimate PDFs/images on web.

## Impact

Web users uploading PDFs/PNGs get backend rejection ("invalid file type"). Native works fine because the FormData entry includes explicit type. Web-only regression.

## Fix

```ts
const resBlob = await fetch(selectedFile.uri);
const arrayBuffer = await resBlob.arrayBuffer();
const blob = new Blob([arrayBuffer], { type: selectedFile.mimeType });
formData.append('file_upload', blob, selectedFile.name);
```

## Related

Bug #24 (same upload code path — combine fixes)
