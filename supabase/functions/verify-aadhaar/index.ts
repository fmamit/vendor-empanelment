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
    const { vendor_id, surl, furl } = await req.json();

    if (!surl || !furl) {
      return new Response(
        JSON.stringify({ success: false, error: "Success URL (surl) and failure URL (furl) are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const verificationId = crypto.randomUUID();
    await supabase.from("vendor_verifications").insert({
      id: verificationId,
      vendor_id,
      verification_type: "aadhaar",
      verification_source: "verifiedu",
      status: "in_progress",
      request_data: { surl, furl },
    });

    const response = await retryWithBackoff(() =>
      fetch(`${VERIFIEDU_BASE_URL}/VerifyAadhaarViaDigilocker`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: VERIFIEDU_TOKEN,
          companyid: VERIFIEDU_COMPANY_ID,
        },
        body: JSON.stringify({ surl, furl }),
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

    // Store the unique_request_number for later retrieval via get-aadhaar-details
    await supabase.from("vendor_verifications").update({
      status: "pending",
      response_data: responseData.data,
    }).eq("id", verificationId);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          unique_request_number: responseData.data.unique_request_number,
          redirect_url: responseData.data.redirect_url || responseData.data.url,
          verification_id: verificationId,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Aadhaar verification error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Verification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
