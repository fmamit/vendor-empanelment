import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VERIFIEDU_BASE_URL = "https://api.verifiedu.in/api/verifiedu";

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
    const { unique_request_number, vendor_id } = await req.json();

    if (!unique_request_number) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unique request number is required",
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

    // Call VerifiedU Aadhaar details API with retry logic
    const response = await retryWithBackoff(() =>
      fetch(`${VERIFIEDU_BASE_URL}/GetAadhaarDetailsById`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: "", // Embedded in API
          companyid: "", // Embedded in API
        },
        body: JSON.stringify({
          unique_request_number,
        }),
      })
    );

    const responseData = await response.json();

    if (!responseData.success || !responseData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: responseData.message || "Failed to fetch Aadhaar details",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Map address fields
    const addresses = responseData.addresses || [];
    const primaryAddress = addresses[0] || {};
    
    const mappedAddress = {
      line1: [primaryAddress.house, primaryAddress.street, primaryAddress.landmark]
        .filter(Boolean)
        .join(", "),
      line2: [primaryAddress.locality, primaryAddress.vtc, primaryAddress.subdist]
        .filter(Boolean)
        .join(", "),
      city: primaryAddress.dist || "",
      state: primaryAddress.state || "",
      pincode: primaryAddress.pc || "",
    };

    // Update vendor_verifications record
    if (vendor_id) {
      await supabase
        .from("vendor_verifications")
        .update({
          status: responseData.is_valid ? "success" : "failed",
          response_data: {
            aadhaar_uid: responseData.aadhaar_uid,
            name: responseData.name,
            gender: responseData.gender,
            dob: responseData.dob,
            is_valid: responseData.is_valid,
            address: mappedAddress,
          },
          verified_at: new Date().toISOString(),
        })
        .eq("vendor_id", vendor_id)
        .eq("verification_type", "aadhaar")
        .eq("status", "in_progress");
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          aadhaar_uid: responseData.aadhaar_uid,
          name: responseData.name,
          gender: responseData.gender,
          dob: responseData.dob,
          is_valid: responseData.is_valid,
          address: mappedAddress,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Aadhaar details retrieval error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to retrieve Aadhaar details",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
