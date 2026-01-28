
# Development Bypass Mode for Vendor Login

## Overview
Add a development/test mode to the vendor phone login that allows you to use a test phone number (`9999999999`) with a fixed OTP code (`123456`) without triggering real SMS delivery or backend authentication.

## How It Will Work
When you enter the test phone number:
1. **Send OTP step**: Instead of calling the backend, it will skip the SMS and go directly to the OTP entry screen
2. **Verify OTP step**: Instead of calling the backend, it will check if the OTP matches `123456` and create a mock session

## Test Credentials
- **Phone Number**: `9999999999`
- **OTP Code**: `123456`

## Implementation Details

### File to Modify
`src/components/auth/VendorPhoneLogin.tsx`

### Changes
1. Add a constant for the test phone number and OTP code
2. Modify `handleSendOTP` to detect the test number and skip the backend call
3. Modify `handleVerifyOTP` to detect the test number and validate against the fixed OTP
4. For test mode, use `signInWithPassword` with a pre-created test account OR navigate directly to the dashboard

### Technical Approach

```text
+-------------------+     +------------------+     +-------------------+
|  Enter Phone      | --> |  Is Test Number? | --> |  Skip SMS Call    |
|  9999999999       |     |  (9999999999)    |     |  Go to OTP Screen |
+-------------------+     +------------------+     +-------------------+
                                 |
                                 v (No)
                          +------------------+
                          |  Call Backend    |
                          |  signInWithOtp   |
                          +------------------+

+-------------------+     +------------------+     +-------------------+
|  Enter OTP        | --> |  Is Test Number? | --> |  Check OTP=123456 |
|  123456           |     |  (9999999999)    |     |  Navigate to      |
+-------------------+     +------------------+     |  /vendor/dashboard|
                                                   +-------------------+
```

### Code Changes Summary

1. Add test mode constants at the top of the file:
   - `TEST_PHONE = "9999999999"`
   - `TEST_OTP = "123456"`

2. In `handleSendOTP`:
   - Check if phone matches `TEST_PHONE`
   - If yes: show success toast and go to OTP step (no backend call)
   - If no: proceed with normal backend flow

3. In `handleVerifyOTP`:
   - Check if phone matches `TEST_PHONE`
   - If yes: validate OTP against `TEST_OTP`, then navigate to dashboard
   - If no: proceed with normal backend verification

## Security Note
This bypass only works for the specific test phone number. All other phone numbers will continue to use the real authentication flow. In a production environment, you may want to add an environment check to disable this feature.
