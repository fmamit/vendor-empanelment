import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useStaffVendorQueue } from "@/hooks/useStaffWorkflow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateInvitationDialog } from "@/components/staff/CreateInvitationDialog";
import { 
  FileSearch, 
  CheckSquare, 
  ThumbsUp,
  TrendingUp,
  Clock,
  AlertTriangle,
  Building2,
  ChevronRight,
  Loader2,
  ShieldAlert,
  UserPlus
} from "lucide-react";

export default function StaffDashboard() {
  const { user, userType, loading, userTypeLoading } = useAuth();
  const { roles, isAdmin, isMaker, isChecker, isApprover, isLoading: rolesLoading } = useUserRoles();
  const { data: vendors, isLoading: vendorsLoading } = useStaffVendorQueue();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("[StaffDashboard] Effect check:", { loading, userTypeLoading, hasUser: !!user, userType });
    // Wait for both auth loading AND userType loading to complete before redirecting
    if (!loading && !userTypeLoading && (!user || userType !== "staff")) {
      console.log("[StaffDashboard] Redirecting to login...");
      navigate("/staff/login");
    }
  }, [user, userType, loading, userTypeLoading, navigate]);

  // Show loading while auth or userType is being determined
  if (loading || userTypeLoading || rolesLoading) {
    return (
      <StaffLayout title="Dashboard">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </StaffLayout>
    );
  }

  // Calculate stats
  const pendingReview = vendors?.filter(v => v.current_status === "pending_review").length || 0;
  const inVerification = vendors?.filter(v => v.current_status === "in_verification").length || 0;
  const pendingApproval = vendors?.filter(v => v.current_status === "pending_approval").length || 0;
  const totalActive = pendingReview + inVerification + pendingApproval;
  const approved = vendors?.filter(v => v.current_status === "approved").length || 0;

  return (
    <StaffLayout title="Dashboard">
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Welcome & Roles */}
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <CardContent className="p-6">
            <p className="text-sm opacity-80">Welcome back</p>
            <p className="font-semibold text-xl">Capital India Staff</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {roles.map((role) => (
                <Badge key={role} variant="secondary" className="bg-white/20 text-white border-0">
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold">{totalActive}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">{approved}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Building2 className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{vendors?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <ShieldAlert className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-2xl font-bold">3</p>
              <p className="text-sm text-muted-foreground">Alerts</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        {(isMaker || isAdmin) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateInvitationDialog 
                trigger={
                  <Button className="w-full h-12" variant="default">
                    <UserPlus className="h-5 w-5 mr-2" />
                    Invite New Vendor
                  </Button>
                }
              />
            </CardContent>
          </Card>
        )}

        {/* Role-Based Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">My Workqueue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(isMaker || isAdmin) && (
              <Button variant="outline" className="w-full justify-start h-16" onClick={() => navigate("/staff/queue")}>
                <FileSearch className="h-5 w-5 mr-3 text-warning" />
                <div className="flex-1 text-left">
                  <p className="font-medium">Pending Review</p>
                  <p className="text-xs text-muted-foreground">Initial document verification</p>
                </div>
                <Badge variant="secondary">{pendingReview}</Badge>
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            
            {(isChecker || isAdmin) && (
              <Button variant="outline" className="w-full justify-start h-16" onClick={() => navigate("/staff/queue")}>
                <CheckSquare className="h-5 w-5 mr-3 text-primary" />
                <div className="flex-1 text-left">
                  <p className="font-medium">In Verification</p>
                  <p className="text-xs text-muted-foreground">Detailed verification check</p>
                </div>
                <Badge variant="secondary">{inVerification}</Badge>
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            
            {(isApprover || isAdmin) && (
              <Button variant="outline" className="w-full justify-start h-16" onClick={() => navigate("/staff/queue")}>
                <ThumbsUp className="h-5 w-5 mr-3 text-success" />
                <div className="flex-1 text-left">
                  <p className="font-medium">Pending Approval</p>
                  <p className="text-xs text-muted-foreground">Final approval stage</p>
                </div>
                <Badge variant="secondary">{pendingApproval}</Badge>
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Fraud Alerts */}
        <Card className="border-warning/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-warning" />
              Fraud Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-start h-16" onClick={() => navigate("/staff/fraud-alerts")}>
              <AlertTriangle className="h-5 w-5 mr-3 text-warning" />
              <div className="flex-1 text-left">
                <p className="font-medium">View Fraud Alerts</p>
                <p className="text-xs text-muted-foreground">Monitor security & duplicates</p>
              </div>
              <Badge variant="destructive">3</Badge>
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}
