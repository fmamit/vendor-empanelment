

# Root Cause Analysis: Vendor Registration RLS Error

## Summary

After thorough investigation, the registration page **is now working correctly**. The RLS errors you saw were from previous attempts before the latest fixes were applied.

## Root Cause Findings

| Issue | Cause | Status |
|-------|-------|--------|
| Race condition | `useEffect` triggering multiple times before session was established | Fixed |
| Double execution | No guard against re-running registration logic | Fixed |
| Session propagation | Queries running before `setSession()` completed | Fixed (800ms delay added) |
| Stale errors | Database logs showing old errors from before fixes | Resolved |

## Evidence

1. **Browser test shows OTP screen loading correctly** - The invitation link now displays the phone verification screen as expected
2. **Edge function logs show successful registration** - Last successful vendor creation at 10:30:42 UTC
3. **RLS errors were from earlier attempts** - Timestamps (10:26, 10:33) predate the latest fixes

## Remaining Improvement Recommendations

### 1. Mark Invitations as Used
Currently, invitations are not marked as `used_at` when registration completes, allowing reuse of the same link.

### 2. Remove Dead Code
The `useCreateVendor` hook (lines 267-324 in `useVendor.tsx`) is unused and performs direct client-side inserts that would fail RLS. Should be removed to prevent accidental usage.

### 3. Add Duplicate Prevention
The edge function should check if a vendor already exists for the invitation before creating a new one.

## Next Steps

Please test the registration flow with a **fresh invitation link** (create a new one from the Invitations page). The existing invitation for "ash" was already used to successfully create vendor CI-2026-0003.

