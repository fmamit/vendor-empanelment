

# Add Help Widget Script to index.html

## What This Does
Adds the Go-in-Sync help widget script to the application so it loads on every page.

## Changes

### File: `index.html`
Add the script tag just before the closing `</body>` tag, after the existing module script:

```html
<script src="https://go-in-sync.lovable.app/help-widget.js" data-source="vendor_gateway"></script>
```

This ensures the widget loads on all pages of the application.

