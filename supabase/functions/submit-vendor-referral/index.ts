import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referral_code, formData } = await req.json();

    if (!referral_code || !formData) {
      return new Response(JSON.stringify({ error: "Missing referral code or form data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Validate referral code and get referring staff user_id
    const { data: refCode, error: refErr } = await supabase
      .from("staff_referral_codes")
      .select("user_id, is_active")
      .eq("referral_code", referral_code)
      .eq("is_active", true)
      .single();

    if (refErr || !refCode) {
      return new Response(JSON.stringify({ error: "Invalid or inactive referral code." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Create vendor record with referred_by
    const { data: vendor, error: vendorErr } = await supabase
      .from("vendors")
      .insert({
        company_name: formData.company_name,
        trade_name: formData.trade_name || null,
        category_id: formData.category_id,
        gst_number: formData.gst_number || null,
        pan_number: formData.pan_number || null,
        primary_contact_name: formData.primary_contact_name,
        primary_mobile: formData.primary_mobile,
        primary_email: formData.primary_email,
        bank_name: formData.bank_name || null,
        bank_branch: formData.bank_branch || null,
        bank_account_number: formData.bank_account_number || null,
        bank_ifsc: formData.bank_ifsc || null,
        referred_by: refCode.user_id,
        current_status: "pending_review",
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (vendorErr) {
      console.error("Vendor creation error:", vendorErr);
      return new Response(JSON.stringify({ error: "Failed to create vendor record." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Create auth user (phone-based) — find existing or create new
    const phone = formData.primary_mobile;
    let userId: string;

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u: any) => u.phone === phone);

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: authErr } = await supabase.auth.admin.createUser({
        phone,
        phone_confirm: true,
      });
      if (authErr) {
        console.error("Auth user creation error:", authErr);
        userId = "";
      } else {
        userId = newUser.user.id;
      }
    }

    // 4. Create vendor_users link
    if (userId) {
      await supabase.from("vendor_users").insert({
        vendor_id: vendor.id,
        user_id: userId,
        phone_number: phone,
        is_primary_contact: true,
        is_active: true,
      });

      // Add vendor role
      await supabase.from("user_roles").insert({
        user_id: userId,
        role: "maker",
      });
    }

    return new Response(
      JSON.stringify({ success: true, vendor_id: vendor.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
