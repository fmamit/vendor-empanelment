import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validation helper functions
function isValidIndianPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidGST(gst: string): boolean {
  return gst.length === 15 && /^[0-9A-Z]{15}$/.test(gst);
}

function isValidPAN(pan: string): boolean {
  return pan.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan);
}

function isValidIFSC(ifsc: string): boolean {
  return ifsc.length === 11 && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
}

function sanitizeString(value: string, maxLength: number): string {
  return value.trim().substring(0, maxLength);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referral_code, formData } = await req.json();

    if (!referral_code || !formData) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate required fields
    const {
      company_name,
      primary_contact_name,
      primary_mobile,
      primary_email,
      category_id,
      trade_name,
      gst_number,
      pan_number,
      bank_name,
      bank_branch,
      bank_account_number,
      bank_ifsc,
      salutation,
      constitution_type,
    } = formData;

    // Validate required fields
    if (!company_name || !primary_contact_name || !primary_mobile || !primary_email || !category_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate phone number
    if (!isValidIndianPhone(primary_mobile)) {
      return new Response(JSON.stringify({ error: "Invalid phone number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate email
    if (!isValidEmail(primary_email)) {
      return new Response(JSON.stringify({ error: "Invalid email address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate optional but formatted fields
    if (gst_number && !isValidGST(gst_number)) {
      return new Response(JSON.stringify({ error: "Invalid GST number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (pan_number && !isValidPAN(pan_number)) {
      return new Response(JSON.stringify({ error: "Invalid PAN number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (bank_ifsc && !isValidIFSC(bank_ifsc)) {
      return new Response(JSON.stringify({ error: "Invalid IFSC code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate string lengths
    if (company_name.length > 255 || primary_contact_name.length > 255) {
      return new Response(JSON.stringify({ error: "Field length exceeded" }), {
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
      return new Response(JSON.stringify({ error: "Invalid referral code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Create vendor record with referred_by (DO NOT create auth user here)
    const { data: vendor, error: vendorErr } = await supabase
      .from("vendors")
      .insert({
        company_name: sanitizeString(company_name, 255),
        trade_name: trade_name ? sanitizeString(trade_name, 255) : null,
        category_id,
        gst_number: gst_number || null,
        pan_number: pan_number || null,
        primary_contact_name: sanitizeString(primary_contact_name, 255),
        primary_mobile,
        primary_email,
        bank_name: bank_name ? sanitizeString(bank_name, 255) : null,
        bank_branch: bank_branch ? sanitizeString(bank_branch, 255) : null,
        bank_account_number: bank_account_number ? sanitizeString(bank_account_number, 100) : null,
        bank_ifsc: bank_ifsc || null,
        salutation: salutation || null,
        constitution_type: constitution_type || null,
        referred_by: refCode.user_id,
        current_status: "pending_review",
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (vendorErr) {
      console.error("Vendor creation failed");
      return new Response(JSON.stringify({ error: "Registration failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, vendor_id: vendor.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error processing request");
    return new Response(JSON.stringify({ error: "Registration failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
