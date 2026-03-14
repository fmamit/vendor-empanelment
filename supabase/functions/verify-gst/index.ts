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
    const { gstin, vendor_id } = await req.json();

    // Validate GSTIN format: 15 chars - 2 digits, 10 PAN chars, 1 entity, 1 Z, 1 check
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstin || !gstRegex.test(gstin.toUpperCase())) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid GSTIN format. Must be 15 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const verificationId = crypto.randomUUID();
    await supabase.from("vendor_verifications").insert({
      id: verificationId,
      vendor_id,
      verification_type: "gst",
      verification_source: "verifiedu",
      status: "in_progress",
      request_data: { gstin: gstin.toUpperCase() },
    });

    const response = await retryWithBackoff(() =>
      fetch(`${VERIFIEDU_BASE_URL}/api/verifiedu/VerifyGstin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: VERIFIEDU_TOKEN,
          companyid: VERIFIEDU_COMPANY_ID,
        },
        body: JSON.stringify({ gstin: gstin.toUpperCase() }),
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
        JSON.stringify({ success: false, error: "Verification service returned an invalid response." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!responseData.success || !responseData.data) {
      await supabase.from("vendor_verifications").update({
        status: "error",
        response_data: responseData,
      }).eq("id", verificationId);
      return new Response(
        JSON.stringify({ success: false, error: responseData.message || "Verification service unavailable" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const verificationStatus = responseData.data.is_valid ? "success" : "failed";
    await supabase.from("vendor_verifications").update({
      status: verificationStatus,
      response_data: responseData.data,
      verified_at: new Date().toISOString(),
    }).eq("id", verificationId);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          gstin: responseData.data.gstin,
          business_name: responseData.data.business_name || responseData.data.legal_name,
          trade_name: responseData.data.trade_name,
          status: responseData.data.status,
          registration_date: responseData.data.registration_date,
          is_valid: responseData.data.is_valid,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("GST verification error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Verification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
