

## Fix: Azure Static Web Apps SPA Fallback Routing

### Problem
The referral URL `civ.in-sync.co.in/register/ref/REF-8AF65A17` returns a **404 from Azure Static Web Apps** because there is no server-side fallback rule telling Azure to serve `index.html` for all client-side routes. The React route `/register/ref/:token` is correctly defined in `App.tsx`, but Azure never gets to serve it.

### Solution
Create a `staticwebapp.config.json` file in the `public/` folder (so it gets copied to the build output). This file tells Azure to redirect all unmatched routes to `index.html`, enabling SPA client-side routing.

### Technical Details

**File to create:** `public/staticwebapp.config.json`

Contents:
```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*", "/*.ico", "/*.png", "/*.svg", "/*.js", "/*.css"]
  }
}
```

This single config change will:
- Route all non-file requests (like `/register/ref/REF-8AF65A17`) to `index.html`
- Exclude actual static assets from the fallback so they load normally
- Fix the 404 for all deep links (referral, vendor dashboard, admin pages, etc.)

No other code changes are needed. After publishing, the referral links will work correctly.

