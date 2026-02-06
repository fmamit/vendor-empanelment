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
    const contentType = req.headers.get("content-type") || "";

    // Handle FormData uploads
    if (!contentType.includes("multipart/form-data") && !contentType.includes("application/x-www-form-urlencoded")) {
      // Try JSON fallback
      const body = await req.json();
      return new Response(JSON.stringify({ error: "Expected multipart form data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const token = form.get("token") as string | null;
    const documentTypeId = form.get("document_type_id") as string | null;

    if (!file || !token || !documentTypeId) {
      return new Response(JSON.stringify({ error: "Missing file, token, or document_type_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validate token
    const { data: invitation, error: invErr } = await supabase
      .from("vendor_invitations")
      .select("id, vendor_id")
      .eq("token", token)
      .single();

    if (invErr || !invitation) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate unique file path
    const ext = file.name.split(".").pop() || "bin";
    const filePath = `referral/${invitation.id}/${documentTypeId}/${Date.now()}.${ext}`;

    // Upload to storage
    const { error: uploadErr } = await supabase.storage
      .from("vendor-documents")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadErr) {
      console.error("Storage upload error:", uploadErr);
      return new Response(JSON.stringify({ error: "File upload failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If vendor already created, link the document
    if (invitation.vendor_id) {
      await supabase.from("vendor_documents").insert({
        vendor_id: invitation.vendor_id,
        document_type_id: documentTypeId,
        file_name: file.name,
        file_url: filePath,
        file_size_bytes: file.size,
        status: "uploaded",
      });
    }

    return new Response(
      JSON.stringify({ success: true, file_path: filePath }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
