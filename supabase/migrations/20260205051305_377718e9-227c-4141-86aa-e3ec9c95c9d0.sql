-- WhatsApp Settings - stores Exotel API credentials
CREATE TABLE public.whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exotel_sid TEXT,
  exotel_api_key TEXT,
  exotel_api_token TEXT,
  exotel_subdomain TEXT DEFAULT 'api.exotel.com',
  whatsapp_source_number TEXT,
  waba_id TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WhatsApp Messages - logs all sent and received messages
CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  message_content TEXT,
  template_name TEXT,
  template_variables JSONB,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed', 'received')),
  exotel_message_id TEXT,
  sent_by UUID,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WhatsApp Templates - stores pre-approved message templates
CREATE TABLE public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT 'UTILITY',
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_settings
CREATE POLICY "Staff can view whatsapp settings" ON public.whatsapp_settings
  FOR SELECT USING (is_internal_staff(auth.uid()));

CREATE POLICY "Admins can manage whatsapp settings" ON public.whatsapp_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for whatsapp_messages
CREATE POLICY "Staff can view whatsapp messages" ON public.whatsapp_messages
  FOR SELECT USING (is_internal_staff(auth.uid()));

CREATE POLICY "Staff can insert whatsapp messages" ON public.whatsapp_messages
  FOR INSERT WITH CHECK (is_internal_staff(auth.uid()));

CREATE POLICY "Staff can update whatsapp messages" ON public.whatsapp_messages
  FOR UPDATE USING (is_internal_staff(auth.uid()));

CREATE POLICY "Admins can manage all whatsapp messages" ON public.whatsapp_messages
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for whatsapp_templates
CREATE POLICY "Staff can view whatsapp templates" ON public.whatsapp_templates
  FOR SELECT USING (is_internal_staff(auth.uid()));

CREATE POLICY "Admins can manage whatsapp templates" ON public.whatsapp_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Enable Realtime for live status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;

-- Indexes for performance
CREATE INDEX idx_whatsapp_messages_vendor ON public.whatsapp_messages(vendor_id);
CREATE INDEX idx_whatsapp_messages_exotel_id ON public.whatsapp_messages(exotel_message_id);
CREATE INDEX idx_whatsapp_messages_status ON public.whatsapp_messages(status);
CREATE INDEX idx_whatsapp_messages_phone ON public.whatsapp_messages(phone_number);

-- Trigger for updating updated_at on whatsapp_settings
CREATE TRIGGER update_whatsapp_settings_updated_at
  BEFORE UPDATE ON public.whatsapp_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updating updated_at on whatsapp_templates
CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();