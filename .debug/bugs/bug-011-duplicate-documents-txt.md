# Bug #11 — Duplicate file `app/(school-tabs)/documents.txt` — byte-for-byte copy of `documents.tsx`

**Severity:** LOW · **Effort:** ~10 sec · **Status:** OPEN
**File to delete:** `app/(school-tabs)/documents.txt`

## Problem

```
8653 May 21  app/(school-tabs)/documents.tsx
8653 Jun 21  app/(school-tabs)/documents.txt   ← exact duplicate, .txt extension
```

Expo Router ignores `.txt` so the app still works, but the file:
- Will drift from the real `.tsx` as someone edits one and not the other
- Pollutes every global grep / IDE search
- Looks like a botched "backup before refactor" attempt

## Fix

```sh
rm app/(school-tabs)/documents.txt
```

Then `git rm` and commit.
