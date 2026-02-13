

## Fix: Staff Profile 404 (Stale PWA Cache)

### Root Cause
The PWA service worker (enabled even in dev via `devOptions: { enabled: true }`) is serving a cached older JS bundle that doesn't include the `/staff/profile` route. When the router runs against that stale bundle, it falls through to the `*` catch-all and shows the NotFound component.

The workbox configuration is also missing `navigateFallback: '/index.html'`, which means the service worker may not properly handle SPA client-side navigation for routes it hasn't seen before.

### Changes

**1. `vite.config.ts`** - Add `navigateFallback` to workbox config so the service worker correctly serves `index.html` for all client-side routes:

```typescript
workbox: {
  globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
  navigateFallback: '/index.html',
  runtimeCaching: [
    // ... existing config
  ],
},
```

**2. Disable PWA in dev mode** - Remove `devOptions: { enabled: true }` to prevent the service worker from interfering during development. The service worker caching makes dev unreliable and is the likely cause of the stale bundle issue:

```typescript
devOptions: {
  enabled: false,
},
```

### After Deployment
The user should hard-refresh or clear the site's service worker cache in their browser to pick up the latest bundle. Going forward, `navigateFallback` ensures new routes are handled correctly by the SPA.

