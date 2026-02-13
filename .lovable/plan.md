
## Email Sender Domain Fix for send-public-otp

### Problem
The `send-public-otp` edge function has a hardcoded placeholder email sender address `no-reply@yourdomain.com` on line 223. This domain is not verified with Resend API, causing email OTP delivery to fail with a 500 error.

### Solution
Update the email sender from the placeholder to the verified domain `noreply@in-sync.co.in`.

**Change Location:**
- File: `supabase/functions/send-public-otp/index.ts`
- Line: 223
- Current: `from: "Paisaa Saarthi <no-reply@yourdomain.com>",`
- Updated: `from: "Paisaa Saarthi <noreply@in-sync.co.in>",`

### Impact
- Email OTP verification will now work correctly for users entering emails on the referral registration form
- Phone OTP verification is unaffected (already tested and working)
- This matches the verified sender domain already in use by the transactional email system

### Files to Change
- `supabase/functions/send-public-otp/index.ts` — one line update
