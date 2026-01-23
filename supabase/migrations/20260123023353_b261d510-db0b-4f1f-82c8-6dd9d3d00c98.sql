-- Create storage bucket for vendor documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-documents',
  'vendor-documents', 
  false,
  5242880, -- 5MB
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
);

-- Storage policies for vendor documents
CREATE POLICY "Vendors can upload their own documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'vendor-documents' 
  AND (storage.foldername(name))[1] = public.get_vendor_id(auth.uid())::text
);

CREATE POLICY "Vendors can view their own documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'vendor-documents' 
  AND (
    (storage.foldername(name))[1] = public.get_vendor_id(auth.uid())::text
    OR public.is_internal_staff(auth.uid())
  )
);

CREATE POLICY "Vendors can update their own documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'vendor-documents' 
  AND (storage.foldername(name))[1] = public.get_vendor_id(auth.uid())::text
);

CREATE POLICY "Vendors can delete their own documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'vendor-documents' 
  AND (storage.foldername(name))[1] = public.get_vendor_id(auth.uid())::text
);

CREATE POLICY "Staff can view all vendor documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'vendor-documents' 
  AND public.is_internal_staff(auth.uid())
);

-- Link categories to document types
INSERT INTO public.category_documents (category_id, document_type_id, is_mandatory, display_order)
SELECT 
  vc.id as category_id,
  dt.id as document_type_id,
  CASE 
    WHEN dt.name IN ('GST Registration Certificate', 'PAN Card', 'Certificate of Incorporation', 'Cancelled Cheque') THEN true
    ELSE false
  END as is_mandatory,
  CASE dt.name
    WHEN 'GST Registration Certificate' THEN 1
    WHEN 'PAN Card' THEN 2
    WHEN 'Certificate of Incorporation' THEN 3
    WHEN 'Cancelled Cheque' THEN 4
    WHEN 'Trade License' THEN 5
    WHEN 'MSME Certificate' THEN 6
    WHEN 'Board Resolution' THEN 7
    WHEN 'Company Profile' THEN 8
  END as display_order
FROM public.vendor_categories vc
CROSS JOIN public.document_types dt;