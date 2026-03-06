-- Seed document types
INSERT INTO public.document_types (name, description, has_expiry, accepted_formats, max_file_size_mb) VALUES
  ('GST Registration Certificate', 'GST registration certificate issued by GSTN', false, ARRAY['pdf','jpg','jpeg','png'], 5),
  ('PAN Card', 'Permanent Account Number card', false, ARRAY['pdf','jpg','jpeg','png'], 5),
  ('Certificate of Incorporation', 'Company incorporation certificate from MCA', false, ARRAY['pdf'], 5),
  ('Cancelled Cheque', 'Cancelled cheque or bank verification letter', false, ARRAY['pdf','jpg','jpeg','png'], 5),
  ('Trade License', 'Municipal trade/business license', true, ARRAY['pdf','jpg','jpeg','png'], 5),
  ('MSME Certificate', 'MSME/Udyam registration certificate', true, ARRAY['pdf','jpg','jpeg','png'], 5),
  ('Board Resolution', 'Board resolution authorizing signatory', false, ARRAY['pdf'], 5),
  ('Company Profile', 'Company profile or capability statement', false, ARRAY['pdf'], 5)
ON CONFLICT (name) DO NOTHING;

-- Link document types to all categories
INSERT INTO public.category_documents (category_id, document_type_id, is_mandatory, display_order)
SELECT
  vc.id AS category_id,
  dt.id AS document_type_id,
  CASE
    WHEN dt.name IN ('GST Registration Certificate', 'PAN Card', 'Certificate of Incorporation', 'Cancelled Cheque') THEN true
    ELSE false
  END AS is_mandatory,
  CASE dt.name
    WHEN 'GST Registration Certificate' THEN 1
    WHEN 'PAN Card' THEN 2
    WHEN 'Certificate of Incorporation' THEN 3
    WHEN 'Cancelled Cheque' THEN 4
    WHEN 'Trade License' THEN 5
    WHEN 'MSME Certificate' THEN 6
    WHEN 'Board Resolution' THEN 7
    WHEN 'Company Profile' THEN 8
  END AS display_order
FROM public.vendor_categories vc
CROSS JOIN public.document_types dt
ON CONFLICT (category_id, document_type_id) DO NOTHING;

-- Allow anon (public registration form) to read document types and category docs
CREATE POLICY "Anon can view document types"
  ON public.document_types FOR SELECT TO anon
  USING (true);

CREATE POLICY "Anon can view category documents"
  ON public.category_documents FOR SELECT TO anon
  USING (true);
