

# Implement AI-Powered Document Parsing with PII Protection

## Overview
Replace the current mock document analysis system with real AI-powered document parsing using Lovable AI (Gemini). When a document is uploaded or reviewed, the system will use AI to extract key fields (GST number, PAN, bank details, names, dates) and display them -- while masking PII fields per your DPDP compliance policy.

## What Changes

### 1. New Database Table: `document_analyses`
Store real AI analysis results linked to each document:
- `document_id` (FK to vendor_documents)
- `analysis_status` (pending/processing/completed/failed)
- `extracted_data` (JSONB -- array of extracted fields with confidence scores)
- `document_type_detected` (string)
- `classification_confidence` (integer)
- `confidence_score` (integer)
- `tampering_indicators` (JSONB array)
- `tampering_score` (integer)
- `ai_model_version` (string)
- `analyzed_at` (timestamp)

### 2. New Edge Function: `analyze-document`
- Accepts a `document_id`, fetches the document file URL from `vendor_documents`
- Sends the document image/PDF to Lovable AI (Gemini 2.5 Pro -- best for image+text reasoning) with a structured prompt to:
  - Auto-detect document type (GST Certificate, PAN Card, Cancelled Cheque, Trade License, etc.)
  - Extract key fields (e.g., GSTIN, PAN, legal name, registration date, account number, IFSC)
  - Assess tampering indicators (metadata anomalies, font inconsistencies)
  - Return confidence scores per field
- Uses tool calling to get structured JSON output
- Saves results to `document_analyses` table
- PII fields (PAN, account numbers, mobile) are stored as masked values in the extracted_data; only non-sensitive summaries are persisted

### 3. Fix Build Errors
- Fix the `error` is of type `unknown` TypeScript errors in `verify-pan` and `verify-bank-account` edge functions by casting to `Error`

### 4. Update `useDocumentAnalysis` Hook
- Replace mock data with real queries to `document_analyses` table
- Add a `triggerAnalysis` mutation that calls the `analyze-document` edge function

### 5. Update `AIAnalysisPanel` Component
- Display real extracted data from the database
- Mask PII fields in the UI: PAN shows as `AXXXX1234X`, account numbers show last 4 digits only, mobile numbers show `****XXXX`
- Keep confidence scores, tampering indicators, and document classification visible

### 6. Update `DocumentViewer` Component
- Add a "Run AI Analysis" button on the Analysis tab when no analysis exists yet
- Show real analysis results when available

### 7. PII Protection Strategy
Following your existing encryption architecture:
- The AI extracts full values but **only masked versions** are stored in the `extracted_data` JSONB
- Full extracted values are never persisted in plain text
- PII masking function applied before database insert:
  - PAN: first 2 + last 2 visible (e.g., `AA***34B`)
  - Bank Account: last 4 digits only (e.g., `****6789`)
  - Mobile: last 4 digits (e.g., `****8423`)
  - GST: full value shown (not PII -- it's a public registration number)
  - Names, dates, addresses: shown as-is (needed for cross-validation)

## Technical Details

### Edge Function: `analyze-document`
```text
POST /functions/v1/analyze-document
Body: { document_id: string }

Flow:
1. Fetch document record + file URL from vendor_documents
2. Download the file (image/PDF)
3. Send to Lovable AI Gateway with vision prompt
4. Parse structured response via tool calling
5. Mask PII in extracted fields
6. Insert into document_analyses table
7. Return analysis result
```

### AI Prompt Strategy
- System prompt instructs the model to identify document type and extract fields
- Uses tool calling for structured output (field_name, value, confidence)
- Document image sent as base64 in the user message

### Database Migration
- Create `document_analyses` table with RLS policies (staff-only read/write)
- Add index on `document_id` for fast lookups

### Files Modified
- `supabase/functions/verify-pan/index.ts` -- fix TypeScript error
- `supabase/functions/verify-bank-account/index.ts` -- fix TypeScript error
- `src/hooks/useDocumentAnalysis.tsx` -- replace mock with real DB queries + trigger mutation
- `src/components/documents/AIAnalysisPanel.tsx` -- add PII masking display logic
- `src/components/documents/DocumentViewer.tsx` -- add "Run Analysis" button

### New Files
- `supabase/functions/analyze-document/index.ts` -- AI document parsing edge function

