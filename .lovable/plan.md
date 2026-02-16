

# Fix: Test Number OTP Validation and Error Handling

## Problem
The `send-public-otp` and `verify-public-otp` edge functions return HTTP 400/429 status codes for validation errors. The Supabase client (`supabase.functions.invoke`) treats any non-2xx response as a generic "non-2xx response" error, hiding the actual error message (like "Invalid OTP" or "OTP expired") from the user.

## Solution
Change both edge functions to return HTTP 200 for all validation/business-logic responses, with success/failure indicated in the JSON body. Only genuine server errors remain as HTTP 500. The client code already checks `data?.error` and `data?.verified`, so no frontend changes are needed.

## Changes

### 1. `supabase/functions/send-public-otp/index.ts`
- Lines 23-26 (missing identifier): Change `status: 400` to `status: 200`
- Lines 30-33 (invalid identifierType): Change `status: 400` to `status: 200`
- Lines 40-43 (invalid phone format): Change `status: 400` to `status: 200`
- Lines 47-50 (invalid email format): Change `status: 400` to `status: 200`
- Lines 74-77 (rate limit exceeded): Change `status: 429` to `status: 200`
- Keep all `status: 500` responses unchanged (genuine server errors)

### 2. `supabase/functions/verify-public-otp/index.ts`
- Lines 18-20 (missing params): Change `status: 400` to `status: 200`
- Lines 37-40 (no valid OTP found): Change `status: 400` to `status: 200`
- Lines 45-48 (OTP expired): Change `status: 400` to `status: 200`
- Lines 53-56 (max attempts): Change `status: 429` to `status: 200`
- Lines 86-89 (invalid OTP mismatch): Change `status: 400` to `status: 200`
- Keep `status: 500` unchanged

### 3. `src/components/referral/ContactDetailsStep.tsx` -- Fix toast notification
- Line 77: Change toast message from `"OTP sent via WhatsApp"` to `"OTP sent to your WhatsApp"` (consistent with backend message)
- The existing error-handling logic at lines 68-69 (`if (error) throw error; if (data?.error) throw new Error(data.error)`) and lines 94-100 (`if (error) throw error; if (data?.verified) ... else toast.error(...)`) will now work correctly since the Supabase client won't throw on these responses

## Why This Works
The client code already has the correct branching logic:
```
const { data, error } = await supabase.functions.invoke(...)
if (error) throw error;          // Won't fire anymore (200 status)
if (data?.verified) { ... }      // Handles success
else toast.error(data?.error);   // Handles validation errors with actual message
```

By returning 200, the `error` field from `supabase.functions.invoke` will be `null`, and the code correctly reads `data.error` or `data.verified` from the JSON body.

## Technical Notes
- No database changes required
- No frontend logic changes required (only toast text update)
- Both edge functions will be auto-deployed after the changes
