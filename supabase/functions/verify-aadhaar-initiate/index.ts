import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// VerifiedU API Credentials (hardcoded)
const VERIFIEDU_TOKEN = "YOUR_API_TOKEN_HERE";
const VERIFIEDU_COMPANY_ID = "YOUR_COMPANY_ID_HERE";
const VERIFIEDU_BASE_URL = "https://api.verifiedu.in";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { vendorId, returnUrl } = await req.json();
 
     if (!vendorId) {
       return new Response(JSON.stringify({ 
         success: false, 
         error: "Vendor ID is required" 
       }), {
         status: 400,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     const supabaseUrl = Deno.env.get("SUPABASE_URL");
     const frontendUrl = Deno.env.get("FRONTEND_URL") || returnUrl?.split("/digilocker")[0] || "";
 
     const adminClient = createClient(
       Deno.env.get("SUPABASE_URL")!,
       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
     );
 
     // Build callback URLs
     const surl = `${supabaseUrl}/functions/v1/digilocker-callback/success?vendorId=${vendorId}&returnUrl=${encodeURIComponent(returnUrl || frontendUrl)}`;
     const furl = `${supabaseUrl}/functions/v1/digilocker-callback/failure?vendorId=${vendorId}&returnUrl=${encodeURIComponent(returnUrl || frontendUrl)}`;
 
    // Mock mode if credentials not configured
    if (!VERIFIEDU_TOKEN || VERIFIEDU_TOKEN === "YOUR_API_TOKEN_HERE") {
       console.log("VerifiedU credentials not configured, using mock mode");
       
       const mockRequestNumber = `mock_aadhaar_${Date.now()}`;
       
       // Create in_progress verification record
       await adminClient.from("vendor_verifications").insert({
         vendor_id: vendorId,
         verification_type: "aadhaar",
         verification_source: "verifiedu",
         status: "in_progress",
         request_data: { 
           unique_request_number: mockRequestNumber,
           initiated_at: new Date().toISOString(),
         },
         remarks: "Mock verification - API credentials not configured",
       });
 
       return new Response(JSON.stringify({
         success: true,
         data: {
           url: `${surl}&id=${mockRequestNumber}&mock=true`,
           unique_request_number: mockRequestNumber,
         },
         is_mock: true,
       }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
     }
 
     // Call VerifiedU API
     console.log("Calling VerifiedU Aadhaar DigiLocker API");
    const response = await fetch(`${VERIFIEDU_BASE_URL}/api/verifiedu/VerifyAadhaarViaDigilocker`, {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
        "token": VERIFIEDU_TOKEN,
        "companyid": VERIFIEDU_COMPANY_ID,
       },
       body: JSON.stringify({ surl, furl }),
     });
 
     const responseData = await response.json();
     console.log("VerifiedU response:", JSON.stringify(responseData));
 
     const uniqueRequestNumber = responseData.data?.unique_request_number || responseData.unique_request_number;
     const redirectUrl = responseData.data?.url || responseData.url;
 
     if (!redirectUrl || !uniqueRequestNumber) {
       return new Response(JSON.stringify({ 
         success: false, 
         error: "Failed to initiate Aadhaar verification" 
       }), {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     // Create pending verification record
     await adminClient.from("vendor_verifications").insert({
       vendor_id: vendorId,
       verification_type: "aadhaar",
       verification_source: "verifiedu",
       status: "in_progress",
       request_data: { 
         unique_request_number: uniqueRequestNumber,
         initiated_at: new Date().toISOString(),
       },
     });
 
     return new Response(JSON.stringify({
       success: true,
       data: {
         url: redirectUrl,
         unique_request_number: uniqueRequestNumber,
       },
     }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
 
   } catch (error) {
     console.error("Aadhaar initiation error:", error);
     return new Response(JSON.stringify({ 
       success: false, 
       error: "Internal server error" 
     }), {
       status: 500,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   }
 });