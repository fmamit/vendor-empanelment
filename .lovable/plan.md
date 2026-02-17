

# Auto-Run AI Parsing on Document Upload

## Problem
Currently, staff must manually click "Run AI Analysis" on each document. The user wants a zero-click experience: upload a document and see parsed results automatically.

## Solution

### 1. Trigger Analysis Automatically After Upload (Backend)

Modify the `upload-referral-document` edge function so that after a document is successfully inserted into `vendor_documents`, it fires a background call to the `analyze-document` function. This means every uploaded document gets analyzed immediately.

- After the `vendor_documents` insert succeeds, make an internal fetch to the `analyze-document` edge function with the new document's ID
- Use a fire-and-forget pattern (don't await the full AI response) so the upload response returns quickly to the user
- If the vendor isn't created yet (referral flow without `vendorId`), skip auto-analysis since there's no `vendor_documents` row

### 2. Auto-Poll for Results on the Review Page (Frontend)

Update the `useDocumentAnalysesBatch` hook to poll every 5 seconds while any document has a "processing" or missing analysis status. This way, when staff opens the review page, results appear automatically as they complete.

### 3. Remove Manual "Run AI Analysis" Button

In `VendorReviewDetail.tsx`, replace the "No parsed data available / Run AI Analysis" section with an "Analyzing..." spinner state. Since analysis is triggered automatically, no manual button is needed.

- If a document somehow has no analysis (edge case), show "Analysis pending..." instead of a button
- Keep the analyzing spinner for documents currently being processed

## Technical Details

### Files Modified

**`supabase/functions/upload-referral-document/index.ts`**
- After the `vendor_documents` insert (line 141-148), add a fire-and-forget call:
  ```
  // Fire-and-forget: trigger AI analysis
  const docRecord = insertResult (get the new doc ID)
  fetch(`${supabaseUrl}/functions/v1/analyze-document`, {
    method: "POST",
    headers: { Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: docRecord.id })
  }).catch(err => console.error("Auto-analysis trigger failed:", err));
  ```

**`src/hooks/useDocumentAnalysis.tsx`**
- Add `refetchInterval` to `useDocumentAnalysesBatch`: poll every 5 seconds if any document in the batch has status "processing" or is missing from the map

**`src/pages/staff/VendorReviewDetail.tsx`**
- Remove the "Run AI Analysis" button block
- Remove the `handleRunAnalysis` function and `analyzingDocId` state
- Show "Analysis pending..." for documents without analysis results yet
- Keep the spinner for documents with `analysis_status === "processing"`

