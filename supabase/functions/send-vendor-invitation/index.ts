import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    // Authenticate staff user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify staff
    const { data: isStaff } = await supabaseAdmin.rpc("is_internal_staff", { _user_id: user.id });
    if (!isStaff) {
      return new Response(JSON.stringify({ error: "Not authorized as staff" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { company_name, contact_email, contact_phone, category_id } = body;

    if (!company_name || !contact_email || !contact_phone || !category_id) {
      return new Response(JSON.stringify({ error: "All fields are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get staff referral code for the registration link
    const { data: refCode } = await supabaseAdmin
      .from("staff_referral_codes")
      .select("referral_code")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    const token = crypto.randomUUID();
    const registrationPath = refCode?.referral_code
      ? `/register/ref/${refCode.referral_code}`
      : `/register/ref/${token}`;

    // Insert invitation
    const { data: invitation, error: insertError } = await supabaseAdmin
      .from("vendor_invitations")
      .insert({
        company_name,
        contact_email,
        contact_phone,
        category_id,
        token,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create invitation" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine base URL from origin or fallback
    const origin = req.headers.get("origin") || "https://onboardly-path.lovable.app";
    const registrationUrl = `${origin}${registrationPath}`;

    // Send email via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Capital India <noreply@in-sync.co.in>",
        to: [contact_email],
        subject: `Vendor Registration Invitation - Capital India`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #0066B3;">
              <h1 style="color: #0066B3; margin: 0;">Capital India</h1>
              <p style="color: #666; margin: 5px 0 0;">Vendor Onboarding Portal</p>
            </div>
            <div style="padding: 30px 0;">
              <p>Dear <strong>${company_name}</strong>,</p>
              <p>You have been invited to register as a vendor with Capital India. Please click the button below to complete your registration.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${registrationUrl}" style="background-color: #0066B3; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Complete Registration
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">This invitation is valid for 7 days. If you did not expect this invitation, please ignore this email.</p>
            </div>
            <div style="border-top: 1px solid #eee; padding-top: 15px; text-align: center; color: #999; font-size: 12px;">
              <p>Capital India Finance Limited</p>
            </div>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error("Resend error:", errBody);
      // Invitation was created, just email failed
    }

    return new Response(
      JSON.stringify({ success: true, invitation_id: invitation.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
