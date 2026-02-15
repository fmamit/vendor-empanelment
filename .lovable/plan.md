

# Create Test Vendor with Full PII to Verify Encryption

## Approach

Create a temporary edge function `test-pii-encryption` that:
1. Inserts a test vendor with ALL PII fields populated (PAN, GST, CIN, bank account, IFSC, mobile, email, secondary mobile, nominee contact)
2. Reads back the raw row to confirm plain text is masked/nullified and encrypted columns are populated
3. Calls `get_vendor_decrypted` RPC to confirm decryption returns the original values
4. Returns a detailed report showing the encryption status of each field

## Test Data

| Field | Test Value |
|---|---|
| PAN | ABCDE1234F |
| GST | 27ABCDE1234F1Z5 |
| CIN | U12345MH2020PTC123456 |
| Bank Account | 1234567890123 |
| IFSC | SBIN0001234 |
| Primary Mobile | 9876543210 |
| Primary Email | rajesh@testcorp.in |
| Secondary Mobile | 9123456789 |
| Nominee Contact | 9988776655 |

## What Gets Created

| File | Purpose |
|---|---|
| `supabase/functions/test-pii-encryption/index.ts` | Edge function that inserts test vendor, verifies encryption, and returns results |

## Verification Report

The edge function will return a JSON report like:

```text
{
  "test_vendor_id": "...",
  "raw_storage": {
    "pan_number": null,           // plain text cleared
    "pan_number_encrypted": true, // encrypted value exists
    ...
  },
  "decrypted_values": {
    "pan_number": "ABCDE1234F",   // original value recovered
    ...
  },
  "all_fields_encrypted": true,
  "all_fields_decryptable": true
}
```

After verification, the test vendor can be deleted and the edge function removed.

## Technical Details

- Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for the insert
- Calls `get_vendor_decrypted` RPC via service role to test decryption
- Compares decrypted values against original input to confirm round-trip integrity
- No application code changes needed -- this is a standalone test

