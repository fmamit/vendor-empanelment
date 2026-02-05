 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 interface VerifyOTPRequest {
   phone_number: string;
   otp_code: string;
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
 
     const body: VerifyOTPRequest = await req.json();
     const { phone_number, otp_code } = body;
 
     if (!phone_number || !otp_code) {
       throw new Error('Phone number and OTP are required');
     }
 
     // Format phone number
     let phoneDigits = phone_number.replace(/[^\d]/g, '');
     if (phoneDigits.length === 10) {
       phoneDigits = '91' + phoneDigits;
     }
 
     // Find valid OTP
     const { data: otpRecord, error: otpError } = await supabaseClient
       .from('otp_codes')
       .select('*')
       .eq('phone_number', phoneDigits)
       .eq('otp_code', otp_code)
       .eq('is_used', false)
       .gt('expires_at', new Date().toISOString())
       .order('created_at', { ascending: false })
       .limit(1)
       .maybeSingle();
 
     if (otpError) {
       console.error('OTP lookup error:', otpError);
       throw new Error('Failed to verify OTP');
     }
 
     if (!otpRecord) {
       return new Response(
         JSON.stringify({ 
           success: false, 
           error: 'Invalid or expired OTP',
           verified: false,
         }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     // Mark OTP as used
     await supabaseClient
       .from('otp_codes')
       .update({ is_used: true })
       .eq('id', otpRecord.id);
 
     return new Response(
       JSON.stringify({ 
         success: true, 
         verified: true,
         message: 'Phone number verified successfully',
       }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   } catch (error: any) {
     console.error('Error in verify-otp:', error);
     return new Response(
       JSON.stringify({ success: false, error: error.message, verified: false }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });