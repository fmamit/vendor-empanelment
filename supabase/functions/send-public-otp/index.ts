import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { identifier, identifierType } = await req.json();

    if (!identifier || !identifierType) {
      return new Response(
        JSON.stringify({ error: "identifier and identifierType are required" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["phone", "email"].includes(identifierType)) {
      return new Response(
        JSON.stringify({ error: "identifierType must be 'phone' or 'email'" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate identifier format
    if (identifierType === "phone") {
      const clean = identifier.replace(/\D/g, "");
      if (clean.length !== 10 || !/^[6-9]/.test(clean)) {
        return new Response(
          JSON.stringify({ error: "Invalid 10-digit Indian mobile number" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
        return new Response(
          JSON.stringify({ error: "Invalid email address" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Normalize identifier for storage
    const normalizedIdentifier = identifierType === "phone"
      ? `+91${identifier.replace(/\D/g, "")}`
      : identifier.toLowerCase().trim();

    // Rate limit: max 5 OTPs per identifier per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from("public_otp_verifications")
      .select("*", { count: "exact", head: true })
      .eq("identifier", normalizedIdentifier)
      .gte("created_at", oneHourAgo);

    if (countError) {
      console.error("Rate limit check error:", countError);
    } else if ((count || 0) >= 5) {
      return new Response(
        JSON.stringify({ error: "Too many OTP requests. Please try again later." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate OTP and store
    const otpCode = generateOtp();

    const { data: otpRecord, error: insertError } = await supabase
      .from("public_otp_verifications")
      .insert({
        identifier: normalizedIdentifier,
        identifier_type: identifierType,
        otp_code: otpCode,
      })
      .select("session_id")
      .single();

    if (insertError || !otpRecord) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sessionId = otpRecord.session_id;

    // ===== PHONE PATH: WhatsApp via Exotel =====
    if (identifierType === "phone") {
      // Read WhatsApp config from database
      const { data: wsConfig } = await supabase
        .from("whatsapp_settings")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .single();

      if (!wsConfig?.exotel_sid || !wsConfig?.exotel_api_key || !wsConfig?.exotel_api_token || !wsConfig?.whatsapp_source_number) {
        // Test mode - WhatsApp not configured
        console.log("WhatsApp not configured - returning test mode OTP:", otpCode);
        return new Response(
          JSON.stringify({
            success: true,
            sessionId,
            message: "WhatsApp not configured - Test Mode",
            isTestMode: true,
            testOtp: otpCode,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const toPhone = normalizedIdentifier.replace("+", "");
      const fromNumber = wsConfig.whatsapp_source_number.replace("+", "");
      const subdomain = wsConfig.exotel_subdomain || "api.exotel.com";

      const payload = {
        custom_data: toPhone,
        to: toPhone,
        from: fromNumber,
        whatsapp: {
          messages: [
            {
              content: {
                template: {
                  name: "psotp1",
                  language: "en_US",
                  components: [
                    {
                      type: "body",
                      parameters: [{ type: "text", text: otpCode }],
                    },
                    {
                      type: "button",
                      sub_type: "url",
                      index: "0",
                      parameters: [{ type: "text", text: otpCode }],
                    },
                  ],
                },
              },
            },
          ],
        },
      };

      const exotelUrl = `https://${subdomain}/v2/accounts/${wsConfig.exotel_sid}/messages`;
      const authString = base64Encode(
        new TextEncoder().encode(`${wsConfig.exotel_api_key}:${wsConfig.exotel_api_token}`)
      );

      const exotelResponse = await fetch(exotelUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authString}`,
        },
        body: JSON.stringify(payload),
      });

      if (!exotelResponse.ok) {
        const errorText = await exotelResponse.text();
        console.error("Exotel API error:", exotelResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: "Failed to send WhatsApp message" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.info(`OTP sent successfully via WhatsApp to ${normalizedIdentifier}`);
      return new Response(
        JSON.stringify({ success: true, sessionId, message: "OTP sent to your WhatsApp" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== EMAIL PATH: Resend API =====
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px 32px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0 0 8px 0; font-size: 20px; font-weight: 600;">Paisaa Saarthi</h2>
          <p style="color: #94a3b8; margin: 0 0 32px 0; font-size: 14px;">Loan Application Verification</p>
          <p style="color: #cbd5e1; margin: 0 0 16px 0; font-size: 14px;">Your verification code is:</p>
          <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin: 0 0 24px 0;">
            <span style="color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: monospace;">${otpCode}</span>
          </div>
          <p style="color: #94a3b8; margin: 0; font-size: 12px;">This code expires in 5 minutes. Do not share it with anyone.</p>
        </div>
      </div>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Paisaa Saarthi <noreply@in-sync.co.in>",
        to: [normalizedIdentifier],
        subject: "Your OTP for Loan Application",
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend API error:", resendResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.info(`OTP sent successfully via Email to ${normalizedIdentifier}`);
    return new Response(
      JSON.stringify({ success: true, sessionId, message: "OTP sent to your email" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-public-otp:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
