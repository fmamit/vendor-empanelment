

# Set Up Test Phone Number for Vendor Login

## Overview
Configure a test phone number that bypasses the real SMS OTP flow, allowing you to test vendor login without receiving actual SMS messages. This is done through the backend authentication settings.

## How Test Phone Numbers Work
The backend authentication system supports configuring test phone numbers with pre-defined OTP codes. When a user tries to log in with a test phone number:
- No real SMS is sent
- A fixed OTP code (that you define) is accepted
- The user is authenticated normally

## Implementation Steps

### Step 1: Configure Test Phone Number
I'll use the authentication configuration tool to add a test phone number. You'll need to provide:
- **Test phone number**: e.g., `+919999999999` (with country code)
- **Test OTP code**: e.g., `123456`

### Step 2: Usage
Once configured, you can:
1. Go to the Vendor Login page
2. Enter `9999999999` as the phone number
3. Click "Get OTP" (no SMS will be sent)
4. Enter `123456` as the OTP
5. Successfully log in as a test vendor

## Important Notes
- Test phone numbers only work in the test/development environment
- Real phone numbers will still receive actual SMS messages
- You can configure multiple test phone numbers if needed
- This is a standard feature for testing phone authentication

## Next Step
After you approve this plan, I'll configure the test phone number in your backend authentication settings. Please let me know:
- What phone number would you like to use for testing? (default: `9999999999`)
- What OTP code should be accepted? (default: `123456`)

