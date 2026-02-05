
# Fix Vendor Registration RLS Error and WhatsApp OTP Delivery

## Problem Summary

There are two issues:

1. **RLS Error ("new row violates row-level security policy for table vendors")**: Anonymous sign-in is failing, so `auth.uid()` is null when trying to create the vendor record.

2. **WhatsApp OTP not received**: The system shows the message was sent successfully (Exotel returned HTTP 202), but the message may not be delivered due to template formatting or delivery delays.

## Root Cause Analysis

### RLS Error
The current flow requires anonymous authentication to work:
```text
OTP Verified -> signInAnonymously() -> Create Vendor (requires auth.uid())
```

The RLS policy on `vendors` table:
```sql
WITH CHECK (auth.uid() IS NOT NULL)
```

If anonymous auth fails or is disabled, `auth.uid()` returns null and the INSERT is blocked.

### WhatsApp OTP
The logs show successful API calls to Exotel, but the actual WhatsApp message may not be delivered due to:
- Template content mismatch between Exotel configuration and what the code sends
- Delivery delays on WhatsApp Business API

## Solution

### Part 1: Fix RLS Error - Use Edge Function for Vendor Creation

Instead of relying on anonymous auth (which can be unreliable), create an edge function that uses the service role to bypass RLS and create the vendor record securely after OTP verification.

**New Edge Function: `create-vendor-registration`**
- Validates the invitation token
- Verifies that OTP was completed (checks `otp_codes` table for a valid used code)
- Creates vendor and vendor_user records using service role
- Returns the session for the newly registered vendor

**Changes to Registration Flow:**
```text
Before:
  OTP Verified -> signInAnonymously() -> Client creates vendor (blocked by RLS)

After:
  OTP Verified -> Call edge function -> Edge function creates vendor with service role
```

### Part 2: Improve OTP Delivery Visibility

Add a fallback mechanism and better error handling:
- Log detailed Exotel response in the edge function
- Show the OTP code temporarily in development mode for testing (can be disabled)
- Add SMS fallback option (future enhancement)

## Implementation Details

### 1. Create Edge Function: `supabase/functions/create-vendor-registration/index.ts`

The function will:
- Accept invitation token and phone number
- Verify a valid used OTP exists for that phone number
- Create vendor record (using service role - bypasses RLS)
- Create vendor_user record linking to a new anonymous user
- Return success with vendor ID

### 2. Update `src/pages/vendor/VendorRegistration.tsx`

After OTP verification:
- Call the new edge function instead of using `signInAnonymously()` + client-side insert
- The edge function handles all the secure database operations
- Set the returned anonymous session for continued use

### 3. Update `src/hooks/useVendor.tsx`

Add a new hook `useCreateVendorViaEdgeFunction` that:
- Calls the edge function
- Handles the response and error states
- Signs in with the returned session

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/create-vendor-registration/index.ts` | Create | New edge function for secure vendor creation |
| `src/pages/vendor/VendorRegistration.tsx` | Modify | Use edge function instead of client-side insert |
| `src/hooks/useVendor.tsx` | Modify | Add hook for edge function call |

## Security Considerations

- The edge function validates the invitation token before creating records
- OTP verification is confirmed by checking the database
- Service role is only used in the edge function (server-side)
- The anonymous user session is created server-side and returned to client

## Data Flow Diagram

```text
┌─────────────────────────────────────────────────────────────────────┐
│                      Vendor Registration Flow                        │
└─────────────────────────────────────────────────────────────────────┘

┌──────────┐    ┌──────────┐    ┌─────────────────┐    ┌────────────┐
│  Vendor  │    │  OTP     │    │  Edge Function  │    │  Database  │
│  Browser │    │ Verified │    │  (Service Role) │    │            │
└────┬─────┘    └────┬─────┘    └───────┬─────────┘    └──────┬─────┘
     │               │                   │                     │
     │ Enter OTP     │                   │                     │
     ├──────────────>│                   │                     │
     │               │                   │                     │
     │  OTP Valid    │                   │                     │
     │<──────────────┤                   │                     │
     │               │                   │                     │
     │ Call create-vendor-registration   │                     │
     ├──────────────────────────────────>│                     │
     │               │                   │                     │
     │               │                   │  Create anon user   │
     │               │                   ├────────────────────>│
     │               │                   │                     │
     │               │                   │  Insert vendor      │
     │               │                   ├────────────────────>│
     │               │                   │                     │
     │               │                   │  Insert vendor_user │
     │               │                   ├────────────────────>│
     │               │                   │                     │
     │ Return session + vendor_id        │                     │
     │<──────────────────────────────────┤                     │
     │               │                   │                     │
     │ Continue registration wizard      │                     │
     │               │                   │                     │
```

## Testing

After implementation:
1. Click an invitation link
2. Enter the OTP (check edge function logs for the code if WhatsApp delivery is delayed)
3. Verify the vendor record is created without RLS errors
4. Complete the registration wizard
