
# Complete Fix for Staff Login Redirect Issue

## Root Cause Summary

Three interconnected issues are causing the login to fail:

1. **Circular redirect loop**: `StaffDashboard` redirects to login when `userType !== "staff"`, but `userType` is determined asynchronously
2. **Race condition**: After login, `user` is set immediately but `userType` takes time to be determined via database query
3. **Missing loading state**: No way to know if `userType` is "still loading" vs "definitively null"

## Solution Architecture

```text
+------------------+     +-----------------+     +------------------+
|  Login Success   | --> |  useAuth Hook   | --> |  StaffDashboard  |
+------------------+     +-----------------+     +------------------+
                               |
                    Add: userTypeLoading state
                               |
                    Fix: Wait for userType before
                         allowing protected routes
```

## Implementation

### Step 1: Add userTypeLoading State to useAuth Hook

**File**: `src/hooks/useAuth.tsx`

Add a new state variable `userTypeLoading` that tracks whether the userType determination is in progress:

- Add `userTypeLoading` state initialized to `false`
- Set it to `true` when user changes and we need to determine type
- Set it to `false` after the profile/vendor check completes
- Export `userTypeLoading` in the context

### Step 2: Fix StaffDashboard Protection Logic

**File**: `src/pages/staff/StaffDashboard.tsx`

Modify the redirect logic to wait for `userTypeLoading` to complete:

- Import `userTypeLoading` from `useAuth`
- Update the loading check to include `userTypeLoading`
- Only redirect when we're sure userType is definitively not "staff"

### Step 3: Fix StaffLogin Redirect Logic

**File**: `src/pages/staff/StaffLogin.tsx`

The login page should also wait for userType to be determined before redirecting:

- Import `userTypeLoading` from `useAuth`
- Wait for both `loading` AND `userTypeLoading` to be false before redirecting
- This prevents premature rendering of the login form

### Step 4: Remove Console Logs

**File**: `src/hooks/useAuth.tsx`

Remove the debug console.log statements that were added previously.

## Technical Details

### Changes to useAuth.tsx

```typescript
// Add new state
const [userTypeLoading, setUserTypeLoading] = useState(false);

// In the userType determination useEffect:
useEffect(() => {
  if (isTestMode) {
    setUserType("vendor");
    return;
  }

  if (!user) {
    setUserType(null);
    setUserTypeLoading(false);
    return;
  }

  // Start loading
  setUserTypeLoading(true);
  
  const checkUserType = async () => {
    try {
      // Check staff profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        setUserType("staff");
        return;
      }

      // Check vendor
      const { data: vendorUser } = await supabase
        .from("vendor_users")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (vendorUser) {
        setUserType("vendor");
        return;
      }

      setUserType(null);
    } finally {
      setUserTypeLoading(false);
    }
  };

  checkUserType();
}, [user, isTestMode]);

// Update context value
<AuthContext.Provider value={{ 
  user, session, userType, loading, 
  userTypeLoading,  // NEW
  isTestMode, signOut, setTestMode 
}}>
```

### Changes to StaffDashboard.tsx

```typescript
const { user, userType, loading, userTypeLoading } = useAuth();

useEffect(() => {
  // Wait for both auth loading AND userType loading to complete
  if (!loading && !userTypeLoading && (!user || userType !== "staff")) {
    navigate("/staff/login");
  }
}, [user, userType, loading, userTypeLoading, navigate]);

// Show loading while either is loading
if (loading || userTypeLoading || rolesLoading) {
  return (
    <StaffLayout title="Dashboard">
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </StaffLayout>
  );
}
```

### Changes to StaffLogin.tsx

```typescript
const { user, loading, userTypeLoading } = useAuth();

useEffect(() => {
  // Only redirect after we're sure userType is determined
  if (!loading && !userTypeLoading && user) {
    navigate("/staff/dashboard", { replace: true });
  }
}, [user, loading, userTypeLoading, navigate]);

// Show loading while checking auth
if (loading || userTypeLoading) {
  return (
    <MobileLayout title="Staff Login">
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </MobileLayout>
  );
}
```

## Files to Modify

1. `src/hooks/useAuth.tsx` - Add userTypeLoading state and export it
2. `src/pages/staff/StaffDashboard.tsx` - Wait for userTypeLoading before redirect
3. `src/pages/staff/StaffLogin.tsx` - Wait for userTypeLoading before redirect

## Why This Works

1. After login, `user` is set
2. `userTypeLoading` becomes `true`
3. `StaffLogin` shows loading spinner (doesn't render form)
4. Navigate to dashboard called
5. `StaffDashboard` shows loading spinner (waits for userTypeLoading)
6. Profile query completes, `userType` = "staff"
7. `userTypeLoading` becomes `false`
8. Dashboard renders correctly (no redirect back to login)
