

# Fix: Clear Stale PWA Cache Showing Old Pages

## Problem

The current `StaffLogin` code is already correct (no header, large logo). However, the PWA service worker has cached an older version of the page and keeps serving it. Even though `skipWaiting` and `clientsClaim` are set to `true`, the browser may still be holding onto a stale precache.

## Solution

Force a cache bust by incrementing the service worker version. This ensures all users get the latest assets on their next visit.

### Changes

1. **Add a cache version identifier to vite.config.ts** -- add a `version` field or a `cacheSuffix` to the Workbox config so the service worker treats all existing caches as stale and re-fetches everything.

2. **Add cleanup logic** -- enable `cleanupOutdatedCaches: true` in the Workbox config so old caches from previous service worker versions are automatically deleted.

3. **Optional: Add a manual cache-clear utility** -- add a small "Clear Cache & Reload" button (visible only to admins or on the login page) as a fallback for stubborn caches.

## Technical Details

In `vite.config.ts`, update the workbox config:

```typescript
workbox: {
  globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
  navigateFallback: '/index.html',
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,  // NEW: auto-delete old caches
},
```

In `src/main.tsx`, add service worker cache-clearing on app startup to force a fresh load:

```typescript
// Unregister old service workers and clear caches on load
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(r => r.unregister());
  });
  caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
  });
}
```

This one-time cleanup code can be removed in a future release once all users have refreshed.

