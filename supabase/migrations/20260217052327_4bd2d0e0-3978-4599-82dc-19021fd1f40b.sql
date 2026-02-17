
-- Create document_analyses table
CREATE TABLE public.document_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.vendor_documents(id) ON DELETE CASCADE,
  analysis_status TEXT NOT NULL DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
  extracted_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  document_type_detected TEXT,
  classification_confidence INTEGER DEFAULT 0,
  confidence_score INTEGER DEFAULT 0,
  tampering_indicators JSONB NOT NULL DEFAULT '[]'::jsonb,
  tampering_score INTEGER DEFAULT 0,
  ai_model_version TEXT DEFAULT 'gemini-2.5-pro',
  error_message TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups by document
CREATE INDEX idx_document_analyses_document_id ON public.document_analyses(document_id);

-- Enable RLS
ALTER TABLE public.document_analyses ENABLE ROW LEVEL SECURITY;

-- Staff can read analyses for vendors they can access
CREATE POLICY "Staff can view document analyses"
  ON public.document_analyses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_documents vd
      WHERE vd.id = document_analyses.document_id
      AND can_staff_access_vendor(auth.uid(), vd.vendor_id)
    )
  );

-- Admins can manage all analyses
CREATE POLICY "Admins manage all document analyses"
  ON public.document_analyses
  FOR ALL
  USING (is_admin(auth.uid()));

-- Edge function can insert/update (service role bypasses RLS)
-- Vendor users can view analyses for their own documents
CREATE POLICY "Vendor users view own document analyses"
  ON public.document_analyses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_documents vd
      WHERE vd.id = document_analyses.document_id
      AND is_vendor_user(auth.uid())
      AND vd.vendor_id = get_vendor_id(auth.uid())
    )
  );
