import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VERIFIEDU_BASE_URL = "https://resources.earlywages.in";
const VERIFIEDU_TOKEN = "VgBFAFIASQBGAEkARQBEAFUAVABFAFMAVABJAE4ARwBKAFUATgBPAE8ATgAtADEANAAtAEoAYQBuAC0AMgAwADIANgA=";
const VERIFIEDU_COMPANY_ID = "VUTJ";

async function retryWithBackoff(fn: () => Promise<Response>, maxRetries = 2) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fn();
      if (response.ok || response.status === 200) return response;
      if (response.status >= 500 && i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
      return response;
    } catch (error) {
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, mobile, pan_number, rs_type, vendor_id } = await req.json();

    if (!name || !mobile || !pan_number) {
      return new Response(
        JSON.stringify({ success: false, error: "name, mobile, and pan_number are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const verificationId = crypto.randomUUID();
    await supabase.from("vendor_verifications").insert({
      id: verificationId,
      vendor_id,
      verification_type: "credit_report_experian",
      verification_source: "verifiedu",
      status: "in_progress",
      request_data: { name, mobile, pan_number, rs_type: rs_type || "Y" },
    });

    const response = await retryWithBackoff(() =>
      fetch(`${VERIFIEDU_BASE_URL}/api/verifiedu/GetIndivisualCreditReport`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: VERIFIEDU_TOKEN,
          companyid: VERIFIEDU_COMPANY_ID,
        },
        body: JSON.stringify({
          name,
          mobile,
          panNumber: pan_number.toUpperCase(),
          rsType: rs_type || "Y",
        }),
      })
    );

    const responseText = await response.text();
    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      await supabase.from("vendor_verifications").update({
        status: "error",
        response_data: { raw: responseText, http_status: response.status },
      }).eq("id", verificationId);
      return new Response(
        JSON.stringify({ success: false, error: "Credit report service returned an invalid response." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!responseData.success) {
      await supabase.from("vendor_verifications").update({
        status: "error",
        response_data: responseData,
      }).eq("id", verificationId);
      return new Response(
        JSON.stringify({ success: false, error: responseData.message || "Credit report service unavailable" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase.from("vendor_verifications").update({
      status: "success",
      response_data: responseData.data || responseData,
      verified_at: new Date().toISOString(),
    }).eq("id", verificationId);

    return new Response(
      JSON.stringify({ success: true, data: responseData.data || responseData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Experian credit report error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Failed to fetch credit report" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
