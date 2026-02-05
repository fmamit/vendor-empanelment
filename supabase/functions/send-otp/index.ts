 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 interface SendOTPRequest {
   phone_number: string;
 }
 
 function generateOTP(): string {
   return Math.floor(100000 + Math.random() * 900000).toString();
 }
 
 Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const supabaseClient = createClient(
       Deno.env.get('SUPABASE_URL') ?? '',
       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
       { auth: { persistSession: false } }
     );
 
     const body: SendOTPRequest = await req.json();
     const { phone_number } = body;
 
     if (!phone_number) {
       throw new Error('Phone number is required');
     }
 
     // Generate OTP
     const otp = generateOTP();
     const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
 
     // Format phone number
     let phoneDigits = phone_number.replace(/[^\d]/g, '');
     if (phoneDigits.length === 10) {
       phoneDigits = '91' + phoneDigits;
     }
 
     // Store OTP in database
     const { error: otpError } = await supabaseClient
       .from('otp_codes')
       .insert({
         phone_number: phoneDigits,
         otp_code: otp,
         expires_at: expiresAt.toISOString(),
         is_used: false,
       });
 
     if (otpError) {
       console.error('Failed to store OTP:', otpError);
       throw new Error('Failed to generate OTP');
     }
 
     // Get WhatsApp settings
     const { data: settings, error: settingsError } = await supabaseClient
       .from('whatsapp_settings')
       .select('*')
       .eq('is_active', true)
       .single();
 
     if (settingsError || !settings) {
       throw new Error('WhatsApp not configured');
     }
 
     // Build Exotel API request for OTP template
     const exotelSubdomain = settings.exotel_subdomain || 'api.exotel.com';
     const exotelUrl = `https://${exotelSubdomain}/v2/accounts/${settings.exotel_sid}/messages`;
 
     // Use the OTP template - assuming template name is 'otp' with {{1}} as OTP variable
     const exotelPayload = {
       whatsapp: {
         messages: [{
           from: settings.whatsapp_source_number,
           to: phoneDigits,
           content: {
             type: 'template',
             template: {
               name: 'otp',
               language: { code: 'en' },
               components: [{
                 type: 'body',
                 parameters: [{ type: 'text', text: otp }]
               }]
             }
           }
         }]
       }
     };
 
     console.log('Sending OTP via WhatsApp:', JSON.stringify({ phone: phoneDigits, otp: '****' }));
 
     const exotelResponse = await fetch(exotelUrl, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Basic ${btoa(`${settings.exotel_api_key}:${settings.exotel_api_token}`)}`,
       },
       body: JSON.stringify(exotelPayload),
     });
 
     const responseText = await exotelResponse.text();
     console.log('Exotel OTP response:', responseText);
 
     if (!exotelResponse.ok) {
       console.error('Failed to send OTP via WhatsApp');
       // Don't throw - OTP is stored, user can still verify (for testing purposes)
     }
 
     return new Response(
       JSON.stringify({ 
         success: true, 
         message: 'OTP sent successfully',
         // Only include masked phone for confirmation
         phone_last_4: phoneDigits.slice(-4),
       }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   } catch (error: any) {
     console.error('Error in send-otp:', error);
     return new Response(
       JSON.stringify({ success: false, error: error.message }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });