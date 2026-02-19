
# Replace Logo Across the Application

## Overview
Replace the current Capital India logo (`capital-india-logo.jpg`) with the new uploaded logo (`CI.webp`) throughout the application.

## Changes

### 1. Copy the new logo
Copy `user-uploads://CI.webp` to `src/assets/capital-india-logo.webp`

### 2. Update imports in 4 files
Update the import path from `capital-india-logo.jpg` to `capital-india-logo.webp` in:
- `src/components/referral/ReferralHeader.tsx`
- `src/components/layout/StaffSidebar.tsx`
- `src/components/layout/MobileLayout.tsx`
- `src/pages/staff/StaffLogin.tsx`

No other changes needed -- the variable name `capitalIndiaLogo` stays the same, so all usages continue to work.
