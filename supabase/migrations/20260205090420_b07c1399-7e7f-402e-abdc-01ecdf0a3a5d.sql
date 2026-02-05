-- Create verifiedu_settings table for storing API credentials
CREATE TABLE public.verifiedu_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_token text,
  company_id text,
  api_base_url text DEFAULT 'https://api.verifiedu.in',
  is_active boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verifiedu_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read verifiedu settings
CREATE POLICY "Admins can manage verifiedu settings"
ON public.verifiedu_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_verifiedu_settings_updated_at
BEFORE UPDATE ON public.verifiedu_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();