# Bug #61 — `console.log('ERROR SUBURB:', err)` leaks raw axios error in registration

**Severity:** MEDIUM · **Effort:** ~3 min · **Status:** OPEN
**Affected file:** `app/register-school.tsx:86-88`

## Problem

```ts
} catch (err) {
    console.log('ERROR SUBURB:', err);
}
```

Silent failure for the user (dropdown stays empty with no message), AND the raw axios error (URL, headers, partial payload) written to release-mode console.

## Impact

Same family as Bug #3/#16/#39/#40. User has no idea why suburbs aren't loading. Dev log leaks request internals.

## Fix

```ts
} catch (err) {
    if (__DEV__) console.error('Failed to load suburbs:', err);
    notify('Error', 'Could not load suburbs. Please try again.');
}
```

## Related

Bug #3 family of console-log leaks
