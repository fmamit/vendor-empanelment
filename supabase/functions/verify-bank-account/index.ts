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
      if (response.ok || response.status === 200) {
        return response;
      }
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
    const { account_number, ifsc_code, vendor_id } = await req.json();

    if (!account_number || !ifsc_code) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Account number and IFSC code are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Sanitize IFSC: replace 'O' at position 4 with '0'
    let sanitizedIfsc = ifsc_code.toUpperCase();
    if (sanitizedIfsc[4] === 'O') {
      sanitizedIfsc = sanitizedIfsc.substring(0, 4) + '0' + sanitizedIfsc.substring(5);
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
      verification_type: "bank_account",
      verification_source: "verifiedu",
      status: "in_progress",
      request_data: { account_number, ifsc_code: sanitizedIfsc },
    });

    // Call VerifiedU Bank API with retry logic
    const response = await retryWithBackoff(() =>
      fetch(`${VERIFIEDU_BASE_URL}/api/verifiedu/VerifyBankAccountNumber`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: VERIFIEDU_TOKEN,
          companyid: VERIFIEDU_COMPANY_ID,
        },
        body: JSON.stringify({
          account_number: account_number.trim(),
          account_ifsc: sanitizedIfsc,
        }),
      })
    );

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      console.error("Failed to parse bank verification response:", responseText);
      await supabase
        .from("vendor_verifications")
        .update({ status: "error", remarks: "Invalid response from verification service" })
        .eq("id", verificationId);
      return new Response(
        JSON.stringify({ success: false, error: "Verification service returned an invalid response. Please try again." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for API errors vs verification failures
    if (!responseData.success || responseData.data === null) {
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
          account_holder_name: responseData.data.account_holder_name,
          bank_name: responseData.data.bank_name,
          branch_name: responseData.data.branch_name,
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
    console.error("Bank account verification error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Verification failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
