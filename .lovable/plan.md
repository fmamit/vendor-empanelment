

# Remove PWA Plugin and Clean Up Caching

## What This Does
Removes the PWA service worker plugin (`vite-plugin-pwa`) that has been causing stale cache issues, where old pages keep appearing even after code updates. The app will still work as a regular web app -- users can still add it to their home screen via browser, but there will be no service worker caching old assets.

## Changes

### 1. Remove PWA plugin from build config (`vite.config.ts`)
- Remove the `VitePWA` import and its entire configuration block
- Remove the `vite-plugin-pwa` dependency from `package.json`

### 2. Keep the cache cleanup code (`src/main.tsx`)
- The existing service worker unregister + cache clear code stays -- this ensures any previously installed service workers from existing users get cleaned up on their next visit

### 3. Clean up `index.html`
- Remove PWA-specific meta tags (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, etc.)
- Remove the manifest link
- Keep standard meta tags (title, description, favicon, viewport)

### 4. Remove PWA-related files
- Delete `public/manifest.json`
- Delete `src/pages/InstallApp.tsx`
- Remove the `/install` route from `src/App.tsx`

### 5. Keep intact
- The icons in `public/icons/` can stay (used for favicon/og:image)
- The favicon link stays

## Technical Notes
- The `vite-plugin-pwa` package will be uninstalled
- The `@types/qrcode` and `qrcode` packages stay (used elsewhere)
- Existing users who have the old service worker will get it automatically unregistered by the cleanup code in `main.tsx`

