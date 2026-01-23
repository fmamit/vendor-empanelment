-- Fix the notifications INSERT policy to be more restrictive
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Only internal staff can create notifications for others, users can't create notifications for themselves
CREATE POLICY "Staff can create notifications" ON public.notifications 
    FOR INSERT TO authenticated 
    WITH CHECK (public.is_internal_staff(auth.uid()));