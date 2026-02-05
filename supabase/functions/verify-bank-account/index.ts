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
     const { accountNumber, ifscCode, vendorId } = await req.json();
 
     // Validate inputs
     if (!accountNumber || !ifscCode) {
       return new Response(JSON.stringify({ 
         success: false, 
         error: "Account number and IFSC code are required" 
       }), {
         status: 400,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     // Validate IFSC format (11 characters: 4 letters + 0 + 6 alphanumeric)
     const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
     if (!ifscRegex.test(ifscCode.toUpperCase())) {
       return new Response(JSON.stringify({ 
         success: false, 
         error: "Invalid IFSC format. Expected format: ABCD0123456" 
       }), {
         status: 400,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     const adminClient = createClient(
       Deno.env.get("SUPABASE_URL")!,
       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
     );
 
    // Mock mode if credentials not configured
    if (!VERIFIEDU_TOKEN || VERIFIEDU_TOKEN === "YOUR_API_TOKEN_HERE") {
       console.log("VerifiedU credentials not configured, using mock mode");
       
       const mockResponse = {
         account_number: accountNumber,
         ifsc_code: ifscCode.toUpperCase(),
         account_holder_name: "MOCK ACCOUNT HOLDER",
         bank_name: "Mock Bank Ltd",
         is_valid: true,
       };
 
       // Save mock verification to database if vendorId provided
       if (vendorId) {
         await adminClient.from("vendor_verifications").insert({
           vendor_id: vendorId,
           verification_type: "bank_account",
           verification_source: "verifiedu",
           status: "success",
           request_data: { account_number: accountNumber, ifsc_code: ifscCode.toUpperCase() },
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
 
     // Call VerifiedU API (pennyless verification)
     console.log("Calling VerifiedU Bank Account verification API");
    const response = await fetch(`${VERIFIEDU_BASE_URL}/api/verifiedu/VerifyBankAccountNumber`, {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
        "token": VERIFIEDU_TOKEN,
        "companyid": VERIFIEDU_COMPANY_ID,
       },
       body: JSON.stringify({
         verification_type: "pennyless",
         account_number: accountNumber,
         account_ifsc: ifscCode.toUpperCase(),
       }),
     });
 
     const responseData = await response.json();
     console.log("VerifiedU response:", JSON.stringify(responseData));
 
     const isValid = responseData.data?.is_valid || responseData.is_valid || false;
     const verifiedData = {
       account_number: accountNumber,
       ifsc_code: ifscCode.toUpperCase(),
       account_holder_name: responseData.data?.account_holder_name || responseData.account_holder_name,
       bank_name: responseData.data?.bank_name || responseData.bank_name || "",
       is_valid: isValid,
     };
 
     // Save verification to database if vendorId provided
     if (vendorId) {
       await adminClient.from("vendor_verifications").insert({
         vendor_id: vendorId,
         verification_type: "bank_account",
         verification_source: "verifiedu",
         status: isValid ? "success" : "failed",
         request_data: { account_number: accountNumber, ifsc_code: ifscCode.toUpperCase() },
         response_data: responseData.data || responseData,
         verified_at: new Date().toISOString(),
       });
     }
 
     return new Response(JSON.stringify({
       success: true,
       data: verifiedData,
     }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
 
   } catch (error) {
     console.error("Bank account verification error:", error);
     return new Response(JSON.stringify({ 
       success: false, 
       error: "Internal server error" 
     }), {
       status: 500,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   }
 });