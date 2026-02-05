 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { panNumber, vendorId } = await req.json();
 
     // Validate PAN format
     const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
     if (!panNumber || !panRegex.test(panNumber.toUpperCase())) {
       return new Response(JSON.stringify({ 
         success: false, 
         error: "Invalid PAN format. Expected format: ABCDE1234F" 
       }), {
         status: 400,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     const adminClient = createClient(
       Deno.env.get("SUPABASE_URL")!,
       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
     );
 
     // Fetch credentials from database
     const { data: settings, error: settingsError } = await adminClient
       .from("verifiedu_settings")
       .select("*")
       .eq("is_active", true)
       .maybeSingle();
 
     const verifieduToken = settings?.api_token;
     const companyId = settings?.company_id;
     const baseUrl = settings?.api_base_url;
 
     // Mock mode if credentials not configured or settings inactive
     if (!settings || !verifieduToken || !companyId || !baseUrl) {
       console.log("VerifiedU credentials not configured, using mock mode");
       
       const mockResponse = {
         name: "MOCK VERIFIED NAME",
         dob: "1990-01-15",
         is_valid: true,
       };
 
       // Save mock verification to database if vendorId provided
       if (vendorId) {
         await adminClient.from("vendor_verifications").insert({
           vendor_id: vendorId,
           verification_type: "pan",
           verification_source: "verifiedu",
           status: "success",
           request_data: { pan_number: panNumber.toUpperCase() },
           response_data: mockResponse,
           verified_at: new Date().toISOString(),
           remarks: "Mock verification - API credentials not configured",
         });
       }
 
       return new Response(JSON.stringify({
         success: true,
         data: mockResponse,
         is_mock: true,
       }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
     }
 
     // Call VerifiedU API
     console.log("Calling VerifiedU PAN verification API");
     const response = await fetch(`${baseUrl}/api/verifiedu/VerifyPAN`, {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         "token": verifieduToken,
         "companyid": companyId,
       },
       body: JSON.stringify({ PanNumber: panNumber.toUpperCase() }),
     });
 
     const responseData = await response.json();
     console.log("VerifiedU response:", JSON.stringify(responseData));
 
     const isValid = responseData.data?.is_valid || responseData.is_valid || false;
     const verifiedData = {
       name: responseData.data?.name || responseData.name,
       dob: responseData.data?.dob || responseData.dob,
       is_valid: isValid,
     };
 
     // Save verification to database if vendorId provided
     if (vendorId) {
       await adminClient.from("vendor_verifications").insert({
         vendor_id: vendorId,
         verification_type: "pan",
         verification_source: "verifiedu",
         status: isValid ? "success" : "failed",
         request_data: { pan_number: panNumber.toUpperCase() },
         response_data: responseData.data || responseData,
         verified_at: new Date().toISOString(),
       });
     }
 
     return new Response(JSON.stringify({
       success: true,
       data: verifiedData,
     }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
 
   } catch (error) {
     console.error("PAN verification error:", error);
     return new Response(JSON.stringify({ 
       success: false, 
       error: "Internal server error" 
     }), {
       status: 500,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   }
 });