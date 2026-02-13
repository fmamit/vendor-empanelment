
## Make Staff Login the Home Page with Prominent Logo

### Changes

**1. `src/App.tsx`** - Change the root route (`/`) to render `StaffLogin` instead of `Index`

**2. `src/pages/staff/StaffLogin.tsx`** - Replace the small Users icon with the Capital India logo (already available at `src/assets/capital-india-logo.jpg`), making it larger and more prominent. The logo will be displayed at roughly 80px height with a white background and rounded corners, similar to how it appears on the current Index page.

**3. `src/pages/Index.tsx`** - No changes needed; it will just no longer be the home page route. The `/staff/login` route will also still work as an alias.

### Result
- Visiting `/` will show the Staff Login page directly
- The Capital India logo will replace the generic Users icon in the login card
- The logo will be large and visually prominent as the first thing users see
