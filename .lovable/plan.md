

# Implement PII Encryption for DPDP Act Compliance

## Problem

Sensitive PII fields (PAN, Aadhaar, bank account number, mobile numbers) are stored as **plain text** in the database. While infrastructure provides encryption-at-rest and TLS in-transit, DPDP Act compliance benefits from **application-level encryption** where PII is unreadable even to database administrators.

## Current PII Fields Requiring Protection

| Table | Column | Sensitivity |
|---|---|---|
| `vendors` | `pan_number` | High |
| `vendors` | `gst_number` | High |
| `vendors` | `cin_number` | Medium |
| `vendors` | `bank_account_number` | High |
| `vendors` | `bank_ifsc` | Medium |
| `vendors` | `primary_mobile` | High |
| `vendors` | `primary_email` | Medium |
| `vendors` | `secondary_mobile` | Medium |
| `vendors` | `nominee_contact` | Medium |
| `profiles` | `phone` | Medium |
| `profiles` | `email` | Medium |

## Proposed Approach: Database-Level Encryption using pgcrypto

Use PostgreSQL's built-in `pgcrypto` extension to encrypt/decrypt PII columns using a server-side encryption key stored in Supabase secrets.

### Part 1: Enable pgcrypto and Create Helper Functions

**Database migration:**

1. Enable `pgcrypto` extension
2. Create two SQL functions:
   - `encrypt_pii(plaintext TEXT)` -- encrypts a value using `pgp_sym_encrypt` with the encryption key from a Supabase secret
   - `decrypt_pii(ciphertext BYTEA)` -- decrypts using `pgp_sym_decrypt`
3. Both functions will be `SECURITY DEFINER` so the encryption key is never exposed to the client

### Part 2: Add Encrypted Columns

For each PII field, add a new `_encrypted` column (BYTEA type) alongside the existing plain text column. This allows a phased migration without breaking existing functionality.

**New columns added to `vendors`:**
- `pan_number_encrypted` (BYTEA)
- `gst_number_encrypted` (BYTEA)
- `bank_account_number_encrypted` (BYTEA)
- `primary_mobile_encrypted` (BYTEA)

### Part 3: Encryption Trigger

Create a trigger on INSERT/UPDATE that automatically encrypts specified columns into their `_encrypted` counterparts and then nullifies the plain text column. This ensures:
- All new data is encrypted automatically
- Existing application code continues to work during migration
- Plain text values are cleared after encryption

### Part 4: Migration of Existing Data

A one-time SQL statement to encrypt all existing plain text PII values into the new encrypted columns and then null out the originals.

### Part 5: Decryption Views

Create a secure database view (`vendors_decrypted`) that:
- Calls `decrypt_pii()` on encrypted columns
- Is accessible only to authenticated users with appropriate RLS
- Is used by the application instead of querying raw tables for PII fields

### Part 6: Application Code Updates

Update hooks and components that read PII fields to use the decrypted view or call decrypt functions:
- `useVendorData.tsx` -- query from `vendors_decrypted` view
- `useVendor.tsx` -- use encrypt on write, decrypt on read
- Edge functions that handle PII (verify-pan, verify-bank-account, etc.) -- decrypt before sending to external APIs

### Part 7: Add Encryption Key Secret

A new secret `PII_ENCRYPTION_KEY` will need to be configured. This is a symmetric key used by pgcrypto for PGP encryption/decryption.

### Part 8: Audit Trail

Add a `pii_access_log` table to record every decryption event, satisfying DPDP Act audit requirements:
- `user_id` -- who accessed the data
- `table_name` -- which table
- `column_name` -- which field
- `accessed_at` -- timestamp
- `purpose` -- why (e.g., "verification", "display")

## Files to Change

| File | Change |
|---|---|
| Database migration | Enable pgcrypto, create encrypt/decrypt functions, add encrypted columns, create trigger, migrate existing data, create decrypted view, create audit log table |
| `src/hooks/useVendorData.tsx` | Query from decrypted view instead of raw table |
| `src/hooks/useVendor.tsx` | Update to work with encryption flow |
| Edge functions (verify-pan, verify-bank-account, etc.) | Decrypt PII before external API calls |
| New secret: `PII_ENCRYPTION_KEY` | Symmetric encryption key for pgcrypto |

## Security Considerations

- The encryption key is stored as a Supabase secret, never exposed to the client
- Decrypt functions are `SECURITY DEFINER` with RLS checks built in
- Audit logging tracks every PII access for compliance reporting
- Encrypted columns use AES-256 via pgcrypto's PGP symmetric encryption
- Plain text columns are nullified after migration, leaving only encrypted data

## What This Demonstrates for DPDP Compliance

1. **Encryption at rest** -- PII is encrypted in the database, not just at the infrastructure level
2. **Access control** -- Only authorized roles can decrypt PII via secure functions
3. **Audit trail** -- Every PII access is logged with user, timestamp, and purpose
4. **Key management** -- Encryption key is stored separately from data in secrets vault
5. **Data minimization** -- Plain text PII is removed after encryption

