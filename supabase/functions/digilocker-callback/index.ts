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
    let id: string | null = null;
    let isSuccess = false;

    // Try to extract ID from different possible sources
    const url = new URL(req.url);
    
    // Check query parameters first
    id = url.searchParams.get("id");
    
    // Check path to determine success or failure
    const pathname = url.pathname;
    if (pathname.includes("/success")) {
      isSuccess = true;
    }

    // If no ID in query params, try to parse request body
    if (!id && req.method === "POST") {
      const contentType = req.headers.get("content-type") || "";
      let bodyData: any = {};

      if (contentType.includes("application/json")) {
        bodyData = await req.json();
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const text = await req.text();
        const params = new URLSearchParams(text);
        bodyData = Object.fromEntries(params);
      } else if (contentType.includes("text/plain")) {
        const text = await req.text();
        // Try to parse as JSON
        try {
          bodyData = JSON.parse(text);
        } catch {
          // If not JSON, try to extract ID from text
          const match = text.match(/["\']?id["\']?\s*[:=]\s*["\']([^"\']+)["\']?/);
          if (match) {
            id = match[1];
          }
        }
      }

      // Extract ID from parsed body
      if (!id && bodyData) {
        id = bodyData.id || bodyData.unique_request_number || bodyData.request_id;
      }
    }

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No verification ID found in callback",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Determine redirect URL based on success or failure
    const baseUrl = `${url.protocol}//${url.host}`;
    const redirectPath = isSuccess ? "/digilocker/success" : "/digilocker/failure";
    const redirectUrl = `${baseUrl}${redirectPath}?id=${encodeURIComponent(id)}`;

    // Return 302 redirect
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
      },
    });
  } catch (error) {
    console.error("DigiLocker callback error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Callback processing failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
