import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function isValidIndianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  const cleaned = digits.length === 12 && digits.startsWith("91") ? digits.substring(2) : digits;
  return /^[6-9]\d{9}$/.test(cleaned);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidGST(gst: string): boolean {
  return gst.length === 15 && /^[0-9A-Z]{15}$/.test(gst);
}

function isValidPAN(pan: string): boolean {
  return pan.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan);
}

function isValidIFSC(ifsc: string): boolean {
  return ifsc.length === 11 && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
}

function cleanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.substring(2) : digits;
}

interface VendorRow {
  company_name?: string;
  trade_name?: string;
  category_name?: string;
  gst_number?: string;
  pan_number?: string;
  primary_contact_name?: string;
  primary_mobile?: string;
  primary_email?: string;
  bank_name?: string;
  bank_branch?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authenticate staff user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isStaff } = await supabaseAdmin.rpc("is_internal_staff", { _user_id: user.id });
    if (!isStaff) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { rows, tenant_id }: { rows: VendorRow[]; tenant_id: string } = await req.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(JSON.stringify({ error: "No rows provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (rows.length > 500) {
      return new Response(JSON.stringify({ error: "Maximum 500 rows per import" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!tenant_id) {
      return new Response(JSON.stringify({ error: "tenant_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load active categories for name → id mapping
    const { data: categories } = await supabaseAdmin
      .from("vendor_categories")
      .select("id, name")
      .eq("is_active", true);
    const categoryMap = new Map<string, string>(
      (categories || []).map((c: { id: string; name: string }) => [c.name.toLowerCase(), c.id])
    );

    // Validate all rows upfront
    type ValidRow = VendorRow & { _row_number: number; _category_id: string | null };
    const validRows: ValidRow[] = [];
    const failedRows: Array<{ row_number: number; company_name: string; errors: string[] }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;
      const errors: string[] = [];

      if (!row.company_name?.trim()) errors.push("company_name is required");
      if (!row.primary_contact_name?.trim()) errors.push("primary_contact_name is required");
      if (!row.primary_mobile?.trim()) {
        errors.push("primary_mobile is required");
      } else if (!isValidIndianPhone(row.primary_mobile)) {
        errors.push("Invalid phone number");
      }
      if (!row.primary_email?.trim()) {
        errors.push("primary_email is required");
      } else if (!isValidEmail(row.primary_email)) {
        errors.push("Invalid email address");
      }
      if (row.gst_number?.trim() && !isValidGST(row.gst_number.trim().toUpperCase())) {
        errors.push("Invalid GST number");
      }
      if (row.pan_number?.trim() && !isValidPAN(row.pan_number.trim().toUpperCase())) {
        errors.push("Invalid PAN number");
      }
      if (row.bank_ifsc?.trim() && !isValidIFSC(row.bank_ifsc.trim().toUpperCase())) {
        errors.push("Invalid IFSC code");
      }

      let categoryId: string | null = null;
      if (row.category_name?.trim()) {
        categoryId = categoryMap.get(row.category_name.trim().toLowerCase()) || null;
        if (!categoryId) errors.push(`Unknown category: "${row.category_name}"`);
      }

      if (errors.length > 0) {
        failedRows.push({ row_number: rowNum, company_name: row.company_name || "", errors });
      } else {
        validRows.push({ ...row, _row_number: rowNum, _category_id: categoryId });
      }
    }

    // Process valid rows with quota check
    let successCount = 0;
    let quotaExhausted = false;

    for (const row of validRows) {
      if (quotaExhausted) {
        failedRows.push({
          row_number: row._row_number,
          company_name: row.company_name!,
          errors: ["Subscription limit reached"],
        });
        continue;
      }

      const { data: usageResult, error: usageErr } = await supabaseAdmin.rpc(
        "increment_vendor_usage",
        { _tenant_id: tenant_id }
      );

      if (!usageErr && usageResult === -2) {
        quotaExhausted = true;
        failedRows.push({
          row_number: row._row_number,
          company_name: row.company_name!,
          errors: ["Subscription limit reached"],
        });
        continue;
      }

      const { error: insertError } = await supabaseAdmin.from("vendors").insert({
        company_name: row.company_name!.trim().substring(0, 255),
        trade_name: row.trade_name?.trim().substring(0, 255) || null,
        category_id: row._category_id,
        gst_number: row.gst_number?.trim().toUpperCase() || null,
        pan_number: row.pan_number?.trim().toUpperCase() || null,
        primary_contact_name: row.primary_contact_name!.trim().substring(0, 255),
        primary_mobile: cleanPhone(row.primary_mobile!),
        primary_email: row.primary_email!.trim(),
        bank_name: row.bank_name?.trim().substring(0, 255) || null,
        bank_branch: row.bank_branch?.trim().substring(0, 255) || null,
        bank_account_number: row.bank_account_number?.trim().substring(0, 100) || null,
        bank_ifsc: row.bank_ifsc?.trim().toUpperCase() || null,
        referred_by: user.id,
        tenant_id,
        current_status: "pending_review",
        submitted_at: new Date().toISOString(),
      });

      if (insertError) {
        failedRows.push({
          row_number: row._row_number,
          company_name: row.company_name!,
          errors: [insertError.message],
        });
      } else {
        successCount++;
      }
    }

    failedRows.sort((a, b) => a.row_number - b.row_number);

    return new Response(
      JSON.stringify({ success_count: successCount, failed_rows: failedRows }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Bulk import error:", err);
    return new Response(JSON.stringify({ error: "Import failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
