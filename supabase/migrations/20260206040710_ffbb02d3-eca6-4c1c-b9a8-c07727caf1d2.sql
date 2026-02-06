
-- 1. Create staff_referral_codes table
CREATE TABLE public.staff_referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  referral_code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_referral_codes ENABLE ROW LEVEL SECURITY;

-- Staff can view their own code
CREATE POLICY "Staff view own referral code"
ON public.staff_referral_codes
FOR SELECT
USING (user_id = auth.uid());

-- Admins can manage all codes
CREATE POLICY "Admins manage all referral codes"
ON public.staff_referral_codes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public/anon can SELECT to validate codes on the referral form
CREATE POLICY "Public can validate referral codes"
ON public.staff_referral_codes
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- 2. Add referred_by column to vendors
ALTER TABLE public.vendors ADD COLUMN referred_by uuid;

-- 3. Function to generate a unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := 'REF-' || upper(substr(md5(random()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM public.staff_referral_codes WHERE referral_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

-- 4. Staff can insert their own referral code
CREATE POLICY "Staff insert own referral code"
ON public.staff_referral_codes
FOR INSERT
WITH CHECK (user_id = auth.uid() AND is_internal_staff(auth.uid()));

-- 5. Seed referral codes for existing staff members
INSERT INTO public.staff_referral_codes (user_id, referral_code)
SELECT p.user_id, public.generate_referral_code()
FROM public.profiles p
WHERE p.is_active = true
ON CONFLICT (user_id) DO NOTHING;
