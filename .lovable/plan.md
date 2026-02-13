

# OTP Verification System - WhatsApp + Email

## What We're Building

Rewriting the OTP system to support both **WhatsApp** (phone) and **Email** verification using a new unified architecture with a dedicated database table and a separate verify function.

---

## Changes Overview

### 1. Database Migration

Create a new `public_otp_verifications` table as specified in the documentation. This replaces the use of the existing `otp_verifications` table for the public referral flow.

**Table: `public_otp_verifications`**
- `identifier` (phone or email), `identifier_type` ("phone" or "email")
- `otp_code` (plaintext 6-digit), `session_id` (UUID returned to client)
- 5-minute expiry, max 3 attempts, IP tracking
- RLS: deny all direct access (edge functions use service role)

### 2. Rewrite `send-public-otp` Edge Function

Complete rewrite to match the new spec:
- Accept `{ identifier, identifierType }` instead of `{ phone, action }`
- Remove the inline "verify" action (moved to separate function)
- Rate limit: max 5 OTPs per identifier per hour
- Generate 6-digit OTP, store plaintext in `public_otp_verifications`
- **Phone path**: Read WhatsApp credentials from `whatsapp_settings` table, send via Exotel API using `psotp1` template. If not configured, return test mode with OTP visible.
- **Email path**: Send styled HTML email via Resend API (`RESEND_API_KEY` secret -- already configured)
- Return `{ success, sessionId }` to client

### 3. Create New `verify-public-otp` Edge Function

New function at `supabase/functions/verify-public-otp/index.ts`:
- Accept `{ sessionId, otp }`
- Look up by `session_id` where `verified_at IS NULL`
- Check expiry and max attempts (3)
- Increment attempts on each try
- On match: set `verified_at`, return `{ success, verified, identifier, identifierType }`
- On mismatch: return `{ error, remainingAttempts }`
- Add to `config.toml` with `verify_jwt = false`

### 4. Update `ContactDetailsStep.tsx` (Referral Form)

- Add email verification alongside existing phone verification
- Track both `phoneVerified` and `emailVerified` states
- Phone OTP: sends `{ identifier: phone, identifierType: "phone" }`, stores `sessionId`, verifies via `verify-public-otp`
- Email OTP: same flow with `identifierType: "email"`
- Both show OTP input fields with resend cooldown (60s)
- Green checkmarks when each is verified

### 5. Update `VendorReferralRegistration.tsx`

- Add `emailVerified` state alongside `phoneVerified`
- Pass `emailVerified` and `onEmailVerified` to `ContactDetailsStep`
- Update `canProceed()` for step 2 to require both phone AND email verified

### 6. Update `VendorPhoneLogin.tsx` (Vendor Login)

- Update to use new API shape: `{ identifier, identifierType: "phone" }`
- Call `verify-public-otp` for verification instead of `send-public-otp` with `action: "verify"`
- Store and use `sessionId` from send response

---

## Technical Details

**Secrets required**: All already configured (RESEND_API_KEY, EXOTEL_SID, EXOTEL_API_KEY, EXOTEL_API_TOKEN, WHATSAPP_SOURCE_NUMBER).

**Email sender**: `Paisaa Saarthi <no-reply@yourdomain.com>` via Resend API.

**WhatsApp fallback**: If `whatsapp_settings` table has no active config, returns test mode with OTP visible in response.

**Config.toml additions**:
```toml
[functions.verify-public-otp]
verify_jwt = false
```

**Files changed**:
- `supabase/functions/send-public-otp/index.ts` -- rewrite
- `supabase/functions/verify-public-otp/index.ts` -- new
- `src/components/referral/ContactDetailsStep.tsx` -- add email OTP
- `src/pages/vendor/VendorReferralRegistration.tsx` -- add emailVerified state
- `src/pages/vendor/VendorLogin.tsx` -- no change needed (uses phone only, but update API shape)
- `src/components/auth/VendorPhoneLogin.tsx` -- update to new API contract
- New database migration for `public_otp_verifications` table

