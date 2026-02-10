
-- Create otp_verifications table for WhatsApp OTP flow
CREATE TABLE public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  org_id TEXT
);

-- Enable RLS
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- No direct access - only edge functions with service role can access
CREATE POLICY "No direct access to otp_verifications"
  ON public.otp_verifications
  FOR ALL
  USING (false);

-- Create index for phone lookups
CREATE INDEX idx_otp_verifications_phone ON public.otp_verifications (phone, verified, expires_at);
