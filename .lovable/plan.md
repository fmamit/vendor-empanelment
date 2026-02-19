

## Fix OTP Email: Sender Name and Text Visibility

### Problems
1. **Wrong sender name** -- The `from` field says "Paisaa Saarthi" instead of "Capital India"
2. **Invisible OTP code** -- The email uses white/light-gray text colors on a dark CSS gradient background. Many email clients (Outlook, Gmail) strip gradient backgrounds, leaving the text invisible against a white background.

### Solution

**File to modify:** `supabase/functions/send-public-otp/index.ts`

1. Change `from` on line 223 from `"Paisaa Saarthi <noreply@in-sync.co.in>"` to `"Capital India <noreply@in-sync.co.in>"`

2. Rebuild the email HTML template with email-safe styling:
   - Use solid dark background color instead of CSS gradient (better email client support)
   - Make all text use high-contrast colors: headings and OTP in solid black or dark navy
   - Use a light/white card-style layout that works even if backgrounds are stripped
   - OTP code styled in large, bold, black text so it is always visible regardless of email client rendering

### Revised Email Design
- White/light background card
- "Capital India" heading in dark text
- "Vendor Registration Verification" subtitle in dark gray
- OTP code in large bold black text with a light gray bordered box
- Expiry notice in dark gray
- All text remains readable even if the email client strips all CSS background properties

