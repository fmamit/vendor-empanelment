import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VERIFIEDU_BASE_URL = "https://api.verifiedu.in/api/verifiedu";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vendor_id } = await req.json();

    if (!vendor_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Vendor ID is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const projectId = Deno.env.get("SUPABASE_PROJECT_ID");
    const successUrl = `https://${projectId}.supabase.co/functions/v1/digilocker-callback/success`;
    const failureUrl = `https://${projectId}.supabase.co/functions/v1/digilocker-callback/failure`;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Call VerifiedU Aadhaar initiation API
    const response = await fetch(`${VERIFIEDU_BASE_URL}/VerifyAadhaarViaDigilocker`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: "", // Embedded in API
        companyid: "", // Embedded in API
      },
      body: JSON.stringify({
        surl: successUrl,
        furl: failureUrl,
      }),
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      console.error("Failed to parse Aadhaar verification response:", responseText);
      return new Response(
        JSON.stringify({ success: false, error: "Verification service returned an invalid response. Please try again." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!responseData.success || !responseData.data) {
      return new Response(
        JSON.stringify({
          success: false,
          error: responseData.message || "Failed to initiate Aadhaar verification",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Log verification initiation
    const verificationId = crypto.randomUUID();
    await supabase.from("vendor_verifications").insert({
      id: verificationId,
      vendor_id,
      verification_type: "aadhaar",
      verification_source: "verifiedu",
      status: "in_progress",
      request_data: {
        unique_request_number: responseData.data.unique_request_number,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: responseData.data.id,
          url: responseData.data.url,
          unique_request_number: responseData.data.unique_request_number,
          verification_id: verificationId,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Aadhaar verification initiation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to initiate verification",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
