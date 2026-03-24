import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GST_RATE = 0.18;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { action, ...params } = await req.json();

    // Auth check
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let tenantId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;

      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("tenant_id")
          .eq("user_id", userId)
          .maybeSingle();
        tenantId = profile?.tenant_id || null;
      }
    }

    if (!userId || !tenantId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── GET SUBSCRIPTION ────────────────────────────────────────
    if (action === "get_subscription") {
      const { data: sub } = await supabase
        .from("org_subscriptions")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      return new Response(
        JSON.stringify({ subscription: sub }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── GET PLANS ───────────────────────────────────────────────
    if (action === "get_plans") {
      const { data: plans } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("monthly_price");

      return new Response(
        JSON.stringify({ plans }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── GET TRANSACTIONS ────────────────────────────────────────
    if (action === "get_transactions") {
      const page = params.page || 1;
      const perPage = 20;
      const from = (page - 1) * perPage;

      const { data: transactions, count } = await supabase
        .from("billing_transactions")
        .select("*", { count: "exact" })
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .range(from, from + perPage - 1);

      return new Response(
        JSON.stringify({ transactions, total: count, page, per_page: perPage }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── VALIDATE COUPON ──────────────────────────────────────────
    if (action === "validate_coupon") {
      const { code } = params;
      if (!code) {
        return new Response(
          JSON.stringify({ error: "Coupon code is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code.toUpperCase().trim())
        .eq("is_active", true)
        .maybeSingle();

      if (!coupon) {
        return new Response(
          JSON.stringify({ valid: false, error: "Invalid coupon code" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const today = new Date().toISOString().split("T")[0];
      if (today < coupon.valid_from || today > coupon.valid_until) {
        return new Response(
          JSON.stringify({ valid: false, error: "Coupon has expired" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (coupon.max_uses && coupon.times_used >= coupon.max_uses) {
        return new Response(
          JSON.stringify({ valid: false, error: "Coupon usage limit reached" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if this tenant already used this coupon
      const { data: existing } = await supabase
        .from("coupon_redemptions")
        .select("id")
        .eq("coupon_id", coupon.id)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ valid: false, error: "Coupon already used by your organization" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          valid: true,
          discount_percent: coupon.discount_percent,
          valid_until: coupon.valid_until,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── CREATE RAZORPAY ORDER (for subscription payment) ────────
    if (action === "create_order") {
      const { plan_id, coupon_code } = params;

      // Get plan details
      const { data: plan } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("id", plan_id)
        .single();

      if (!plan || plan.monthly_price === 0) {
        return new Response(
          JSON.stringify({ error: "Invalid plan" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate coupon if provided
      let discountPercent = 0;
      let couponId: string | null = null;
      if (coupon_code) {
        const { data: coupon } = await supabase
          .from("coupons")
          .select("*")
          .eq("code", coupon_code.toUpperCase().trim())
          .eq("is_active", true)
          .maybeSingle();

        const today = new Date().toISOString().split("T")[0];
        if (
          coupon &&
          today >= coupon.valid_from &&
          today <= coupon.valid_until &&
          (!coupon.max_uses || coupon.times_used < coupon.max_uses)
        ) {
          // Check tenant hasn't already used it
          const { data: existing } = await supabase
            .from("coupon_redemptions")
            .select("id")
            .eq("coupon_id", coupon.id)
            .eq("tenant_id", tenantId)
            .maybeSingle();

          if (!existing) {
            discountPercent = coupon.discount_percent;
            couponId = coupon.id;
          }
        }
      }

      const listPrice = plan.monthly_price;
      const discount = Math.round(listPrice * discountPercent / 100);
      const baseAmount = listPrice - discount;
      const gstAmount = Math.round(baseAmount * GST_RATE * 100) / 100;
      const totalAmount = Math.round((baseAmount + gstAmount) * 100); // Razorpay uses paise

      const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
      const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

      if (!razorpayKeyId || !razorpayKeySecret) {
        return new Response(
          JSON.stringify({ error: "Payment gateway not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        },
        body: JSON.stringify({
          amount: totalAmount,
          currency: "INR",
          receipt: `sub_${tenantId}_${Date.now()}`,
          notes: {
            tenant_id: tenantId,
            plan_id: plan_id,
            list_price: listPrice,
            discount,
            discount_percent: discountPercent,
            coupon_code: coupon_code || null,
            coupon_id: couponId,
            base_amount: baseAmount,
            gst_amount: gstAmount,
          },
        }),
      });

      const order = await orderResponse.json();

      if (!orderResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to create payment order", details: order }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          order,
          razorpay_key_id: razorpayKeyId,
          plan,
          list_price: listPrice,
          discount,
          discount_percent: discountPercent,
          coupon_id: couponId,
          base_amount: baseAmount,
          gst_amount: gstAmount,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── VERIFY PAYMENT & ACTIVATE SUBSCRIPTION ─────────────────
    if (action === "verify_payment") {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id, coupon_id } = params;

      const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
      if (!razorpayKeySecret) {
        return new Response(
          JSON.stringify({ error: "Payment gateway not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify signature
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const key = new TextEncoder().encode(razorpayKeySecret);
      const message = new TextEncoder().encode(body);
      const cryptoKey = await crypto.subtle.importKey(
        "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
      );
      const signature = await crypto.subtle.sign("HMAC", cryptoKey, message);
      const expectedSignature = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (expectedSignature !== razorpay_signature) {
        return new Response(
          JSON.stringify({ error: "Payment verification failed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get plan
      const { data: plan } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("id", plan_id)
        .single();

      if (!plan) {
        return new Response(
          JSON.stringify({ error: "Plan not found" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const now = new Date();
      const cycleEnd = new Date(now);
      cycleEnd.setMonth(cycleEnd.getMonth() + 1);

      // Update subscription
      await supabase
        .from("org_subscriptions")
        .upsert({
          tenant_id: tenantId,
          plan: plan_id,
          status: "active",
          vendor_limit: plan.vendor_limit,
          vendors_used: 0,
          monthly_price: plan.monthly_price,
          billing_cycle_start: now.toISOString().split("T")[0],
          billing_cycle_end: cycleEnd.toISOString().split("T")[0],
          updated_at: now.toISOString(),
        }, { onConflict: "tenant_id" });

      // Recalculate amounts (coupon may have been applied at order creation)
      let discountPercent = 0;
      if (coupon_id) {
        const { data: coupon } = await supabase
          .from("coupons")
          .select("discount_percent")
          .eq("id", coupon_id)
          .maybeSingle();
        discountPercent = coupon?.discount_percent || 0;
      }

      const listPrice = plan.monthly_price;
      const discount = Math.round(listPrice * discountPercent / 100);
      const baseAmount = listPrice - discount;
      const gstAmount = Math.round(baseAmount * GST_RATE * 100) / 100;

      // Log transactions
      const txns: any[] = [];

      if (discount > 0) {
        txns.push({
          tenant_id: tenantId,
          type: "debit",
          category: "subscription_payment",
          amount: listPrice,
          description: `${plan.name} plan - monthly subscription (list price)`,
          reference_id: razorpay_payment_id,
        });
        txns.push({
          tenant_id: tenantId,
          type: "credit",
          category: "adjustment",
          amount: discount,
          description: `Coupon discount (${discountPercent}% off)`,
          reference_id: razorpay_payment_id,
        });
      } else {
        txns.push({
          tenant_id: tenantId,
          type: "debit",
          category: "subscription_payment",
          amount: baseAmount,
          description: `${plan.name} plan - monthly subscription`,
          reference_id: razorpay_payment_id,
        });
      }

      txns.push({
        tenant_id: tenantId,
        type: "debit",
        category: "gst",
        amount: gstAmount,
        description: `GST on ${plan.name} plan subscription`,
        reference_id: razorpay_payment_id,
      });

      await supabase.from("billing_transactions").insert(txns);

      // Record coupon redemption and increment usage
      if (coupon_id) {
        await supabase.from("coupon_redemptions").insert({
          coupon_id,
          tenant_id: tenantId,
          razorpay_payment_id,
        });
        const { data: c } = await supabase.from("coupons").select("times_used").eq("id", coupon_id).single();
        if (c) {
          await supabase.from("coupons").update({ times_used: c.times_used + 1 }).eq("id", coupon_id);
        }
      }

      return new Response(
        JSON.stringify({ success: true, plan: plan_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
