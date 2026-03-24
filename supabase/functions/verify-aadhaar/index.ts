import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUREPASS_BASE_URL = Deno.env.get("SUREPASS_BASE_URL") || "https://sandbox.surepass.app";
const SUREPASS_TOKEN = Deno.env.get("SUREPASS_TOKEN") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vendor_id } = await req.json();

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: vendor } = await supabase.from("vendors").select("tenant_id").eq("id", vendor_id).maybeSingle();

    // Call Surepass Digilocker initialize to get SDK token
    const response = await fetch(`${SUREPASS_BASE_URL}/api/v1/digilocker/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUREPASS_TOKEN}`,
      },
      body: JSON.stringify({
        data: { signup_flow: true },
      }),
    });

    const responseData = await response.json();

    if (!responseData.success || !responseData.data) {
      return new Response(
        JSON.stringify({ success: false, error: responseData.message || "Verification service unavailable" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create verification record
    const verificationId = crypto.randomUUID();
    await supabase.from("vendor_verifications").insert({
      id: verificationId,
      vendor_id,
      tenant_id: vendor?.tenant_id,
      verification_type: "aadhaar",
      verification_source: "surepass",
      status: "pending",
      request_data: { client_id: responseData.data.client_id },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          client_id: responseData.data.client_id,
          token: responseData.data.token,
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
