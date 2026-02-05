import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * VALIDATE-INVITATION Edge Function
 * 
 * This function validates an invitation token WITHOUT requiring authentication.
 * It returns minimal data needed for the registration page to display.
 * 
 * Key features:
 * - No RLS queries on the client side
 * - Returns only public-facing data (no sensitive info)
 * - Checks expiry and used status
 */

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

    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Validating invitation token:', token.substring(0, 8) + '...');

    // Lookup invitation
    const { data: invitation, error: invError } = await supabaseAdmin
      .from('vendor_invitations')
      .select('*, vendor_categories(name)')
      .eq('token', token)
      .maybeSingle();

    if (invError) {
      console.error('Invitation lookup error:', invError);
      throw new Error('Failed to validate invitation');
    }

    if (!invitation) {
      console.log('Invitation not found');
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid invitation link' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already used
    if (invitation.used_at) {
      console.log('Invitation already used');
      return new Response(
        JSON.stringify({ valid: false, error: 'This invitation has already been used' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiry
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
      console.log('Invitation expired');
      return new Response(
        JSON.stringify({ valid: false, error: 'This invitation has expired' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Invitation valid for:', invitation.company_name);

    // Return minimal public data
    return new Response(
      JSON.stringify({
        valid: true,
        company_name: invitation.company_name,
        contact_phone: invitation.contact_phone,
        contact_email: invitation.contact_email,
        category_name: invitation.vendor_categories?.name || 'Vendor',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in validate-invitation:', error);
    return new Response(
      JSON.stringify({ valid: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
