import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  Loader2 
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface VendorReportData {
  id: string;
  vendor_code: string;
  company_name: string;
  current_status: string;
  created_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  vendor_categories: { name: string };
}

interface WorkflowHistoryData {
  vendor_id: string;
  from_status: string;
  to_status: string;
  created_at: string;
  action_by: string;
}

export default function StaffReports() {
  const { isAdmin, isMaker, isChecker } = useUserRoles();
  const [activeReport, setActiveReport] = useState("status");

  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ["staff-vendors-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select(`
          id,
          vendor_code,
          company_name,
          current_status,
          created_at,
          submitted_at,
          approved_at,
          vendor_categories (name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as VendorReportData[];
    },
  });

  const { data: workflowHistory } = useQuery({
    queryKey: ["staff-workflow-history-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_history")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WorkflowHistoryData[];
    },
  });

  // Calculate TAT (Turnaround Time)
  const calculateTAT = (vendor: VendorReportData) => {
    if (!vendor.submitted_at || !vendor.approved_at) return null;
    const submitted = new Date(vendor.submitted_at);
    const approved = new Date(vendor.approved_at);
    const days = Math.round((approved.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  // Export to CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(","), ...data.map(row => 
      headers.map(h => {
        const val = row[h];
        return typeof val === "string" && val.includes(",") ? `"${val}"` : val;
      }).join(",")
    )].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isAdmin && !isMaker && !isChecker) {
    return (
      <StaffLayout title="Access Denied">
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-muted-foreground">Access required</p>
        </div>
      </StaffLayout>
    );
  }

  const statusData = vendors?.map(v => ({
    "Vendor Code": v.vendor_code,
    "Company Name": v.company_name,
    "Category": v.vendor_categories?.name,
    "Status": v.current_status,
    "Created": format(new Date(v.created_at), "dd MMM yyyy"),
    "Submitted": v.submitted_at ? format(new Date(v.submitted_at), "dd MMM yyyy") : "-",
  })) || [];

  const tatData = vendors
    ?.filter(v => v.approved_at)
    .map(v => ({
      "Vendor Code": v.vendor_code,
      "Company Name": v.company_name,
      "Submitted": v.submitted_at ? format(new Date(v.submitted_at), "dd MMM yyyy") : "-",
      "Approved": v.approved_at ? format(new Date(v.approved_at), "dd MMM yyyy") : "-",
      "TAT (Days)": calculateTAT(v) || 0,
    })) || [];

  const pendingData = vendors
    ?.filter(v => ["pending_review", "in_verification", "pending_approval", "sent_back"].includes(v.current_status))
    .map(v => ({
      "Vendor Code": v.vendor_code,
      "Company Name": v.company_name,
      "Status": v.current_status,
      "Pending Since": v.submitted_at ? formatDistanceToNow(new Date(v.submitted_at), { addSuffix: true }) : "-",
    })) || [];

  const statusCounts = vendors?.reduce((acc, v) => {
    acc[v.current_status] = (acc[v.current_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <StaffLayout title="Reports & Analytics">
      <div className="p-4 md:p-6 space-y-4 max-w-6xl">
        
        <Tabs value={activeReport} onValueChange={setActiveReport} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="status" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Status</span>
            </TabsTrigger>
            <TabsTrigger value="tat" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">TAT</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Pending</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Summary</span>
            </TabsTrigger>
          </TabsList>

          {/* Status Report */}
          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Vendor Status Report</CardTitle>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => exportToCSV(statusData, "vendor-status-report.csv")}
                  disabled={vendorsLoading || !statusData.length}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {vendorsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Vendor Code</th>
                          <th className="text-left py-2 px-2">Company Name</th>
                          <th className="text-left py-2 px-2">Category</th>
                          <th className="text-left py-2 px-2">Status</th>
                          <th className="text-left py-2 px-2">Created</th>
                          <th className="text-left py-2 px-2">Submitted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statusData.map((row, idx) => (
                          <tr key={idx} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-2 font-mono text-xs">{row["Vendor Code"]}</td>
                            <td className="py-2 px-2">{row["Company Name"]}</td>
                            <td className="py-2 px-2">{row["Category"]}</td>
                            <td className="py-2 px-2">
                              <Badge variant="outline">{row["Status"]}</Badge>
                            </td>
                            <td className="py-2 px-2 text-xs">{row["Created"]}</td>
                            <td className="py-2 px-2 text-xs">{row["Submitted"]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAT Report */}
          <TabsContent value="tat" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Approval Turnaround Time (TAT)</CardTitle>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => exportToCSV(tatData, "vendor-tat-report.csv")}
                  disabled={vendorsLoading || !tatData.length}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {vendorsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : tatData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Vendor Code</th>
                          <th className="text-left py-2 px-2">Company Name</th>
                          <th className="text-left py-2 px-2">Submitted</th>
                          <th className="text-left py-2 px-2">Approved</th>
                          <th className="text-left py-2 px-2 font-semibold">TAT (Days)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tatData.map((row, idx) => (
                          <tr key={idx} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-2 font-mono text-xs">{row["Vendor Code"]}</td>
                            <td className="py-2 px-2">{row["Company Name"]}</td>
                            <td className="py-2 px-2 text-xs">{row["Submitted"]}</td>
                            <td className="py-2 px-2 text-xs">{row["Approved"]}</td>
                            <td className="py-2 px-2 font-semibold text-primary">{row["TAT (Days)"]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No approved vendors yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Cases Report */}
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pending Cases</CardTitle>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => exportToCSV(pendingData, "pending-cases-report.csv")}
                  disabled={vendorsLoading || !pendingData.length}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {vendorsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : pendingData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Vendor Code</th>
                          <th className="text-left py-2 px-2">Company Name</th>
                          <th className="text-left py-2 px-2">Status</th>
                          <th className="text-left py-2 px-2">Pending Since</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingData.map((row, idx) => (
                          <tr key={idx} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-2 font-mono text-xs">{row["Vendor Code"]}</td>
                            <td className="py-2 px-2">{row["Company Name"]}</td>
                            <td className="py-2 px-2">
                              <Badge variant="outline" className="bg-warning/10">{row["Status"]}</Badge>
                            </td>
                            <td className="py-2 px-2 text-xs">{row["Pending Since"]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No pending cases</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Summary Report */}
          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <Card key={status}>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{count}</p>
                    <p className="text-xs text-muted-foreground capitalize">{status.replace(/_/g, " ")}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Vendors</p>
                    <p className="text-2xl font-bold">{vendors?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Approved</p>
                    <p className="text-2xl font-bold text-success">{statusCounts["approved"] || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Review</p>
                    <p className="text-2xl font-bold text-warning">{statusCounts["pending_review"] || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rejection Rate</p>
                    <p className="text-2xl font-bold text-destructive">
                      {vendors && vendors.length > 0 
                        ? Math.round((statusCounts["rejected"] || 0) / vendors.length * 100) 
                        : 0}%
                    </p>
                  </div>
                </div>

                {tatData.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-2">Average TAT</p>
                    <p className="text-2xl font-bold">
                      {Math.round(tatData.reduce((sum, row) => sum + (row["TAT (Days)"] || 0), 0) / tatData.length)} days
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StaffLayout>
  );
}
