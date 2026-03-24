import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { org_name, admin_name, admin_email, admin_password } = await req.json();

    // Validate inputs
    if (!org_name || !admin_name || !admin_email || !admin_password) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (org_name.trim().length < 2 || org_name.trim().length > 100) {
      return new Response(
        JSON.stringify({ error: "Organization name must be 2–100 characters" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isValidEmail(admin_email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (admin_password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const trimmedName = org_name.trim();
    let slug = slugify(trimmedName);

    // Ensure slug is unique
    const { data: existingSlug } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Generate a short vendor code prefix from the org name (first 2-3 uppercase letters)
    const prefix = trimmedName
      .replace(/[^a-zA-Z]/g, "")
      .substring(0, 3)
      .toUpperCase() || "ORG";

    // 1. Create tenant
    const { data: tenant, error: tenantErr } = await supabase
      .from("tenants")
      .insert({
        slug,
        name: trimmedName,
        short_name: trimmedName,
        vendor_code_prefix: prefix,
      })
      .select("id")
      .single();

    if (tenantErr) {
      console.error("Tenant creation failed:", tenantErr);
      return new Response(
        JSON.stringify({ error: "Failed to create organization. Please try again." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Create auth user (admin)
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: admin_email.toLowerCase().trim(),
      password: admin_password,
      email_confirm: true,
    });

    if (authErr || !authData.user) {
      console.error("Auth user creation failed:", authErr);
      // Clean up the tenant we just created
      await supabase.from("tenants").delete().eq("id", tenant.id);

      const message = authErr?.message?.includes("already been registered")
        ? "This email is already registered. Please log in instead."
        : "Failed to create admin account. Please try again.";

      return new Response(
        JSON.stringify({ error: message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;

    // 3. Create profile with tenant_id
    const { error: profileErr } = await supabase.from("profiles").insert({
      user_id: userId,
      tenant_id: tenant.id,
      full_name: admin_name.trim(),
      email: admin_email.toLowerCase().trim(),
      department: "Administration",
    });

    if (profileErr) {
      console.error("Profile creation failed:", profileErr);
      // Profile might have been auto-created by a trigger — try update instead
      await supabase
        .from("profiles")
        .update({
          tenant_id: tenant.id,
          full_name: admin_name.trim(),
          department: "Administration",
        })
        .eq("user_id", userId);
    }

    // 4. Assign admin role
    const { error: roleErr } = await supabase.from("user_roles").insert({
      user_id: userId,
      tenant_id: tenant.id,
      role: "admin",
    });

    if (roleErr) {
      console.error("Role assignment failed:", roleErr);
    }

    // 5. Also assign all workflow roles so the admin can do everything
    for (const role of ["maker", "checker", "approver"]) {
      await supabase.from("user_roles").insert({
        user_id: userId,
        tenant_id: tenant.id,
        role,
      });
    }

    // Note: Trial subscription is auto-created by the trigger on tenants insert
    // (see 20260318100000_subscription_billing.sql)

    return new Response(
      JSON.stringify({
        success: true,
        tenant_id: tenant.id,
        user_id: userId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Organization registration error:", err);
    return new Response(
      JSON.stringify({ error: "Registration failed. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
