-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can view category documents" ON public.category_documents;

-- Create a truly public policy (for registration, we need anon access)
CREATE POLICY "Public can view category documents" 
ON public.category_documents 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Also fix document_types if needed
DROP POLICY IF EXISTS "Anyone can view document types" ON public.document_types;

CREATE POLICY "Public can view document types" 
ON public.document_types 
FOR SELECT 
TO anon, authenticated
USING (true);