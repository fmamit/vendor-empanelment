
# Root Cause Analysis: Vendor Registration RLS Error

## Summary

The RLS error persists due to a **race condition** in the registration flow, not an RLS policy misconfiguration.

## Root Cause

When the phone verification completes, the following sequence occurs:

1. `isPhoneVerified` becomes `true`
2. `useEffect` triggers `createVendorViaEdge.mutateAsync()`
3. Edge function creates user, vendor, and returns session tokens
4. Frontend calls `supabase.auth.setSession()` (async operation)
5. **RACE**: `refetchVendor()` is called BEFORE the session is fully propagated
6. The vendor profile query executes as an unauthenticated user, causing failures

Additionally, the `useEffect` can fire multiple times if dependencies change, potentially causing duplicate registration attempts.

## Evidence

| Timestamp | Event | User ID |
|-----------|-------|---------|
| 10:13:46 | Anonymous signup (frontend) | `9797de04...` (no metadata) |
| 10:14:17 | Anonymous signup (frontend) | `74fa191a...` (no metadata) |
| 06:47:49 | Proper user (edge function) | `cf62f562...` (has `is_vendor:true`) |

The users with empty metadata are created by the frontend's auth system, not the edge function.

## Solution

### Changes Required

| File | Change |
|------|--------|
| `src/pages/vendor/VendorRegistration.tsx` | Add ref guard to prevent double execution; use returned vendor_id directly instead of refetching; add proper session waiting |
| `src/hooks/useVendor.tsx` | Return vendor data from mutation for immediate use |

### Implementation Details

1. **Add Ref Guard**: Prevent the useEffect from running multiple times
2. **Use Returned Data**: The edge function returns `vendor_id` - use it directly instead of calling `refetchVendor()`
3. **Wait for Session**: Add a small delay or listener to ensure `setSession()` has propagated before any subsequent queries
4. **Navigation**: After successful registration, navigate directly to the dashboard instead of staying on the page

### Code Pattern

```typescript
const registrationInProgressRef = useRef(false);

useEffect(() => {
  const initializeVendorSession = async () => {
    // Prevent double execution
    if (registrationInProgressRef.current) return;
    if (!invitation || invitationLoading || !isPhoneVerified || !token) return;
    
    registrationInProgressRef.current = true;
    setIsInitializing(true);

    try {
      const result = await createVendorViaEdge.mutateAsync({...});
      
      // Wait for session to propagate
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate directly - don't refetch
      navigate("/vendor/dashboard");
    } catch (error) {
      registrationInProgressRef.current = false;
      setInitError(error.message);
    }
  };
  initializeVendorSession();
}, [invitation, invitationLoading, isPhoneVerified, token]);
```

## Summary

The fix involves adding safeguards against race conditions and double-execution, and using the data returned by the edge function directly rather than immediately querying the database.
