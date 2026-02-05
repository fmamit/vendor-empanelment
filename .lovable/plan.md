
# Simplify VerifiedU Integration - Remove Credentials Page

## Overview

The current implementation unnecessarily stores VerifiedU API credentials in a database table with an admin settings page. You've clarified that the credentials should be hardcoded directly in the edge functions.

## Changes Required

### 1. Remove Unnecessary Components

The following files/components that were created are not needed and will be removed:

| File | Action |
|------|--------|
| `src/components/admin/VerifiedUSettingsForm.tsx` | Delete |
| `src/hooks/useVerifiedUSettings.tsx` | Delete |
| `verifiedu_settings` table | Remove from database |

### 2. Update Admin Settings Page

Remove the "Verification API" tab from `src/pages/admin/AdminSettings.tsx` since credential management is not needed.

### 3. Update Edge Functions

Modify all four verification edge functions to use hardcoded credentials instead of fetching from the database:

**Files to update:**
- `supabase/functions/verify-pan/index.ts`
- `supabase/functions/verify-bank-account/index.ts`
- `supabase/functions/verify-aadhaar-initiate/index.ts`
- `supabase/functions/verify-aadhaar-details/index.ts`

**Before (database lookup):**
```typescript
const { data: settings } = await adminClient
  .from("verifiedu_settings")
  .select("*")
  .eq("is_active", true)
  .maybeSingle();

const verifieduToken = settings?.api_token;
const companyId = settings?.company_id;
const baseUrl = settings?.api_base_url;
```

**After (hardcoded):**
```typescript
const verifieduToken = "YOUR_API_TOKEN_HERE";
const companyId = "YOUR_COMPANY_ID_HERE";
const baseUrl = "https://api.verifiedu.in";
```

### 4. Database Cleanup

Drop the `verifiedu_settings` table that was created:

```sql
DROP TABLE IF EXISTS public.verifiedu_settings;
```

## Summary

This simplification:
- Removes the admin settings form and tab
- Removes the React hooks for settings management
- Hardcodes credentials directly in edge functions
- Drops the unnecessary database table

## What You'll Need to Provide

Once I implement this, you'll need to give me the actual VerifiedU credentials to hardcode:
- API Token
- Company ID
- API Base URL (if different from https://api.verifiedu.in)
