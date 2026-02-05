 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 interface CreateVendorRequest {
   invitation_token: string;
   phone_number: string;
 }
 
 Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const supabaseAdmin = createClient(
       Deno.env.get('SUPABASE_URL') ?? '',
       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
       { auth: { persistSession: false } }
     );
 
     const body: CreateVendorRequest = await req.json();
     const { invitation_token, phone_number } = body;
 
     if (!invitation_token || !phone_number) {
       throw new Error('Invitation token and phone number are required');
     }
 
     // Format phone number (ensure it has country code)
     let phoneDigits = phone_number.replace(/[^\d]/g, '');
     if (phoneDigits.length === 10) {
       phoneDigits = '91' + phoneDigits;
     }
 
     console.log('Creating vendor registration for phone:', phoneDigits);
 
     // 1. Validate the invitation token
     const { data: invitation, error: invError } = await supabaseAdmin
       .from('vendor_invitations')
       .select('*, vendor_categories(name)')
       .eq('token', invitation_token)
       .gt('expires_at', new Date().toISOString())
       .is('used_at', null)
       .maybeSingle();
 
     if (invError) {
       console.error('Invitation lookup error:', invError);
       throw new Error('Failed to validate invitation');
     }
 
     if (!invitation) {
       return new Response(
         JSON.stringify({ success: false, error: 'Invalid or expired invitation' }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     // 2. Verify OTP was used for this phone number
     const { data: otpRecord, error: otpError } = await supabaseAdmin
       .from('otp_codes')
       .select('*')
       .eq('phone_number', phoneDigits)
       .eq('is_used', true)
       .order('created_at', { ascending: false })
       .limit(1)
       .maybeSingle();
 
     if (otpError) {
       console.error('OTP lookup error:', otpError);
       throw new Error('Failed to verify phone');
     }
 
     if (!otpRecord) {
       return new Response(
         JSON.stringify({ success: false, error: 'Phone verification required' }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     // Check if OTP was used recently (within last hour)
     const otpCreatedAt = new Date(otpRecord.created_at);
     const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
     if (otpCreatedAt < oneHourAgo) {
       return new Response(
         JSON.stringify({ success: false, error: 'Phone verification expired. Please request a new OTP.' }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     console.log('OTP verification confirmed for phone:', phoneDigits);
 
     // 3. Create anonymous user using Admin Auth API
     const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
       email: `vendor_${Date.now()}@anonymous.local`,
       password: crypto.randomUUID(),
       email_confirm: true,
       user_metadata: {
         is_vendor: true,
         phone_verified: true,
       }
     });
 
     if (userError) {
       console.error('User creation error:', userError);
       throw new Error('Failed to create user session');
     }
 
     const userId = userData.user.id;
     console.log('Created user:', userId);
 
     // 4. Create vendor record
     const { data: vendor, error: vendorError } = await supabaseAdmin
       .from('vendors')
       .insert({
         category_id: invitation.category_id,
         company_name: invitation.company_name,
         primary_contact_name: 'Primary Contact',
         primary_mobile: invitation.contact_phone,
         primary_email: invitation.contact_email,
         current_status: 'draft',
       })
       .select()
       .single();
 
     if (vendorError) {
       console.error('Vendor creation error:', vendorError);
       // Clean up the created user
       await supabaseAdmin.auth.admin.deleteUser(userId);
       throw new Error('Failed to create vendor record');
     }
 
     console.log('Created vendor:', vendor.id);
 
     // 5. Create vendor_user link
     const { error: linkError } = await supabaseAdmin
       .from('vendor_users')
       .insert({
         vendor_id: vendor.id,
         user_id: userId,
         phone_number: invitation.contact_phone,
         is_primary_contact: true,
         is_active: true,
       });
 
     if (linkError) {
       console.error('Vendor user link error:', linkError);
       // Clean up
       await supabaseAdmin.from('vendors').delete().eq('id', vendor.id);
       await supabaseAdmin.auth.admin.deleteUser(userId);
       throw new Error('Failed to link user to vendor');
     }
 
     console.log('Linked user to vendor');
 
     // 6. Generate a session for the new user
     const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
       type: 'magiclink',
       email: userData.user.email!,
     });
 
     // Get access token by signing in the user
     const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
       email: userData.user.email!,
       password: userData.user.id, // We need to update password first
     });
 
     // Update user password to something we can use
     const tempPassword = crypto.randomUUID();
     await supabaseAdmin.auth.admin.updateUserById(userId, {
       password: tempPassword,
     });
 
     // Now sign in with the new password
     const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
       email: userData.user.email!,
       password: tempPassword,
     });
 
     if (authError) {
       console.error('Auth error:', authError);
       // Continue anyway - user can still use the vendor record
     }
 
     return new Response(
       JSON.stringify({
         success: true,
         vendor_id: vendor.id,
         user_id: userId,
         access_token: authData?.session?.access_token,
         refresh_token: authData?.session?.refresh_token,
         message: 'Vendor registration created successfully',
       }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   } catch (error: any) {
     console.error('Error in create-vendor-registration:', error);
     return new Response(
       JSON.stringify({ success: false, error: error.message }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });