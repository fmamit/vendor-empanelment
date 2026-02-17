-- Allow all staff roles to SELECT approved and deactivated vendors
CREATE POLICY "Staff can view approved and deactivated vendors"
ON public.vendors
FOR SELECT
USING (
  is_internal_staff(auth.uid()) 
  AND current_status IN ('approved', 'deactivated')
);

-- Allow admin/approver to update approved/deactivated vendors (for deactivate/reactivate)
CREATE POLICY "Staff can update approved or deactivated vendors"
ON public.vendors
FOR UPDATE
USING (
  (is_admin(auth.uid()) OR has_role(auth.uid(), 'approver'))
  AND current_status IN ('approved', 'deactivated')
);