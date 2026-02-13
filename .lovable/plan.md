

# Reports Dashboard Visual Overhaul

## Current State
The Reports page is a plain tab-based layout with raw HTML tables and minimal styling -- no charts, no color-coded metrics, and no visual hierarchy.

## Proposed Design
A modern analytics dashboard with data visualizations, gradient stat cards, and polished data tables -- using Capital India's blue (#0066B3) and green (#7AB648) branding.

### Layout Structure

**Top Section: Summary Metrics Strip**
- 4 gradient stat cards in a horizontal row (Total Vendors, Approved, Pending, Avg TAT)
- Each card has an icon, large number, label, and a subtle percentage/trend indicator
- Cards use branded gradients (blue-to-blue/80, green-to-green/80, amber gradient, etc.)

**Middle Section: Charts Row**
- Left: Donut/Pie chart showing vendor status distribution (using Recharts PieChart)
- Right: Bar chart showing monthly onboarding trends or TAT by vendor (using Recharts BarChart)
- Charts use the Capital India color palette

**Bottom Section: Tabbed Data Tables (retained but enhanced)**
- Keep the existing 3 tabs (Status, TAT, Pending) but with improved table styling
- Alternating row colors, better spacing, colored status badges
- Remove the separate "Summary" tab since its data is now shown visually above

### Visual Enhancements
- Animate stat cards with `animate-fade-in` on load
- Subtle shadow and hover elevation on cards
- Rounded, well-spaced table rows with status-colored badges
- Consistent use of the design system colors (primary, success, warning, destructive)
- Export buttons styled with accent color

---

## Technical Details

### File: `src/pages/staff/StaffReports.tsx` (full rewrite)

**New imports:**
- `PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend` from `recharts`
- `Progress` from UI components

**Summary Cards Section:**
- 4 cards in a `grid grid-cols-2 md:grid-cols-4` layout
- Each card: gradient background, white text, icon, bold metric, subtle label
- Cards: Total Vendors (blue), Approved (green), Pending (amber), Avg TAT (purple/blue)

**Donut Chart (Status Distribution):**
- `PieChart` with `Pie` using `innerRadius` for donut effect
- Custom colors mapped to statuses: approved=green, pending_review=amber, in_verification=blue, rejected=red, sent_back=orange, draft=gray
- Custom legend below the chart

**Bar Chart (TAT Distribution):**
- `BarChart` showing approved vendors with their TAT in days
- Blue bars with rounded corners
- X-axis: vendor codes, Y-axis: days

**Enhanced Tables:**
- Rounded container with `overflow-hidden rounded-xl border`
- Header row with `bg-muted/50` background
- Alternating row backgrounds (`even:bg-muted/20`)
- Status badges with color-coded backgrounds matching the chart colors
- Better padding and typography

**Color mapping constant:**
```text
STATUS_COLORS = {
  draft: "#94a3b8",
  pending_review: "#f59e0b",
  in_verification: "#0066B3",
  pending_approval: "#8b5cf6",
  sent_back: "#f97316",
  approved: "#7AB648",
  rejected: "#ef4444",
}
```

### No other files need modification
This is a self-contained visual upgrade to the single StaffReports page.

