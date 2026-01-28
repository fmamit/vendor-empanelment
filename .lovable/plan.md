
# Fix Login Redirect Race Condition

## Problem Identified
There are two competing navigation mechanisms causing a race condition:

1. **StaffEmailLogin.tsx** calls `navigate("/staff/dashboard")` immediately after successful authentication
2. **StaffLogin.tsx** has a `useEffect` that watches `user` from `useAuth()` and also tries to redirect

When login succeeds:
- `StaffEmailLogin` navigates immediately
- But `useAuth()` hasn't updated its state yet (async auth listener)
- React re-renders `StaffLogin` which may show the form briefly
- The navigation gets interrupted or "lost"

## Solution
Remove the navigation from `StaffEmailLogin.tsx` and let the `useEffect` in `StaffLogin.tsx` handle ALL redirects. This ensures a single source of truth for navigation based on auth state.

---

## Implementation

### File: `src/components/auth/StaffEmailLogin.tsx`

**Change**: Remove the `navigate` call after successful login. Let the parent component handle redirect based on auth state change.

```typescript
// REMOVE these lines:
import { useNavigate } from "react-router-dom";
const navigate = useNavigate();
navigate("/staff/dashboard");

// KEEP: Just show success toast, auth state change will trigger redirect
toast.success("Login successful!");
```

---

## Why This Works

After this change:
1. User submits login form
2. Supabase authenticates → session created
3. `onAuthStateChange` fires in `useAuth()`
4. `user` state updates in context
5. `StaffLogin`'s `useEffect` detects `!loading && user` → navigates to dashboard

Single navigation path = no race condition.
