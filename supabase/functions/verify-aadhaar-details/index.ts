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
     const { uniqueRequestNumber, vendorId } = await req.json();
 
     if (!uniqueRequestNumber) {
       return new Response(JSON.stringify({ 
         success: false, 
         error: "Unique request number is required" 
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
 
     // Find the existing verification record
     let resolvedVendorId = vendorId;
     if (!resolvedVendorId) {
       const { data: pendingRecords } = await adminClient
         .from("vendor_verifications")
         .select("vendor_id, request_data")
         .eq("status", "in_progress")
         .eq("verification_type", "aadhaar")
         .order("created_at", { ascending: false })
         .limit(20);
 
       const matchingRecord = pendingRecords?.find((r: any) => 
         r.request_data?.unique_request_number === uniqueRequestNumber
       );
 
       if (matchingRecord) {
         resolvedVendorId = matchingRecord.vendor_id;
       }
     }
 
     // Mock mode if credentials not configured or settings inactive
     if (!settings || !verifieduToken || !companyId || !baseUrl) {
       console.log("VerifiedU credentials not configured, using mock mode");
       
       const mockData = {
         aadhaar_uid: "XXXX-XXXX-1234",
         name: "MOCK AADHAAR NAME",
         gender: "Male",
         dob: "1990-01-15",
         addresses: [{
           combined: "123 Mock Street, Mock City - 123456",
           house: "123",
           street: "Mock Street",
           dist: "Mock City",
           state: "Mock State",
           pc: "123456",
         }],
         is_valid: true,
       };
 
       // Update verification record
       if (resolvedVendorId) {
         await adminClient
           .from("vendor_verifications")
           .update({
             status: "success",
             response_data: mockData,
             verified_at: new Date().toISOString(),
             remarks: "Mock verification - API credentials not configured",
           })
           .match({ 
             vendor_id: resolvedVendorId, 
             verification_type: "aadhaar",
             status: "in_progress" 
           });
       }
 
       return new Response(JSON.stringify({
         success: true,
         data: mockData,
         is_mock: true,
         vendorId: resolvedVendorId,
       }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
     }
 
     // Call VerifiedU API
     console.log("Calling VerifiedU GetAadhaarDetailsById API");
     const response = await fetch(`${baseUrl}/api/verifiedu/GetAadhaarDetailsById`, {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         "token": verifieduToken,
         "companyid": companyId,
       },
       body: JSON.stringify({ unique_request_number: uniqueRequestNumber }),
     });
 
     const responseData = await response.json();
     console.log("VerifiedU response:", JSON.stringify(responseData));
 
     const isValid = responseData.is_valid || responseData.data?.is_valid || false;
     const aadhaarData = {
       aadhaar_uid: responseData.aadhaar_uid || responseData.data?.aadhaar_uid,
       name: responseData.name || responseData.data?.name,
       gender: responseData.gender || responseData.data?.gender,
       dob: responseData.dob || responseData.data?.dob,
       addresses: responseData.addresses || responseData.data?.addresses,
       is_valid: isValid,
     };
 
     // Update verification record
     if (resolvedVendorId) {
       await adminClient
         .from("vendor_verifications")
         .update({
           status: isValid ? "success" : "failed",
           response_data: aadhaarData,
           verified_at: new Date().toISOString(),
         })
         .match({ 
           vendor_id: resolvedVendorId, 
           verification_type: "aadhaar",
           status: "in_progress" 
         });
     }
 
     return new Response(JSON.stringify({
       success: true,
       data: aadhaarData,
       vendorId: resolvedVendorId,
     }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
 
   } catch (error) {
     console.error("Aadhaar details error:", error);
     return new Response(JSON.stringify({ 
       success: false, 
       error: "Internal server error" 
     }), {
       status: 500,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   }
 });