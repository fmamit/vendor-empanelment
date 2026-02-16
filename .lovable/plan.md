

# Compact Document Upload UI

## Goal
Make the document upload step fit on one screen without scrolling by compressing the capture buttons and showing a better visual indicator for uploaded documents.

## Changes

### 1. `src/components/vendor/DocumentCapture.tsx`
- Reduce the button padding from `p-6` to `p-3` for a more compact layout
- Shrink icons from `h-8 w-8` to `h-5 w-5`
- When a document is already uploaded (will add a new `uploaded` prop), show a compact success state (filename + green checkmark) instead of the camera/upload buttons
- Reduce the image preview height from `h-48` to `h-24` to save space

### 2. `src/components/referral/DocumentUploadStep.tsx`
- Reduce outer spacing from `space-y-5` to `space-y-3` and card spacing from `space-y-4` to `space-y-3`
- Reduce `CardHeader` padding further (use `py-2 px-3`)
- Reduce `CardContent` padding (use `px-3 pb-3 pt-0`)
- When a document is already uploaded, show a compact row with the filename, a green check icon, and a small "Re-upload" button instead of the full camera/upload grid
- Remove the separate header section ("Upload Documents" title) to save vertical space -- merge it into the subtitle text

### Visual Result
Each document card will be roughly 60-70px tall when capture buttons are shown (vs ~120px+ currently), allowing 3-4 documents to fit on screen without scrolling. Uploaded documents will show a clean, single-line confirmation with a re-upload option.

