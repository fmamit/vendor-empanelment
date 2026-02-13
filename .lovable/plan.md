

## Simplify Auth: Single Process Instead of Two

### Problem
`useAuth.tsx` has two competing processes that both resolve the session and user type:
1. `initialize()` -- manually calls `getSession()` then `determineUserType`
2. `onAuthStateChange` listener -- fires on mount AND on every auth event, also calls `determineUserType`

Both run on mount, creating race conditions and redundant database queries.

### Solution
Remove `initialize()` entirely. Move all logic into `onAuthStateChange`, which is the recommended single source of truth. It fires immediately with the current session when first subscribed, so a separate `getSession()` call is unnecessary.

### Changes to `src/hooks/useAuth.tsx`

- **Remove** the `initialize()` function and its call (lines 47-63)
- **Update** `onAuthStateChange` to handle loading state: set `loading` to `false` after resolving `userType` (or immediately if no session)
- Remove the `setTimeout` wrapper -- the deadlock it was avoiding was caused by the two-process conflict itself

Result:

```typescript
useEffect(() => {
  isMounted.current = true;

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      if (!isMounted.current) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const type = await determineUserType(session.user.id);
        if (!isMounted.current) return;
        setUserType(type);
      } else {
        setUserType(null);
      }

      setLoading(false);
    }
  );

  return () => {
    isMounted.current = false;
    subscription.unsubscribe();
  };
}, []);
```

This is cleaner, has one code path, and eliminates all race conditions.
