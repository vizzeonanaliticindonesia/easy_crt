# Bug #82 — Unused `isSchool` symbol, dead comments, unused `errorText` style in session-detail

**Severity:** LOW · **Effort:** ~5 min · **Status:** OPEN
**Affected file:** `app/session-detail.tsx:42, 93, 133-134, 139, 195, 231, 336-339, 347, 356`

## Problem

- Orphan whitespace block at `:42`
- `isSchool` declared at `:93` but never used
- Dev comments `// ← refresh dulu`, `// ← baru back` at `:133-134`
- Dead `// console.log(user.id);` at `:139`
- Bahasa comments at `:195, :231`
- Unused `statusBanner` style at `:336-339`
- **Unused `errorText` style at `:347`** — telling: someone designed an error UI but never wired it up (this is the hole that Bug #72 needs filled)
- Unused `actionBtnSingle` at `:356`

## Fix

Delete the unused symbols, comments, and styles. **Use `errorText` to fix Bug #72** (no error UI currently shown when fetch fails).

```tsx
// In the render, after fixing Bug #72:
{error && (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>{error}</Text>
    <AppButton title="Retry" onPress={fetchData} />
  </View>
)}
```

## Related

Bug #72 (combine — finally puts `errorText` to use) · Bug #59 (similar dead code in _layout.tsx)
