

# Display Parsed Document Data Inline on Review Page

## Problem
AI-extracted key data from documents is currently buried inside a multi-step flow: click "View" then switch to "AI Analysis" tab. Staff reviewers cannot see parsed data at a glance on the vendor review page.

## Solution
Show a summary of extracted key fields directly beneath each document card on the VendorReviewDetail page. PII fields remain masked per DPDP policy.

## What Changes

### 1. Update VendorReviewDetail.tsx - Document Cards
For each document in the list, fetch its `document_analyses` record and display extracted fields inline:
- Show 2-3 key extracted fields as compact label-value pairs below the document name
- Show a small confidence badge (e.g., "AI 92%")
- If no analysis exists, show a subtle "Run AI Analysis" link
- PII values displayed in masked form (PAN as `AA***34B`, account numbers as `****6789`)

### 2. Add a Batch Query Hook
Create a `useDocumentAnalysesBatch` hook that fetches all analyses for a vendor's documents in one query (by document IDs), instead of one query per document.

### 3. Visual Layout per Document Card

```text
+--------------------------------------------------+
| Trade License                         Approved    |
|                                                   |
| License No: TL-2024-001234        AI: 94%         |
| Issuing Authority: Municipal Corp                 |
| Valid Until: 2025-12-31                           |
|                                                   |
|              [View]         [check] [x]           |
+--------------------------------------------------+
```

For PII-sensitive documents:
```text
| PAN: AB***78C                     AI: 96%         |
| Name: ACME CORP PVT LTD                          |
```

### 4. No Analysis State
If a document hasn't been analyzed yet, show:
```text
| No parsed data available  [Run AI Analysis]       |
```

## Technical Details

### New hook: `useDocumentAnalysesBatch`
- Query `document_analyses` table filtered by an array of document IDs
- Returns a map of `document_id -> DocumentAnalysis`
- Used in VendorReviewDetail to avoid N+1 queries

### Files Modified
- `src/hooks/useDocumentAnalysis.tsx` -- add `useDocumentAnalysesBatch` hook
- `src/pages/staff/VendorReviewDetail.tsx` -- render extracted fields inline on each document card, add "Run AI Analysis" button per card

### PII Display Rules (unchanged)
- PAN: `AB***78C` (first 2 + last 2)
- Bank Account: `****6789` (last 4 only)
- Mobile: `****8423` (last 4 only)
- GST, names, dates, addresses: shown as-is

