
# Complete Vendor Registration Flow Redesign

## Problem Summary
The vendor registration page fails because it inherits the staff user's browser session. When the `useAuth` hook runs, it detects the existing staff session and triggers database queries that fail under the vendor context.

## Root Cause
The registration page is NOT truly isolated from the authentication system. When opened in the same browser as a logged-in staff user:
1. The `AuthProvider` wraps the entire app, including the registration page
2. The existing session triggers `checkUserType()` in `useAuth`
3. RLS policies block access because the staff user isn't a vendor

## Solution: Isolated Registration Flow

### Phase 1: Make Registration Page Session-Independent

**File: `src/pages/vendor/VendorRegistration.tsx`**

Add session clearing at the very start of the registration flow:
- Before any validation, sign out any existing session silently
- This ensures the registration page starts with a clean slate
- The edge function handles all authentication, so we don't need an existing session

```text
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT (BROKEN) FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│  1. User visits /vendor/register                                │
│  2. AuthProvider detects EXISTING staff session                 │
│  3. useAuth runs checkUserType() → queries profiles table       │
│  4. VendorRegistration starts → calls validate-invitation       │
│  5. Page loads BUT AuthProvider continues in background         │
│  6. Something triggers vendors table query → RLS ERROR          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     NEW (FIXED) FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│  1. User visits /vendor/register                                │
│  2. VendorRegistration calls supabase.auth.signOut() FIRST      │
│  3. AuthProvider now has NO session                             │
│  4. validate-invitation edge function runs                      │
│  5. OTP verification completes                                  │
│  6. create-vendor-registration creates user + session           │
│  7. Clean redirect to dashboard                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 2: Prevent AuthProvider Queries During Registration

**File: `src/hooks/useAuth.tsx`**

Add a check for registration path to skip user type checking:
- When on `/vendor/register`, skip the `checkUserType` queries entirely
- This prevents any RLS-protected queries during registration

### Phase 3: Add Registration-Specific Route Guard

**File: `src/App.tsx`**

Consider using a separate route wrapper for registration that doesn't use the full `AuthProvider` context, or conditionally skip auth checks for the registration route.

## Technical Implementation Details

### Changes to VendorRegistration.tsx

1. **Add session clearing on mount**:
   - Call `supabase.auth.signOut()` before validation
   - Add a `sessionCleared` state to track this
   - Only proceed with token validation after session is cleared

2. **Prevent race conditions**:
   - Use a `useRef` to track if clearing is in progress
   - Show loading state during session clearing

### Changes to useAuth.tsx

1. **Add path-aware behavior**:
   - Import `useLocation` from react-router
   - Skip `checkUserType` when on registration paths
   - Return empty/loading state for registration routes

### Expected Behavior After Fix

1. Staff clicks registration link → session is cleared → clean registration flow
2. No RLS errors during registration
3. After successful registration, new vendor session is established
4. Staff's original session is lost (they need to log in again if they return to staff pages)

## Alternative Approach: Incognito Window

If the session clearing approach causes issues, the alternative is to:
1. Detect if there's an existing staff session
2. Show a warning: "Please open this link in an incognito window or log out first"
3. Provide a button to sign out and continue with registration

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/vendor/VendorRegistration.tsx` | Add session clearing on mount, add loading state |
| `src/hooks/useAuth.tsx` | Skip user type queries on registration paths |

## Testing Plan

1. Log in as staff on the invitations page
2. Create a new invitation
3. Click the registration link (should work now)
4. Complete OTP verification
5. Verify vendor is created and dashboard loads
6. Navigate back to staff login and confirm staff session was cleared
