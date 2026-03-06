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
    const { unique_request_number, vendor_id, verification_id } = await req.json();

    if (!unique_request_number) {
      return new Response(
        JSON.stringify({ success: false, error: "unique_request_number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const response = await retryWithBackoff(() =>
      fetch(`${VERIFIEDU_BASE_URL}/GetAadhaarDetailsById`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: VERIFIEDU_TOKEN,
          companyid: VERIFIEDU_COMPANY_ID,
        },
        body: JSON.stringify({ unique_request_number }),
      })
    );

    const responseText = await response.text();
    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Verification service returned an invalid response." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!responseData.success || !responseData.data) {
      return new Response(
        JSON.stringify({ success: false, error: responseData.message || "Failed to retrieve Aadhaar details" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the verification record if verification_id is provided
    if (verification_id) {
      await supabase.from("vendor_verifications").update({
        status: "success",
        response_data: responseData.data,
        verified_at: new Date().toISOString(),
      }).eq("id", verification_id);
    } else if (vendor_id) {
      // Create a new verification record
      await supabase.from("vendor_verifications").insert({
        id: crypto.randomUUID(),
        vendor_id,
        verification_type: "aadhaar",
        verification_source: "verifiedu",
        status: "success",
        request_data: { unique_request_number },
        response_data: responseData.data,
        verified_at: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          name: responseData.data.name,
          dob: responseData.data.dob,
          gender: responseData.data.gender,
          address: responseData.data.address,
          photo: responseData.data.photo,
          is_valid: true,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Aadhaar details retrieval error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Failed to retrieve details" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
