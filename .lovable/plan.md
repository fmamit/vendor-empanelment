
# Modify Verification Functions to Use Database Credentials

## Overview

The verification edge functions currently read VerifiedU API credentials from environment variables. Since you mentioned that tokens need to be passed within each API call (stored in the database rather than as secrets), I'll modify the system to follow the same pattern as WhatsApp settings.

## Changes Required

### 1. Create VerifiedU Settings Table

A new `verifiedu_settings` table will store the API credentials:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| api_token | text | VerifiedU API Token |
| company_id | text | VerifiedU Company ID |
| api_base_url | text | API Base URL (default: https://api.verifiedu.in) |
| is_active | boolean | Enable/disable verification |
| created_at | timestamptz | Record creation |
| updated_at | timestamptz | Last update |

RLS Policy: Only admins can read/write this table.

### 2. Add VerifiedU Settings Form

A new tab in Admin Settings page for managing VerifiedU credentials:
- API Token input field
- Company ID input field  
- API Base URL input field (with default value)
- Enable/Disable toggle
- Save button

### 3. Update Edge Functions

Modify all verification edge functions to:
- Read credentials from `verifiedu_settings` table instead of environment variables
- Use Service Role client to read settings (since the table has admin-only RLS)
- Return appropriate error if settings not configured

**Functions to update:**
- `verify-pan/index.ts`
- `verify-bank-account/index.ts`
- `verify-aadhaar-initiate/index.ts`
- `verify-aadhaar-details/index.ts`

### 4. Frontend Integration

Add hook for managing VerifiedU settings:
- `useVerifiedUSettings()` - fetch current settings
- `useUpdateVerifiedUSettings()` - save settings

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/xxx.sql` | Create | Create `verifiedu_settings` table |
| `src/components/admin/VerifiedUSettingsForm.tsx` | Create | Settings form component |
| `src/hooks/useVerifiedUSettings.tsx` | Create | React hooks for settings |
| `src/pages/admin/AdminSettings.tsx` | Modify | Add VerifiedU tab |
| `supabase/functions/verify-pan/index.ts` | Modify | Read from database |
| `supabase/functions/verify-bank-account/index.ts` | Modify | Read from database |
| `supabase/functions/verify-aadhaar-initiate/index.ts` | Modify | Read from database |
| `supabase/functions/verify-aadhaar-details/index.ts` | Modify | Read from database |

## Edge Function Changes

Current code reads from environment:
```typescript
const verifieduToken = Deno.env.get("VERIFIEDU_TOKEN");
const companyId = Deno.env.get("VERIFIEDU_COMPANY_ID");
const baseUrl = Deno.env.get("VERIFIEDU_API_BASE_URL");
```

New code reads from database:
```typescript
const { data: settings, error: settingsError } = await adminClient
  .from("verifiedu_settings")
  .select("*")
  .eq("is_active", true)
  .single();

if (settingsError || !settings) {
  return new Response(JSON.stringify({
    success: false,
    error: "VerifiedU not configured. Please set up credentials in Admin Settings."
  }), { status: 400, headers: corsHeaders });
}

const verifieduToken = settings.api_token;
const companyId = settings.company_id;
const baseUrl = settings.api_base_url;
```

## Admin Settings UI

The new "Verification API" tab will include:

```text
┌─────────────────────────────────────────────────────┐
│ VerifiedU API Settings                              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  API Token:  [____________________________]         │
│                                                     │
│  Company ID: [____________________________]         │
│                                                     │
│  API Base URL: [https://api.verifiedu.in__]         │
│                                                     │
│  [x] Enable VerifiedU Integration                   │
│                                                     │
│  [Save Settings]                                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Security

- VerifiedU credentials stored in database with admin-only RLS
- Edge functions use Service Role to read settings (bypasses RLS)
- Credentials are never exposed to frontend (only admin can see settings form)

## Testing

After implementation:
1. Navigate to Admin Settings → Verification API tab
2. Enter your VerifiedU credentials
3. Enable the integration
4. Test PAN/Bank/Aadhaar verification on a vendor record
