
# Fix Document Viewing (404) and Auto-Analysis Trigger

## Root Causes

1. **View 404**: Referral documents store a storage path (e.g., `referral/.../file.pdf`) as `file_url`, not a full URL. The View button opens this path directly, which is not a valid URL.
2. **Analysis never triggered**: Documents created via `submit-vendor-referral` (batch insert) have no auto-analysis trigger. Only `upload-referral-document` had the fire-and-forget call, but the referral flow creates documents in `submit-vendor-referral`.
3. **analyze-document would fail anyway**: It does `fetch(doc.file_url)` on a storage path instead of generating a signed URL first.

## Solution

### 1. Fix analyze-document to use signed URLs (Backend)

In `supabase/functions/analyze-document/index.ts`, replace the direct `fetch(doc.file_url)` with a Supabase Storage signed URL:

```
// Instead of: fetch(doc.file_url)
const { data: signedData } = await supabase.storage
  .from("vendor-documents")
  .createSignedUrl(doc.file_url, 300); // 5 min expiry
const fileResponse = await fetch(signedData.signedUrl);
```

This handles both cases: storage paths from referrals and full URLs from self-uploads.

### 2. Add auto-analysis trigger to submit-vendor-referral (Backend)

In `supabase/functions/submit-vendor-referral/index.ts`, after the batch document insert (line 184), use `.select("id")` on the insert and fire-and-forget calls to `analyze-document` for each inserted document.

### 3. Fix View button to use signed URLs (Frontend)

In `src/pages/staff/VendorReviewDetail.tsx`, instead of `window.open(doc.file_url)`, detect if the URL is a storage path (doesn't start with `http`) and generate a signed URL via `supabase.storage.from("vendor-documents").createSignedUrl(...)` before opening.

Also fix `DocumentViewer.tsx` similarly since it also uses `doc.file_url` directly for `<img src>` and download links.

### 4. Fix upload-referral-document to also handle the file_url properly

The `file_url` stored should remain as the storage path (it's the canonical reference). The signed URL generation happens on-demand when viewing or analyzing.

## Files Modified

- **`supabase/functions/analyze-document/index.ts`** -- Generate signed URL from storage path before downloading the file
- **`supabase/functions/submit-vendor-referral/index.ts`** -- Add fire-and-forget auto-analysis calls after batch document insert
- **`src/pages/staff/VendorReviewDetail.tsx`** -- Generate signed URL for View button when file_url is a storage path
- **`src/components/documents/DocumentViewer.tsx`** -- Generate signed URLs for image display and download links

## Technical Details

### Signed URL Generation Pattern (Frontend)
```typescript
const openDocument = async (fileUrl: string) => {
  if (fileUrl.startsWith("http")) {
    window.open(fileUrl, "_blank");
  } else {
    const { data } = await supabase.storage
      .from("vendor-documents")
      .createSignedUrl(fileUrl, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }
};
```

### Auto-Analysis in submit-vendor-referral
```typescript
const { data: insertedDocs } = await supabase
  .from("vendor_documents")
  .insert(docRows)
  .select("id");

// Fire-and-forget for each document
if (insertedDocs) {
  for (const doc of insertedDocs) {
    fetch(`${supabaseUrl}/functions/v1/analyze-document`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ document_id: doc.id }),
    }).catch(err => console.error("Auto-analysis failed:", err));
  }
}
```
