
CREATE TABLE public.public_otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('email', 'phone')),
  otp_code TEXT NOT NULL,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
  verified_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: deny all direct access (edge functions use service role)
ALTER TABLE public.public_otp_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to public_otp_verifications"
  ON public.public_otp_verifications
  FOR ALL
  USING (false);

-- Index for lookups
CREATE INDEX idx_public_otp_session_id ON public.public_otp_verifications (session_id);
CREATE INDEX idx_public_otp_identifier ON public.public_otp_verifications (identifier, created_at);
