
# Update Email Sender Domain

## Problem

The `send-vendor-email` edge function is currently using the default Resend testing domain (`onboarding@resend.dev`), which only allows sending emails to the Resend account owner. Your domain `in-sync.co.in` is now verified and ready to use.

## Solution

Update the `from` address in the edge function to use your verified domain.

## Change Required

**File:** `supabase/functions/send-vendor-email/index.ts`

**Line 188 - Current:**
```typescript
from: 'Capital India <onboarding@resend.dev>',
```

**Updated:**
```typescript
from: 'Capital India <noreply@in-sync.co.in>',
```

## Impact

After this change:
- Emails can be sent to any recipient (not just the account owner)
- Emails will have better deliverability with verified SPF/DKIM
- The sender will appear as "Capital India" with the address `noreply@in-sync.co.in`

## Implementation

This is a single-line change in the edge function. Once deployed, the system will immediately be able to send emails to vendors at any email address.

## Testing

After the update, we can:
1. Send a test invitation to verify delivery
2. Check that the email appears correctly with the Capital India branding
3. Confirm it doesn't land in spam
