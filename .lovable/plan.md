

# Fix All Three Verification Errors + Bank Account Button

## Problem Summary

Three issues are causing all verifications to fail:

1. **CORS headers are outdated** in `verify-bank-account` and `verify-aadhaar` -- they're missing the newer Supabase client headers, causing browser preflight failures that return empty responses.
2. **Unsafe JSON parsing** in both edge functions AND the frontend hook -- `response.json()` crashes when the response body is empty or non-JSON.
3. **Bank Account button appears disabled** because the encrypted bank details may not be resolving correctly from the backend decrypt function. The button is always rendered but greyed out when account number or IFSC is missing.

## Changes

### 1. Edge Function: `supabase/functions/verify-bank-account/index.ts`
- Update CORS headers to include `x-supabase-client-platform`, `x-supabase-client-platform-version`, `x-supabase-client-runtime`, `x-supabase-client-runtime-version`
- Replace `await response.json()` (line 96) with safe `response.text()` + `JSON.parse` try/catch pattern (matching the already-fixed `verify-pan`)

### 2. Edge Function: `supabase/functions/verify-aadhaar/index.ts`
- Update CORS headers (same additions as above)
- Replace `await response.json()` (line 55) with safe `response.text()` + `JSON.parse` try/catch pattern

### 3. Frontend Hook: `src/hooks/useVendorVerification.tsx`
- In all four mutation functions (`useVerifyPan`, `useVerifyBankAccount`, `useInitiateAadhaar`, `useFetchAadhaarDetails`):
  - Replace `await response.json()` with `await response.text()` then `JSON.parse` inside a try/catch
  - On parse failure, throw a user-friendly error: "Verification service is temporarily unavailable"

### 4. Verify Bank Button Visibility
- Add console logging in VerificationPanel to debug whether `bankAccountNumber` and `bankIfsc` props arrive correctly from the decrypted RPC
- If the button is correctly rendered but disabled due to null values, this indicates the decrypt function works but the data wasn't stored during registration -- will confirm and surface a clear "No bank details on file" message instead of a silently disabled button

## Technical Details

### Updated CORS Headers (for verify-bank-account and verify-aadhaar)
```text
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type,
  x-supabase-client-platform, x-supabase-client-platform-version,
  x-supabase-client-runtime, x-supabase-client-runtime-version
```

### Safe JSON Parsing Pattern (edge functions)
```text
const responseText = await response.text();
let responseData;
try {
  responseData = JSON.parse(responseText);
} catch {
  // Log raw response for debugging, return graceful error
  return Response with { success: false, error: "Invalid response from service" }
}
```

### Safe JSON Parsing Pattern (frontend hook)
```text
const responseText = await response.text();
let data;
try {
  data = JSON.parse(responseText);
} catch {
  throw new Error("Verification service is temporarily unavailable.");
}
if (!data.success) throw new Error(data.error || "Verification failed");
return data.data;
```

### Bank Button UX Improvement
- When `bankAccountNumber` or `bankIfsc` is missing, show a small note: "Bank details not available for this vendor" instead of a silently disabled button
- This makes it clear to staff why the button cannot be clicked

## Files Modified
1. `supabase/functions/verify-bank-account/index.ts` -- CORS + safe parsing
2. `supabase/functions/verify-aadhaar/index.ts` -- CORS + safe parsing
3. `src/hooks/useVendorVerification.tsx` -- safe parsing in all 4 mutations
4. `src/components/staff/VerificationPanel.tsx` -- UX for missing bank details

