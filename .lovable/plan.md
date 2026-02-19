

## PII Encryption Key Management UI

### Overview
Add a new "Encryption" tab in the Admin Settings page that allows admins to securely set or rotate the PII encryption key stored in the backend vault. This key is used by the `encrypt_pii` / `decrypt_pii` database functions for DPDP compliance.

### How It Works

1. **New Tab in Admin Settings** -- Add a "Security" or "Encryption" tab (with a Key icon) to the existing `AdminSettings.tsx` tabs alongside Categories, Doc Types, etc.

2. **UI Components** -- The tab will contain:
   - A card explaining that this key is used for PII encryption under DPDP Act compliance
   - A password input field for entering/rotating the encryption key (masked by default, with a show/hide toggle)
   - A "Save Key" button
   - A warning/info banner that rotating the key will make previously encrypted data unreadable unless re-encrypted
   - Status indicator showing whether a key is currently configured

3. **New Edge Function: `set-encryption-key`** -- Since the PII encryption key is stored in the Supabase Vault (not a regular table), we need an edge function that:
   - Accepts the new key from an authenticated admin
   - Validates the caller has admin role (via service role key + user JWT check)
   - Upserts the `PII_ENCRYPTION_KEY` secret in the Vault using the service role
   - Returns success/failure

4. **Security** -- Access is gated by `isAdmin` check in the frontend (already in AdminSettings) and server-side admin role verification in the edge function.

### Technical Details

**Files to create:**
- `supabase/functions/set-encryption-key/index.ts` -- Edge function that receives the key and stores it in the Vault via SQL (`INSERT INTO vault.secrets ... ON CONFLICT UPDATE`)

**Files to modify:**
- `src/pages/admin/AdminSettings.tsx` -- Add "Encryption" tab with:
  - Key icon import
  - State for encryption key input and visibility toggle
  - Mutation calling the `set-encryption-key` edge function
  - UI: info card, password input, save button, rotation warning

### User Flow
1. Admin navigates to System Settings
2. Clicks "Encryption" tab
3. Enters the AES-256 encryption key
4. Clicks "Save Key"
5. Edge function validates admin role, stores key in vault
6. Success toast confirms the key was saved

