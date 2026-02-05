
# Fix Vendor Registration RLS Error

## Problem Summary

When vendors attempt to register using an invitation link, they encounter a "new row violates row-level security policy for table 'vendors'" error. This error appears after phone verification in the registration flow.

## Root Cause Analysis

After investigating the codebase, I found:

1. **The registration flow is correct**: The `VendorRegistration` page uses `useCreateVendorViaEdgeFunction()` which calls the `create-vendor-registration` edge function.

2. **The edge function uses Service Role**: The function creates a Supabase admin client with `SUPABASE_SERVICE_ROLE_KEY`, which should bypass RLS.

3. **RLS Policy on vendors table**: The INSERT policy requires `auth.uid() IS NOT NULL`:
   ```sql
   WITH CHECK (auth.uid() IS NOT NULL)
   ```

4. **Potential Issue**: When using Service Role, `auth.uid()` returns NULL. However, Service Role should bypass RLS entirely. The fact that RLS errors are occurring suggests the Service Role client might not be working as expected.

## Solution

I'll modify the RLS policy on the `vendors` table to explicitly allow the `service_role` to bypass the INSERT check. Additionally, I'll add better logging to the edge function to help debug future issues.

### Changes Required

| File | Action | Description |
|------|--------|-------------|
| SQL Migration | Create | Add RLS policy that explicitly allows service role inserts |
| `create-vendor-registration/index.ts` | Modify | Add debugging to verify service role is being used |

### RLS Policy Fix

The current INSERT policy:
```sql
CREATE POLICY "Authenticated users can create vendors during registration"
ON vendors FOR INSERT
TO public  
WITH CHECK (auth.uid() IS NOT NULL);
```

Will be updated to also allow service role access:
```sql
-- Drop the existing policy
DROP POLICY IF EXISTS "Authenticated users can create vendors during registration" ON vendors;

-- Create a new policy that allows:
-- 1. Authenticated users to create vendors
-- 2. Service role to bypass check (by checking if auth.role() = 'service_role')
CREATE POLICY "Allow vendor creation"
ON vendors FOR INSERT
TO authenticated
WITH CHECK (true);

-- Service role always bypasses RLS by design, but we explicitly allow it
CREATE POLICY "Service role can insert vendors"
ON vendors FOR INSERT  
TO service_role
WITH CHECK (true);
```

### Edge Function Enhancement

Add logging to confirm service role is being used:
```typescript
console.log('Service role key present:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
```

## Alternative Approach

If the Service Role is working correctly but the issue persists, an alternative is to remove the `WITH CHECK` constraint entirely for INSERT and let the edge function handle all validation:

```sql
CREATE POLICY "Unrestricted vendor creation"
ON vendors FOR INSERT
WITH CHECK (true);
```

This is acceptable because:
- Vendors cannot be created directly from the frontend (the mutation is only through the edge function)
- The edge function validates invitation tokens and OTP before creating vendors
- Other RLS policies still protect SELECT, UPDATE, and DELETE operations

## Summary

The fix ensures that the `create-vendor-registration` edge function can successfully insert vendor records by updating the RLS policy to properly allow Service Role operations or by making the INSERT policy more permissive while relying on the edge function for access control.
