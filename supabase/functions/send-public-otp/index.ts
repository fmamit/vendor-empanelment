import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple hash using Web Crypto API (SHA-256 + salt)
async function hashOtp(otp: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(otp + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyOtpHash(otp: string, salt: string, hash: string): Promise<boolean> {
  const computed = await hashOtp(otp, salt);
  return computed === hash;
}

function generateOtp(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, "0");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, otp, action, channel } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize phone: strip non-digits
    const cleanPhone = phone.replace(/\D/g, "");
    const fullPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : cleanPhone.startsWith("91") ? `+${cleanPhone}` : `+91${cleanPhone}`;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // ===== VERIFY MODE =====
    if (action === "verify") {
      if (!otp) {
        return new Response(
          JSON.stringify({ verified: false, error: "OTP is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find latest unverified, non-expired OTP for this phone
      const { data: otpRecord, error: fetchError } = await supabase
        .from("otp_verifications")
        .select("*")
        .eq("phone", fullPhone)
        .eq("verified", false)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !otpRecord) {
        return new Response(
          JSON.stringify({ verified: false, error: "No valid OTP found. Please request a new one." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check attempts
      if (otpRecord.attempts >= 5) {
        return new Response(
          JSON.stringify({ verified: false, error: "Too many attempts. Please request a new OTP." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify hash - salt is stored as the first 16 chars of otp_hash
      const salt = otpRecord.otp_hash.substring(0, 16);
      const storedHash = otpRecord.otp_hash.substring(16);
      const isValid = await verifyOtpHash(otp, salt, storedHash);

      if (isValid) {
        // Mark as verified
        await supabase
          .from("otp_verifications")
          .update({ verified: true })
          .eq("id", otpRecord.id);

        return new Response(
          JSON.stringify({ verified: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // Increment attempts
        await supabase
          .from("otp_verifications")
          .update({ attempts: otpRecord.attempts + 1 })
          .eq("id", otpRecord.id);

        return new Response(
          JSON.stringify({ verified: false, error: "Invalid OTP" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ===== SEND MODE =====
    const otpCode = generateOtp();

    // Generate salt and hash the OTP
    const saltArray = new Uint8Array(8);
    crypto.getRandomValues(saltArray);
    const salt = Array.from(saltArray).map((b) => b.toString(16).padStart(2, "0")).join("");
    const otpHash = salt + (await hashOtp(otpCode, salt));

    // Delete existing unverified OTPs for this phone
    await supabase
      .from("otp_verifications")
      .delete()
      .eq("phone", fullPhone)
      .eq("verified", false);

    // Insert new OTP record (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error: insertError } = await supabase
      .from("otp_verifications")
      .insert({
        phone: fullPhone,
        otp_hash: otpHash,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send via Exotel WhatsApp API
    const exotelSid = Deno.env.get("EXOTEL_SID");
    const exotelApiKey = Deno.env.get("EXOTEL_API_KEY");
    const exotelApiToken = Deno.env.get("EXOTEL_API_TOKEN");
    const whatsappFromNumber = Deno.env.get("WHATSAPP_SOURCE_NUMBER");

    if (!exotelSid || !exotelApiKey || !exotelApiToken || !whatsappFromNumber) {
      console.error("Missing Exotel configuration");
      return new Response(
        JSON.stringify({ success: false, error: "WhatsApp service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare Exotel payload - phone digits only (no + prefix)
    const toPhone = fullPhone.replace("+", "");
    const fromNumber = whatsappFromNumber.replace("+", "");

    const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;

    const payload = {
      custom_data: toPhone,
      status_callback: webhookUrl,
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

    const exotelUrl = `https://api.exotel.com/v2/accounts/${exotelSid}/messages`;
    const authString = base64Encode(new TextEncoder().encode(`${exotelApiKey}:${exotelApiToken}`));

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
        JSON.stringify({ success: false, error: "Failed to send WhatsApp message" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("OTP sent successfully via WhatsApp to", fullPhone);

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent via WhatsApp" }),
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
