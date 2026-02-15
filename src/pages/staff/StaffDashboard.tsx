import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useStaffVendorQueue } from "@/hooks/useStaffWorkflow";
import { useDataRequests } from "@/hooks/useDataRequests";
import { useFraudAlerts } from "@/hooks/useFraudAlerts";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import {
  Loader2,
  UserPlus,
  Bell,
  Clock,
  FileCheck,
  Users,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  FileSearch,
  AlertTriangle,
  Zap,
  Target,
  Rocket,
  Shield,
  FileText,
  ChevronRight,
} from "lucide-react";

export default function StaffDashboard() {
  const { user } = useAuth();
  const { roles, isAdmin, isLoading: rolesLoading } = useUserRoles();
  const { data: vendors, isLoading: vendorsLoading } = useStaffVendorQueue();
  const { data: dataRequestStats } = useDataRequests();
  const { alerts: fraudAlerts, stats: fraudStats } = useFraudAlerts();
  const navigate = useNavigate();

  // Fetch user profile for greeting
  const { data: profile } = useQuery({
    queryKey: ["dashboard-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, department")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch document stats
  const { data: docStats } = useQuery({
    queryKey: ["dashboard-doc-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_documents")
        .select("status, expiry_date");
      if (error) throw error;
      const total = data?.length || 0;
      const approved = data?.filter((d) => d.status === "approved").length || 0;
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiring =
        data?.filter(
          (d) =>
            d.expiry_date &&
            new Date(d.expiry_date) > now &&
            new Date(d.expiry_date) <= thirtyDays
        ).length || 0;
      return {
        total,
        approved,
        complianceRate: total > 0 ? Math.round((approved / total) * 100) : 0,
        expiring,
      };
    },
    enabled: !!user,
  });

  if (rolesLoading || vendorsLoading) {
    return (
      <StaffLayout title="Dashboard">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </StaffLayout>
    );
  }

  // Calculate vendor stats
  const draft = vendors?.filter((v) => v.current_status === "draft").length || 0;
  const pendingReview = vendors?.filter((v) => v.current_status === "pending_review").length || 0;
  const inVerification = vendors?.filter((v) => v.current_status === "in_verification").length || 0;
  const pendingApproval = vendors?.filter((v) => v.current_status === "pending_approval").length || 0;
  const approved = vendors?.filter((v) => v.current_status === "approved").length || 0;
  const totalVendors = vendors?.length || 0;

  // Recent activity (last 8 updated vendors)
  const recentActivity = vendors?.slice(0, 8) || [];

  // Pending fraud alerts
  const pendingAlerts = fraudAlerts.filter((a) => a.status === "pending").slice(0, 3);

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      draft: "Draft Created",
      pending_review: "Submitted for Review",
      in_verification: "In Verification",
      pending_approval: "Pending Approval",
      approved: "Approved",
      rejected: "Rejected",
      sent_back: "Sent Back",
      consent_withdrawn: "Consent Withdrawn",
    };
    return map[status] || status;
  };

  const statusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle2 className="h-4 w-4" />;
    if (status === "rejected" || status === "sent_back") return <AlertTriangle className="h-4 w-4" />;
    return <FileSearch className="h-4 w-4" />;
  };

  const statusColor = (status: string) => {
    if (status === "approved") return "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]";
    if (status === "rejected") return "bg-destructive/10 text-destructive";
    if (status === "sent_back") return "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]";
    return "bg-primary/10 text-primary";
  };

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <StaffLayout title="Dashboard">
      <div className="p-4 md:p-6 space-y-5 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Vendor Operations{" "}
              <span className="bg-gradient-to-r from-primary to-[hsl(var(--accent))] bg-clip-text text-transparent">
                Command Center
              </span>
            </h1>
            <div className="flex items-center gap-4 mt-1.5">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--success))] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--success))]"></span>
                </span>
                Live Data
              </span>
              <span className="text-xs text-muted-foreground">
                Welcome, <span className="font-semibold text-foreground">{firstName}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/staff/fraud-alerts")}
              className="relative h-10 w-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center hover:bg-destructive/15 transition-colors"
            >
              <Bell className="h-4 w-4 text-destructive" />
              {fraudStats.pending > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
                  {fraudStats.pending}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate("/staff/invite-vendor")}
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-primary/25 transition-all hover:-translate-y-0.5"
            >
              <UserPlus className="h-4 w-4" />
              Invite Vendor
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pending Review */}
          <button
            onClick={() => navigate("/staff/queue")}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(var(--warning))]/10 to-[hsl(var(--warning))]/5 border border-[hsl(var(--warning))]/20 p-5 text-left transition-all hover:shadow-lg hover:shadow-[hsl(var(--warning))]/10 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pending Review</span>
              <span className="flex items-center gap-0.5 text-[11px] font-bold text-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10 px-1.5 py-0.5 rounded">
                <ArrowUpRight className="h-3 w-3" />
                Active
              </span>
            </div>
            <p className="text-4xl font-extrabold bg-gradient-to-br from-[hsl(var(--warning))] to-[hsl(38,92%,40%)] bg-clip-text text-transparent">
              {pendingReview}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Awaiting initial review</p>
            <div className="absolute bottom-0 right-0 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity">
              <Clock className="h-20 w-20 -mb-3 -mr-3" />
            </div>
          </button>

          {/* Approved */}
          <button
            onClick={() => navigate("/staff/queue")}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(var(--success))]/10 to-[hsl(var(--success))]/5 border border-[hsl(var(--success))]/20 p-5 text-left transition-all hover:shadow-lg hover:shadow-[hsl(var(--success))]/10 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Approved</span>
              <span className="flex items-center gap-0.5 text-[11px] font-bold text-[hsl(var(--success))] bg-[hsl(var(--success))]/10 px-1.5 py-0.5 rounded">
                <ArrowUpRight className="h-3 w-3" />
                +{approved}
              </span>
            </div>
            <p className="text-4xl font-extrabold bg-gradient-to-br from-[hsl(var(--success))] to-[hsl(92,47%,35%)] bg-clip-text text-transparent">
              {approved}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Fully onboarded vendors</p>
            <div className="absolute bottom-0 right-0 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity">
              <FileCheck className="h-20 w-20 -mb-3 -mr-3" />
            </div>
          </button>

          {/* Total Vendors */}
          <button
            onClick={() => navigate("/staff/queue")}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-5 text-left transition-all hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Vendors</span>
              <span className="flex items-center gap-0.5 text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                <Users className="h-3 w-3" />
                All
              </span>
            </div>
            <p className="text-4xl font-extrabold bg-gradient-to-br from-primary to-[hsl(204,100%,25%)] bg-clip-text text-transparent">
              {totalVendors}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">{approved} active, {totalVendors - approved} processing</p>
            <div className="absolute bottom-0 right-0 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity">
              <Users className="h-20 w-20 -mb-3 -mr-3" />
            </div>
          </button>

          {/* Fraud Alerts */}
          <button
            onClick={() => navigate("/staff/fraud-alerts")}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20 p-5 text-left transition-all hover:shadow-lg hover:shadow-destructive/10 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Fraud Alerts</span>
              {fraudStats.critical > 0 && (
                <span className="flex items-center gap-0.5 text-[11px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                  <ArrowDownRight className="h-3 w-3" />
                  Critical
                </span>
              )}
            </div>
            <p className="text-4xl font-extrabold bg-gradient-to-br from-destructive to-[hsl(0,72%,40%)] bg-clip-text text-transparent">
              {fraudStats.pending}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">{fraudStats.critical} critical attention needed</p>
            <div className="absolute bottom-0 right-0 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity">
              <ShieldAlert className="h-20 w-20 -mb-3 -mr-3" />
            </div>
          </button>
        </div>

        {/* Pipeline + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Onboarding Pipeline */}
          <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-foreground">Onboarding Pipeline</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">Real-time vendor progression</p>
              </div>
              <button
                onClick={() => navigate("/staff/queue")}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                View Queue <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Submitted", count: draft + pendingReview, color: "primary", sub: `${pendingReview} pending` },
                { label: "Processing", count: inVerification, color: "warning", sub: "In verification" },
                { label: "Verified", count: pendingApproval, color: "accent", sub: "Awaiting approval" },
                { label: "Approved", count: approved, color: "success", sub: "Onboarded" },
              ].map((stage) => (
                <button
                  key={stage.label}
                  onClick={() => navigate("/staff/queue")}
                  className="group text-center p-4 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all hover:-translate-y-0.5"
                >
                  <p
                    className={`text-3xl md:text-4xl font-extrabold bg-gradient-to-b from-[hsl(var(--${stage.color}))] to-[hsl(var(--${stage.color}))/70] bg-clip-text text-transparent`}
                  >
                    {stage.count}
                  </p>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-2">
                    {stage.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">{stage.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-foreground">Recent Activity</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">Live updates</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-0 max-h-[260px]">
              {recentActivity.map((vendor) => (
                <button
                  key={vendor.id}
                  onClick={() => navigate(`/staff/vendor/${vendor.id}`)}
                  className="flex items-start gap-3 w-full p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${statusColor(vendor.current_status)}`}>
                    {statusIcon(vendor.current_status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {vendor.company_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {statusLabel(vendor.current_status)}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                      {formatDistanceToNow(new Date(vendor.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Key Metrics */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-base font-bold text-foreground mb-4">Key Metrics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">Avg Processing Time</p>
                  <p className="text-2xl font-bold text-foreground">18h</p>
                </div>
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">Compliance Rate</p>
                  <p className="text-2xl font-bold text-foreground">{docStats?.complianceRate ?? 0}%</p>
                </div>
                <div className="h-11 w-11 rounded-xl bg-[hsl(var(--success))]/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-[hsl(var(--success))]" />
                </div>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">Expiring Documents</p>
                  <p className="text-2xl font-bold text-foreground">{docStats?.expiring ?? 0}</p>
                </div>
                <div className="h-11 w-11 rounded-xl bg-[hsl(var(--warning))]/10 flex items-center justify-center">
                  <Rocket className="h-5 w-5 text-[hsl(var(--warning))]" />
                </div>
              </div>
            </div>
          </div>

          {/* Compliance / DPDP */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">Compliance</h2>
            </div>
            {isAdmin ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Pending Requests</p>
                    <p className="text-2xl font-bold text-foreground">{dataRequestStats?.pending ?? 0}</p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Overdue</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-foreground">{dataRequestStats?.overdue ?? 0}</p>
                      {(dataRequestStats?.overdue ?? 0) > 0 && (
                        <Badge variant="destructive" className="text-[10px]">Action Required</Badge>
                      )}
                    </div>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                </div>
                <button
                  onClick={() => navigate("/admin/dpdp-audit")}
                  className="w-full text-xs text-primary font-semibold hover:underline flex items-center justify-center gap-1 pt-2"
                >
                  View DPDP Audit Dashboard <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Shield className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-xs">Admin access required</p>
              </div>
            )}
          </div>

          {/* Critical Alerts */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">Critical Alerts</h2>
              <button
                onClick={() => navigate("/staff/fraud-alerts")}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                View All <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-3">
              {pendingAlerts.length > 0 ? (
                pendingAlerts.map((alert) => (
                  <button
                    key={alert.id}
                    onClick={() => navigate("/staff/fraud-alerts")}
                    className="w-full text-left p-3 rounded-xl bg-destructive/5 border border-destructive/15 border-l-[3px] border-l-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <p className="text-xs font-bold text-destructive">{alert.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{alert.description}</p>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mb-2 text-[hsl(var(--success))] opacity-50" />
                  <p className="text-xs">No pending alerts</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
