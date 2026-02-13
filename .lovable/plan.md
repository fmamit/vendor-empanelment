

## Fix: Stale Cache from PWA Service Worker

### Problem
The PWA service worker (via `vite-plugin-pwa`) is configured with runtime caching that intercepts and caches **all Supabase API calls** for up to 1 hour. This means:
- After a mutation updates data, subsequent fetches may return the cached (old) response instead of fresh data
- Published app assets (JS/CSS/HTML) are also aggressively cached, so code updates may not appear immediately
- This doesn't happen in other projects because they likely don't have this Supabase runtime caching rule

### Solution
Remove the Supabase runtime caching rule from the Workbox config. API calls should never be cached by the service worker -- React Query already handles client-side caching with proper invalidation.

### Changes

**File: `vite.config.ts`**
- Remove the entire `runtimeCaching` array that caches Supabase API responses
- Keep the rest of the PWA config (navigateFallback, globPatterns for static assets, devOptions)

The updated workbox section will look like:
```text
workbox: {
  globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
  navigateFallback: '/index.html',
},
```

### Why This Fixes It
- React Query manages data caching at the application level with proper invalidation on mutations
- The service worker was adding a second, uncoordinated caching layer that could override React Query's fresh data with stale cached responses
- Static assets will still be cached (which is fine for PWA offline support), but API data will always come fresh from the server

### After the Fix
Users on the published app who have the old service worker will need to:
- Close all tabs of the app and reopen, OR
- Clear site data in browser settings

The `autoUpdate` registration type will automatically replace the old service worker on the next visit.

