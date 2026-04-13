import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Service-role-only: called internally after vendor status changes.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { tenant_id, event, vendor_id, payload } = await req.json();

    if (!tenant_id || !event) {
      return new Response(JSON.stringify({ error: "tenant_id and event are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get active endpoints for this tenant
    const { data: endpoints, error: epErr } = await supabase
      .from("webhook_endpoints")
      .select("id, url, secret, events")
      .eq("tenant_id", tenant_id)
      .eq("is_active", true);

    if (epErr || !endpoints?.length) {
      return new Response(JSON.stringify({ delivered: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Filter endpoints that subscribe to this event
    const matchingEndpoints = endpoints.filter(
      (ep: { events: string[] }) => ep.events.includes(event) || ep.events.includes("*")
    );

    if (matchingEndpoints.length === 0) {
      return new Response(JSON.stringify({ delivered: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const fullPayload = {
      event,
      vendor_id: vendor_id || null,
      timestamp: new Date().toISOString(),
      data: payload || {},
    };
    const payloadStr = JSON.stringify(fullPayload);

    let delivered = 0;

    for (const endpoint of matchingEndpoints) {
      // HMAC-SHA256 signature
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(endpoint.secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const sigBuffer = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(payloadStr)
      );
      const signature =
        "sha256=" +
        Array.from(new Uint8Array(sigBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

      // Create delivery record
      const { data: delivery } = await supabase
        .from("webhook_deliveries")
        .insert({
          endpoint_id: endpoint.id,
          vendor_id: vendor_id || null,
          event,
          payload: fullPayload,
          status: "pending",
          attempts: 1,
        })
        .select("id")
        .single();

      // POST to endpoint with 10-second timeout
      let responseStatus: number | null = null;
      let deliveryStatus = "failed";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Insync-Signature": signature,
            "X-Insync-Event": event,
          },
          body: payloadStr,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        responseStatus = response.status;
        if (response.status >= 200 && response.status < 300) {
          deliveryStatus = "delivered";
          delivered++;
        }
      } catch (_) {
        clearTimeout(timeoutId);
        // Timeout or network error — stays failed
      }

      if (delivery?.id) {
        await supabase
          .from("webhook_deliveries")
          .update({ status: deliveryStatus, response_status: responseStatus })
          .eq("id", delivery.id);
      }
    }

    return new Response(JSON.stringify({ delivered }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook send error:", err);
    return new Response(JSON.stringify({ error: "Webhook delivery failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
