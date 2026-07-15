# Bug #36 — WWCC constants imported, picker commented out — incomplete feature in main

**Severity:** LOW · **Effort:** ~5 min · **Status:** OPEN
**Affected file:** `app/create-session.tsx:93-128, 180, 664-672`

## Problem

WWCC option list, label/value maps, and the `requireWwcc` state setter are declared but the picker is commented out (lines 664-672). Dead code with unused setters; signals an incomplete feature was shipped to main.

## Fix

Either:
- **Re-enable the picker** (uncomment lines 664-672) if the feature should ship, OR
- **Remove all WWCC state, constants, and the commented JSX** if the feature is on hold

Don't leave half-implemented features in main.

## Related

Bug #82 (similar dead-code patterns elsewhere)
