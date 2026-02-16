

# Cleanup: Remove Dead Landing Page

## What's Happening

The old "Select your login type" landing page (`src/pages/Index.tsx`) is still in the codebase. It's imported in `App.tsx` but never rendered on any route -- the `/` route already shows the Staff Login page. This is dead code that should be removed.

## Changes

### 1. Delete `src/pages/Index.tsx`
Remove the old landing page file entirely. It contains the "I'm a Vendor" / "Staff Login" card selector that is no longer used.

### 2. Clean up `src/App.tsx`
Remove the unused import line:
```
import Index from "./pages/Index";
```

No route changes needed -- the `/` route already points to `<StaffLogin />`.

## Summary

| Action | File |
|---|---|
| Delete | `src/pages/Index.tsx` |
| Edit (remove 1 import line) | `src/App.tsx` |

Two files touched, zero functionality change. The Staff Login remains the landing page at `/`.

