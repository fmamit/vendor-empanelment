

## Fix: Expose refreshAuth() Instead of Adding Back Listener

### Problem
Without `onAuthStateChange`, the auth state doesn't update after login because the `useEffect` only runs once on mount. But adding the listener back risks reintroducing competing processes.

### Solution
Keep the single-process approach. Expose a `refreshAuth()` function from `useAuth` that re-runs the same initialization logic. The login page calls it after successful sign-in.

### Changes

**1. `src/hooks/useAuth.tsx`**
- Add a `refreshAuth` async function that calls `getSession()`, then `determineUserType()`, and updates state
- Expose `refreshAuth` in the context value
- No listener, no competing process -- auth state only updates when explicitly asked

**2. `src/components/auth/StaffEmailLogin.tsx`**
- Import `useAuth` and call `refreshAuth()` after successful `signInWithPassword`
- This ensures the auth context has the correct user/session/userType before navigating to the dashboard

**3. `src/components/auth/VendorPhoneLogin.tsx`** (if it exists with similar pattern)
- Same change: call `refreshAuth()` after successful OTP verification

### Flow

```text
Login page:
  1. signInWithPassword() -> success
  2. await refreshAuth()   -> updates user, session, userType
  3. navigate("/staff/dashboard")

Dashboard:
  - useAuth() already has correct state
  - No spinner, no waiting
```

### Why This Is Better
- Still a single process: auth state only changes when you explicitly call `refreshAuth()`
- No `onAuthStateChange` listener, no competing processes, no deadlocks
- Login completes fast because the refresh happens inline before navigation
