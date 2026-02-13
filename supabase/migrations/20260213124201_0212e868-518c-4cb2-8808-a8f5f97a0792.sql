
-- Add new columns to vendors table
ALTER TABLE vendors ADD COLUMN sent_back_reason TEXT;
ALTER TABLE vendors ADD COLUMN salutation TEXT;
ALTER TABLE vendors ADD COLUMN constitution_type TEXT;

-- Allow vendor users to update their own sent_back vendor (for resubmission)
CREATE POLICY "Vendor users can resubmit sent_back vendor"
ON public.vendors
FOR UPDATE
USING (is_vendor_user(auth.uid()) AND id = get_vendor_id(auth.uid()) AND current_status = 'sent_back'::vendor_status);
