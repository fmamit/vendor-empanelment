 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const url = new URL(req.url);
     const pathParts = url.pathname.split("/");
     const lastPart = pathParts[pathParts.length - 1];
 
     // Determine success or failure based on path
     const isSuccess = lastPart === "success" || url.pathname.includes("success");
     const targetPath = isSuccess ? "/digilocker/success" : "/digilocker/failure";
 
     let id: string | null = null;
     let vendorId: string | null = null;
     let returnUrl: string | null = null;
     let isMock: string | null = null;
 
     // Extract from query params
     id = url.searchParams.get("id");
     vendorId = url.searchParams.get("vendorId");
     returnUrl = url.searchParams.get("returnUrl");
     isMock = url.searchParams.get("mock");
 
     // If POST, try to parse body for additional params
     if (req.method === "POST") {
       try {
         const bodyText = await req.text();
         if (bodyText) {
           const params = new URLSearchParams(bodyText);
           id = id || params.get("id") || params.get("unique_request_number");
         }
       } catch (e) {
         console.log("Could not parse POST body:", e);
       }
     }
 
     // Determine frontend URL
     let frontendUrl = Deno.env.get("FRONTEND_URL") || "https://onboardly-path.lovable.app";
 
     if (returnUrl) {
       try {
         const parsedUrl = new URL(decodeURIComponent(returnUrl));
         frontendUrl = parsedUrl.origin;
       } catch (e) {
         console.log("Could not parse returnUrl:", e);
       }
     }
 
     // Build redirect URL with query params
     const queryParams = new URLSearchParams();
     if (id) queryParams.set("id", id);
     if (vendorId) queryParams.set("vendorId", vendorId);
     if (isMock) queryParams.set("mock", isMock);
 
     const queryString = queryParams.toString();
     const redirectUrl = `${frontendUrl}${targetPath}${queryString ? "?" + queryString : ""}`;
 
     console.log(`DigiLocker callback: Redirecting to ${redirectUrl}`);
 
     // 302 redirect
     return new Response(null, {
       status: 302,
       headers: { 
         "Location": redirectUrl,
         ...corsHeaders 
       },
     });
 
   } catch (error) {
     console.error("DigiLocker callback error:", error);
     const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://onboardly-path.lovable.app";
     return new Response(null, {
       status: 302,
       headers: { 
         "Location": `${frontendUrl}/digilocker/failure?error=callback_failed`,
         ...corsHeaders 
       },
     });
   }
 });