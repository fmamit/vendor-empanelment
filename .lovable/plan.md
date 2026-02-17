

# Approved Vendors Management Page

## Overview
Add a new "Approved Vendors" page accessible from the left sidebar. It lists all vendors with `current_status = 'approved'`, showing key details and approval date. Each vendor row has Edit and Deactivate options.

## What You'll Get
- A new "Approved Vendors" item in the left sidebar menu (under Main section)
- A page showing a table/list of approved vendors with:
  - Company name, vendor code, PAN, contact name, phone, email
  - Date approved
  - Edit button (navigates to existing vendor detail page)
  - Deactivate button (sets vendor status to a new "deactivated" status, with confirmation dialog)

## Technical Details

### 1. Database Migration
Add `deactivated` to the `vendor_status` enum so vendors can be marked inactive:
```sql
ALTER TYPE vendor_status ADD VALUE 'deactivated';
```

### 2. New Page: `src/pages/staff/ApprovedVendors.tsx`
- Uses `StaffLayout` with title "Approved Vendors"
- Fetches vendors where `current_status = 'approved'` (and optionally shows deactivated ones with a toggle)
- Displays a table with columns: Vendor Code, Company Name, Contact, Email, Approved Date, Actions
- Edit button navigates to `/staff/vendor/:vendorId`
- Deactivate button opens a confirmation dialog, then updates `current_status` to `deactivated`
- Search/filter input to find vendors by name or code

### 3. Update Sidebar: `src/components/layout/StaffSidebar.tsx`
Add a new menu item in `mainItems`:
```
{ title: "Approved Vendors", url: "/staff/approved-vendors", icon: CheckCircle2 }
```

### 4. Update Router: `src/App.tsx`
Add route:
```
<Route path="/staff/approved-vendors" element={<ApprovedVendors />} />
```

### 5. Files Modified/Created
- **New**: `src/pages/staff/ApprovedVendors.tsx` -- The main page component
- **Edit**: `src/components/layout/StaffSidebar.tsx` -- Add sidebar link
- **Edit**: `src/App.tsx` -- Add route
- **Migration**: Add `deactivated` to `vendor_status` enum

