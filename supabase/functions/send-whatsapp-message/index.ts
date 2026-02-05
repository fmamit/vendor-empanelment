 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 interface SendWhatsAppRequest {
   vendor_id?: string;
   phone_number: string;
   template_name: string;
   template_variables?: Record<string, string>;
   message?: string;
 }
 
 // Exotel status code mapping
 const EXOTEL_STATUS_MAP: Record<number, string> = {
   30001: 'sent',
   30002: 'delivered',
   30003: 'read',
   30004: 'failed',
   30005: 'failed',
 };
 
 function extractMessageSid(exotelResult: any): string | null {
   return exotelResult?.response?.whatsapp?.messages?.[0]?.data?.sid ||
          exotelResult?.sid ||
          exotelResult?.id ||
          null;
 }
 
 Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const authHeader = req.headers.get('Authorization');
     if (!authHeader) {
       throw new Error('No Authorization header');
     }
 
     const token = authHeader.replace('Bearer ', '');
 
     const supabaseClient = createClient(
       Deno.env.get('SUPABASE_URL') ?? '',
       Deno.env.get('SUPABASE_ANON_KEY') ?? '',
       {
         global: { headers: { Authorization: authHeader } },
         auth: { persistSession: false },
       }
     );
 
     // Authenticate user
     const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
     if (userError || !user) {
       throw new Error('Authentication failed');
     }
 
     const body: SendWhatsAppRequest = await req.json();
     const { vendor_id, phone_number, template_name, template_variables, message } = body;
 
     if (!phone_number) {
       throw new Error('Phone number is required');
     }
 
     // Get WhatsApp settings
     const { data: settings, error: settingsError } = await supabaseClient
       .from('whatsapp_settings')
       .select('*')
       .eq('is_active', true)
       .single();
 
     if (settingsError || !settings) {
       throw new Error('WhatsApp not configured. Please set up Exotel credentials in settings.');
     }
 
     // Get template content if template_name is provided
     let messageContent = message || '';
     let templateNameForPayload = template_name;
 
     if (template_name && !message) {
       const { data: template } = await supabaseClient
         .from('whatsapp_templates')
         .select('content, variables')
         .eq('template_name', template_name)
         .eq('is_active', true)
         .single();
 
       if (template) {
         messageContent = template.content;
         // Replace {{key}} placeholders with actual values
         if (template_variables) {
           Object.entries(template_variables).forEach(([key, value]) => {
             messageContent = messageContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
           });
         }
       }
     }
 
     // Format phone number - digits only for Exotel
     let phoneDigits = phone_number.replace(/[^\d]/g, '');
     if (phoneDigits.length === 10) {
       phoneDigits = '91' + phoneDigits; // Add India country code
     }
     const phoneForStorage = '+' + phoneDigits;
 
     // Build Exotel API URL
     const exotelSubdomain = settings.exotel_subdomain || 'api.exotel.com';
     const exotelUrl = `https://${exotelSubdomain}/v2/accounts/${settings.exotel_sid}/messages`;
 
     // Build Exotel payload
     let exotelPayload: any;
 
     if (template_name) {
       // Build template components with parameters
       const components: any[] = [];
       if (template_variables && Object.keys(template_variables).length > 0) {
         const bodyParams = Object.entries(template_variables)
           .sort(([a], [b]) => parseInt(a) - parseInt(b))
           .map(([_, value]) => ({ type: 'text', text: value }));
         
         if (bodyParams.length > 0) {
           components.push({
             type: 'body',
             parameters: bodyParams
           });
         }
       }
 
       exotelPayload = {
         whatsapp: {
           messages: [{
             from: settings.whatsapp_source_number,
             to: phoneDigits,
             content: {
               type: 'template',
               template: {
                 name: templateNameForPayload,
                 language: { code: 'en' },
                 components: components
               }
             }
           }]
         }
       };
     } else {
       // Text message
       exotelPayload = {
         whatsapp: {
           messages: [{
             from: settings.whatsapp_source_number,
             to: phoneDigits,
             content: {
               type: 'text',
               text: { body: messageContent }
             }
           }]
         }
       };
     }
 
     console.log('Sending WhatsApp via Exotel:', JSON.stringify(exotelPayload));
 
     // Send via Exotel API
     const exotelResponse = await fetch(exotelUrl, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Basic ${btoa(`${settings.exotel_api_key}:${settings.exotel_api_token}`)}`,
       },
       body: JSON.stringify(exotelPayload),
     });
 
     const responseText = await exotelResponse.text();
     console.log('Exotel response:', responseText);
 
     // Parse response
     let exotelResult: any;
     try {
       exotelResult = JSON.parse(responseText);
     } catch {
       const jsonMatch = responseText.match(/\{[\s\S]*\}/);
       exotelResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: responseText };
     }
 
     const exotelSid = extractMessageSid(exotelResult);
     const success = !!exotelSid && exotelResponse.ok;
 
     // Log message in database
     const { error: insertError } = await supabaseClient.from('whatsapp_messages').insert({
       vendor_id: vendor_id || null,
       phone_number: phoneForStorage,
       message_content: messageContent,
       template_name: template_name || null,
       template_variables: template_variables || null,
       exotel_message_id: exotelSid,
       status: success ? 'sent' : 'failed',
       direction: 'outbound',
       sent_by: user.id,
       sent_at: new Date().toISOString(),
       error_message: success ? null : (exotelResult?.message || exotelResult?.error || 'Failed to send'),
     });
 
     if (insertError) {
       console.error('Failed to log message:', insertError);
     }
 
     if (!success) {
       throw new Error(exotelResult?.message || exotelResult?.error || 'Failed to send WhatsApp message');
     }
 
     return new Response(
       JSON.stringify({ 
         success: true, 
         message_id: exotelSid,
         message: 'WhatsApp message sent successfully'
       }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   } catch (error: any) {
     console.error('Error in send-whatsapp-message:', error);
     return new Response(
       JSON.stringify({ success: false, error: error.message }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });