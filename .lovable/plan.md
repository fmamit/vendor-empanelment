

## Fix: Staff Login Spinner Race Condition

### Root Cause
When login succeeds, `StaffEmailLogin` navigates to `/staff/dashboard` immediately. Meanwhile, `onAuthStateChange` fires and defers the `userType` resolution into a `setTimeout`. This creates a window where the dashboard is rendered but `userType` is still `null`, causing `useUserRoles` to stay in a loading state indefinitely.

### Solution
Two changes to eliminate the race condition:

**1. `src/hooks/useAuth.tsx`** - Remove the `setLoading(true)` call from inside the `onAuthStateChange` setTimeout. The initial load already handles setting loading correctly. Re-triggering loading on every auth change causes the dashboard to re-enter a loading state after navigation. The `setTimeout` should only update `userType` quietly without flipping loading back on.

**2. `src/components/auth/StaffEmailLogin.tsx`** - Instead of navigating immediately after `signInWithPassword`, wait briefly or let the `AuthProvider` drive the navigation. However, the simpler fix is just to stop the `onAuthStateChange` from re-setting loading, since `initialize()` already handles the first load correctly.

### Specific Changes

**`src/hooks/useAuth.tsx`** (line 75): Remove `setLoading(true)` from the `setTimeout` block inside `onAuthStateChange`. The block should only update `userType` and `setLoading(false)` when done -- not flip loading back to true mid-session.

Before:
```typescript
setTimeout(async () => {
  if (!isMounted.current) return;
  setLoading(true);  // THIS CAUSES THE BUG
  const type = await determineUserType(session.user.id);
  if (!isMounted.current) return;
  setUserType(type);
  setLoading(false);
}, 0);
```

After:
```typescript
setTimeout(async () => {
  if (!isMounted.current) return;
  const type = await determineUserType(session.user.id);
  if (!isMounted.current) return;
  setUserType(type);
}, 0);
```

This single-line removal fixes the spinner because:
- The initial `initialize()` function correctly sets loading to false after resolving everything
- The `onAuthStateChange` callback only needs to quietly update the user type without re-entering a global loading state
- The dashboard and `useUserRoles` will see `userType` update reactively without being blocked by a loading gate

