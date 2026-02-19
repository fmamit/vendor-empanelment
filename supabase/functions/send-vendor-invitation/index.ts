import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidIndianPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

function sanitizeString(value: string, maxLength: number): string {
  return value.trim().substring(0, maxLength);
}

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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { company_name, contact_email, contact_phone, category_id } = body;

    // Validate required fields
    if (!company_name || !contact_email || !contact_phone || !category_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate email format
    if (!isValidEmail(contact_email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate phone format
    if (!isValidIndianPhone(contact_phone)) {
      return new Response(JSON.stringify({ error: "Invalid phone number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate string lengths
    if (company_name.length > 255) {
      return new Response(JSON.stringify({ error: "Company name too long" }), {
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
        company_name: sanitizeString(company_name, 255),
        contact_email,
        contact_phone,
        category_id,
        token,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Invitation creation failed");
      return new Response(JSON.stringify({ error: "Failed to create invitation" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const registrationUrl = `https://civ.in-sync.co.in${registrationPath}`;

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
              <p>Dear <strong>${sanitizeString(company_name, 100)}</strong>,</p>
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
      console.error("Email send failed");
      // Invitation was created, email failure is not critical
    }

    return new Response(
      JSON.stringify({ success: true, invitation_id: invitation.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Request processing failed");
    return new Response(JSON.stringify({ error: "Request failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
