import { useState, useRef } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";
import {
  Upload,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import Papa from "papaparse";

const CSV_COLUMNS = [
  "company_name",
  "trade_name",
  "category_name",
  "gst_number",
  "pan_number",
  "primary_contact_name",
  "primary_mobile",
  "primary_email",
  "bank_name",
  "bank_branch",
  "bank_account_number",
  "bank_ifsc",
];

interface ParsedRow {
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

interface FailedRow {
  row_number: number;
  company_name: string;
  errors: string[];
}

interface ImportResult {
  success_count: number;
  failed_rows: FailedRow[];
}

function downloadTemplate() {
  const exampleRow =
    "Acme Supplies Pvt Ltd,Acme Supplies,IT & Software,27AAHCA3239L1ZH,AAHCA3239L,John Doe,9876543210,john@acme.com,HDFC Bank,Mumbai Fort,123456789012,HDFC0001234";
  const csv = CSV_COLUMNS.join(",") + "\n" + exampleRow;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "vendor_import_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function downloadErrorCsv(failedRows: FailedRow[]) {
  const header = "row_number,company_name,errors";
  const lines = failedRows.map(
    (r) =>
      `${r.row_number},"${(r.company_name || "").replace(/"/g, '""')}","${r.errors.join("; ").replace(/"/g, '""')}"`
  );
  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "import_errors.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function BulkImportVendors() {
  const { tenant } = useTenant();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError(null);
    setResult(null);
    setParsedRows([]);

    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          setParseError("Could not parse the CSV file. Please use the template.");
          return;
        }
        if (results.data.length === 0) {
          setParseError("The CSV file has no data rows.");
          return;
        }
        if (results.data.length > 500) {
          setParseError("Maximum 500 rows per import. Please split your file.");
          return;
        }
        setParsedRows(results.data);
      },
      error: () => {
        setParseError("Failed to read the file. Ensure it is a valid CSV.");
      },
    });

    // Reset input so same file can be re-selected after reset
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!parsedRows.length || !tenant?.id) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("bulk-import-vendors", {
        body: { rows: parsedRows, tenant_id: tenant.id },
      });

      if (error) throw error;

      setResult(data as ImportResult);

      if ((data as ImportResult).success_count > 0) {
        toast.success(
          `${(data as ImportResult).success_count} vendor${(data as ImportResult).success_count !== 1 ? "s" : ""} imported successfully`
        );
      }
      if ((data as ImportResult).failed_rows.length > 0) {
        toast.warning(`${(data as ImportResult).failed_rows.length} row(s) had errors`);
      }
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setParsedRows([]);
    setFileName(null);
    setParseError(null);
    setResult(null);
  };

  const previewRows = parsedRows.slice(0, 10);

  return (
    <StaffLayout title="Bulk Import Vendors">
      <div className="flex-1 overflow-auto p-4 space-y-4 max-w-5xl">
        {/* Instructions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Bulk Vendor Import
            </CardTitle>
            <CardDescription>
              Upload a CSV file to add multiple vendors at once. Each row creates a vendor in
              <strong> pending_review</strong> status. Counts against your subscription quota.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV Template
              </Button>
              {!result && (
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {fileName ? "Change File" : "Select CSV File"}
                </Button>
              )}
              {result && (
                <Button variant="outline" onClick={handleReset}>
                  Import Another File
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {fileName && !parseError && (
              <p className="text-sm text-muted-foreground">
                <FileText className="h-3.5 w-3.5 inline mr-1" />
                {fileName} — {parsedRows.length} row{parsedRows.length !== 1 ? "s" : ""} found
              </p>
            )}

            {parseError && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {parseError}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Table */}
        {parsedRows.length > 0 && !result && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Preview{parsedRows.length > 10 ? ` (first 10 of ${parsedRows.length} rows)` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-3 py-2 font-medium">#</th>
                    <th className="text-left px-3 py-2 font-medium">Company Name</th>
                    <th className="text-left px-3 py-2 font-medium">Category</th>
                    <th className="text-left px-3 py-2 font-medium">GST</th>
                    <th className="text-left px-3 py-2 font-medium">PAN</th>
                    <th className="text-left px-3 py-2 font-medium">Contact</th>
                    <th className="text-left px-3 py-2 font-medium">Mobile</th>
                    <th className="text-left px-3 py-2 font-medium">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-1.5 max-w-[160px] truncate">{row.company_name}</td>
                      <td className="px-3 py-1.5">{row.category_name}</td>
                      <td className="px-3 py-1.5 font-mono">{row.gst_number}</td>
                      <td className="px-3 py-1.5 font-mono">{row.pan_number}</td>
                      <td className="px-3 py-1.5">{row.primary_contact_name}</td>
                      <td className="px-3 py-1.5">{row.primary_mobile}</td>
                      <td className="px-3 py-1.5 max-w-[160px] truncate">{row.primary_email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
            <div className="p-4 border-t">
              <Button onClick={handleSubmit} disabled={isSubmitting || !tenant?.id}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing {parsedRows.length} rows…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import {parsedRows.length} Vendor{parsedRows.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Results Panel */}
        {result && (
          <div className="space-y-3">
            {/* Success count */}
            {result.success_count > 0 && (
              <Card className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">
                      {result.success_count} vendor{result.success_count !== 1 ? "s" : ""} imported
                      successfully
                    </p>
                    <p className="text-sm text-muted-foreground">
                      They appear in the Vendor List with status{" "}
                      <span className="font-mono">pending_review</span>.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Failed rows */}
            {result.failed_rows.length > 0 && (
              <Card className="border-destructive/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2 text-destructive">
                      <XCircle className="h-5 w-5" />
                      {result.failed_rows.length} row{result.failed_rows.length !== 1 ? "s" : ""}{" "}
                      failed
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => downloadErrorCsv(result.failed_rows)}>
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Download Errors
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-3 py-2 font-medium w-12">Row</th>
                        <th className="text-left px-3 py-2 font-medium">Company Name</th>
                        <th className="text-left px-3 py-2 font-medium">Errors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.failed_rows.map((row) => (
                        <tr key={row.row_number} className="border-b last:border-0">
                          <td className="px-3 py-2 text-muted-foreground">{row.row_number}</td>
                          <td className="px-3 py-2">{row.company_name || "—"}</td>
                          <td className="px-3 py-2 text-destructive">
                            {row.errors.join(" · ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {result.success_count === 0 && result.failed_rows.length === 0 && (
              <Card>
                <CardContent className="p-4 text-center text-muted-foreground">
                  No rows were processed.
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
