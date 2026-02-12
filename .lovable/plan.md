

## Fix: Staff Login Race Condition

### Problem
After a successful login, the app navigates to `/staff/dashboard`, but the `StaffLayout` guard immediately redirects back to `/staff/login` because `userType` hasn't been determined yet. The `loading` flag turns off before the async user type check completes.

### Solution
Modify the `useAuth` hook so that `loading` only becomes `false` **after** both the session AND the user type have been fully resolved. This eliminates the window where the guard sees an authenticated user with no `userType`.

### Changes

**1. `src/hooks/useAuth.tsx`**
- Keep `loading = true` until the user type check finishes
- In `getSession()`, if a user exists, run `checkUserType` before setting `loading = false`
- In `onAuthStateChange`, trigger a user type check without prematurely ending the loading state
- Add an `isMounted` flag to prevent state updates after unmount

**2. `src/components/layout/StaffLayout.tsx`**
- Add a check: only redirect if `userType` is explicitly determined (not just `null` during loading)
- This is a safety net -- the primary fix is in `useAuth`

### Technical Detail

The current flow:

```text
getSession() -> setUser() -> setLoading(false)
                  |
                  v  (separate useEffect, runs later)
              checkUserType() -> setUserType("staff")
```

The fixed flow:

```text
getSession() -> setUser() -> checkUserType() -> setUserType("staff") -> setLoading(false)
```

This ensures `loading` is only `false` once we know the full auth state including user type.

