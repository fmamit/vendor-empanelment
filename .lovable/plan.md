

## Fix: Vendor Registration Link Using Wrong URL

### Problem
The registration link shared with vendors points to the Lovable preview/editor URL (e.g., `https://id-preview--xxx.lovable.app`), which is private. Vendors see "Access denied" because they don't have access to the Lovable project.

### Solution
Hardcode the published app URL (`https://onboardly-path.lovable.app`) as the base for all vendor-facing registration links.

### Files to Change

**1. `src/components/staff/ReferralLinkCard.tsx` (line 19-21)**
- Replace `window.location.origin` with the published URL
- Change: `const referralUrl = referralCode ? \`https://onboardly-path.lovable.app/register/ref/\${referralCode}\` : "";`

**2. `supabase/functions/send-vendor-invitation/index.ts` (line 96-97)**
- Replace the dynamic origin with the published URL
- Change: `const registrationUrl = \`https://onboardly-path.lovable.app\${registrationPath}\`;`
- Remove the unused `origin` header lookup

### Why This Fix Works
The published URL is the public-facing domain accessible to anyone. Preview URLs are only accessible to project collaborators within Lovable.

