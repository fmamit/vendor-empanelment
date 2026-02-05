
# Fix Vendor Registration Session & Navigation Issue

## Problem Analysis

After a deep dive into the code, I've identified the exact issue:

### What's Happening

1. **VendorRegistration** is rendered via `PublicRoutes` (NO AuthProvider)
2. Edge function `create-vendor-registration` successfully creates:
   - User account
   - Vendor record  
   - Vendor_users link
   - Returns session tokens
3. Frontend calls `setSession()` - session is established
4. `navigate("/vendor/dashboard")` is called using React Router
5. **THE BUG**: `App.tsx` evaluates `isRegistrationPath` only ONCE on mount:
   ```typescript
   const isRegistrationPath = window.location.pathname.startsWith('/vendor/register');
   ```
6. Since this was evaluated before navigation, the app still thinks we're on registration path
7. Dashboard tries to render BUT without AuthProvider context
8. `useAuth()` throws or returns undefined
9. Dashboard queries fire with incomplete context → RLS errors

### The Root Cause

The `isRegistrationPath` check in `App.tsx` uses `window.location.pathname` which is evaluated once during initial render. React Router navigation doesn't cause a re-render of this check, so the new path still renders without `AuthProvider`.

## Solution: Force Full Page Reload After Registration

The simplest and most reliable fix is to use `window.location.href` instead of `navigate()`. This forces a full browser reload which:
1. Re-evaluates `isRegistrationPath` correctly
2. Properly mounts `AuthProvider` for the dashboard
3. Ensures clean auth state with the new session

### File: `src/pages/vendor/VendorRegistration.tsx`

**Change (line 237):**
```typescript
// BEFORE (broken):
navigate("/vendor/dashboard");

// AFTER (fixed):
window.location.href = "/vendor/dashboard";
```

### Additional Improvement: Verify Session Before Navigation

Add session verification to ensure the session is active before redirecting:

```typescript
// After setSession(), verify it worked
const { data: { user }, error: userError } = await supabase.auth.getUser();
if (userError || !user) {
  throw new Error("Failed to establish session");
}

console.log("[VendorRegistration] Session verified for user:", user.id);

// Use full page reload for clean auth state
setState("SUCCESS");
toast.success("Registration successful!");
window.location.href = "/vendor/dashboard";
```

## Technical Summary

| Component | Issue | Fix |
|-----------|-------|-----|
| `VendorRegistration.tsx` | Uses `navigate()` which doesn't re-render App.tsx routing logic | Use `window.location.href` for full reload |
| Session handling | No verification before redirect | Add `getUser()` check after `setSession()` |

## Expected Behavior After Fix

1. Vendor opens registration link
2. Any existing session is cleared (already implemented)
3. Token validation via edge function (already works)
4. OTP verification (already works)
5. Edge function creates user + vendor + link (already works)
6. Session is set and verified
7. **Full page reload** to `/vendor/dashboard`
8. `App.tsx` correctly detects non-registration path
9. `AuthProvider` is mounted with new vendor session
10. Dashboard loads successfully with vendor data

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/vendor/VendorRegistration.tsx` | Replace `navigate()` with `window.location.href`, add session verification |
