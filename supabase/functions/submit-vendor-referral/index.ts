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
    const { token, formData } = await req.json();

    if (!token || !formData) {
      return new Response(JSON.stringify({ error: "Missing token or form data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Validate invitation token
    const { data: invitation, error: invErr } = await supabase
      .from("vendor_invitations")
      .select("*")
      .eq("token", token)
      .is("used_at", null)
      .single();

    if (invErr || !invitation) {
      return new Response(JSON.stringify({ error: "Invalid or already used registration link." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "This registration link has expired." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Create vendor record
    const { data: vendor, error: vendorErr } = await supabase
      .from("vendors")
      .insert({
        company_name: formData.company_name,
        trade_name: formData.trade_name || null,
        category_id: formData.category_id || invitation.category_id,
        gst_number: formData.gst_number || null,
        pan_number: formData.pan_number || null,
        primary_contact_name: formData.primary_contact_name,
        primary_mobile: formData.primary_mobile,
        primary_email: formData.primary_email,
        bank_name: formData.bank_name || null,
        bank_branch: formData.bank_branch || null,
        bank_account_number: formData.bank_account_number || null,
        bank_ifsc: formData.bank_ifsc || null,
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
        // Still proceed — vendor record is created, user can be linked later
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

    // 5. Mark invitation as used
    await supabase
      .from("vendor_invitations")
      .update({
        used_at: new Date().toISOString(),
        vendor_id: vendor.id,
      })
      .eq("id", invitation.id);

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
