# Bug #26 — Silent `catch {}` blocks hide root cause in `edit-document.tsx`

**Severity:** MEDIUM · **Effort:** ~5 min · **Status:** OPEN
**Affected file:** `app/edit-document.tsx:108, 153, 207`

## Problem

```ts
} catch {
    notify('Error', 'Failed to load document detail.');
}
```

Three `catch {}` blocks discard the actual error. QA cannot distinguish 401 / 422 / 500 / network failure. Dev cannot reproduce from logs.

## Impact

Diagnostic dead end. Every failure surfaces the same generic toast. Bug reports from users say "Failed to load" with no further info.

## Fix

```ts
} catch (e) {
    if (__DEV__) console.error('Failed to load document:', e);
    notify('Error', `Failed to load document. ${e?.message ?? ''}`.trim());
}
```

Or route through a `reportError` helper that ships sanitized info to a crash reporter.

## Related

Bug #15, #24, #25 (same file — combine fixes)
