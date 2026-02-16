import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VERIFIEDU_BASE_URL = "http://localdev.earlywages.in/api/verifiedu";
const VERIFIEDU_TOKEN = "VgBFAFIASQBGAEkARQBEAFUAVABFAFMAVABJAE4ARwBKAFUATgBPAE8ATgAtADEANAAtAEoAYQBuAC0AMgAwADIANgA=";
const VERIFIEDU_COMPANY_ID = "VUTJ";

// Retry logic with exponential backoff
async function retryWithBackoff(fn: () => Promise<Response>, maxRetries = 2) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fn();
      if (response.ok || response.status === 200) {
        return response;
      }
      // Retry on 5xx errors
      if (response.status >= 500 && i < maxRetries) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      return response;
    } catch (error) {
      if (i < maxRetries) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
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
    const { pan_number, vendor_id } = await req.json();

    // Validate PAN format
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!pan_number || !panRegex.test(pan_number.toUpperCase())) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid PAN format. Must be 10 characters: 5 letters, 4 digits, 1 letter.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Log verification initiation
    const verificationId = crypto.randomUUID();
    await supabase.from("vendor_verifications").insert({
      id: verificationId,
      vendor_id,
      verification_type: "pan",
      verification_source: "verifiedu",
      status: "in_progress",
      request_data: { pan_number: pan_number.toUpperCase() },
    });

    // Call VerifiedU PAN API with retry logic
    const response = await retryWithBackoff(() =>
      fetch(`${VERIFIEDU_BASE_URL}/VerifyPAN`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: VERIFIEDU_TOKEN,
          companyid: VERIFIEDU_COMPANY_ID,
        },
        body: JSON.stringify({
          PanNumber: pan_number.toUpperCase(),
        }),
      })
    );

    const responseText = await response.text();
    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      // API returned non-JSON or empty response
      await supabase
        .from("vendor_verifications")
        .update({
          status: "error",
          response_data: { raw: responseText, http_status: response.status },
        })
        .eq("id", verificationId);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Verification service returned an invalid response. Please try again later.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check for API errors vs verification failures
    if (!responseData.success || !responseData.data) {
      // API error
      await supabase
        .from("vendor_verifications")
        .update({
          status: "error",
          response_data: responseData,
        })
        .eq("id", verificationId);

      return new Response(
        JSON.stringify({
          success: false,
          error: responseData.message || "Verification service unavailable",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Genuine result
    const verificationStatus = responseData.data.is_valid ? "success" : "failed";

    await supabase
      .from("vendor_verifications")
      .update({
        status: verificationStatus,
        response_data: responseData.data,
        verified_at: new Date().toISOString(),
      })
      .eq("id", verificationId);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: responseData.data.id,
          name: responseData.data.name,
          dob: responseData.data.dob,
          is_valid: responseData.data.is_valid,
          status: verificationStatus,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("PAN verification error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Verification failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
