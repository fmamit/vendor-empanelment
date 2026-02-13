
## Simplify Auth: Single Linear Process, Remove Stale Listener

### Problem
The current `useAuth` hook uses `onAuthStateChange` listener that awaits a database call inside it, causing deadlocks and the spinning loader. Having two competing processes (the listener + initial load) creates race conditions and complexity.

### Solution
**Completely remove** the `onAuthStateChange` listener approach and replace it with a single, linear initialization process in `src/hooks/useAuth.tsx`:

**New Flow:**
1. Call `supabase.auth.getSession()` to get the current session
2. If a user session exists, call `await determineUserType()`
3. Set all state (user, session, userType) together
4. Set `loading = false`
5. Clean up on unmount

**Removal:**
- Delete the entire `onAuthStateChange` subscription and listener
- Delete the `isMounted` ref (no longer needed)
- Delete the subscription cleanup logic in the return statement

**Result:**
- One single, sequential flow with no competing processes
- No database calls inside restricted auth callbacks
- No deadlocks
- Fast login completion

This is a clean rewrite of the useEffect hook to be straightforward and reliable.
