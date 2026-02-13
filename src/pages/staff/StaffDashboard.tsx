import { useNavigate } from "react-router-dom";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useStaffVendorQueue } from "@/hooks/useStaffWorkflow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  UserCircle,
  UserPlus
} from "lucide-react";

export default function StaffDashboard() {
  const { user } = useAuth();
  const { roles, isAdmin, isMaker, isChecker, isApprover, isLoading: rolesLoading } = useUserRoles();
  const { data: vendors, isLoading: vendorsLoading } = useStaffVendorQueue();
  const navigate = useNavigate();

  if (rolesLoading) {
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
      <div className="p-4 md:p-6 space-y-4 max-w-4xl">
        {/* Welcome & Roles */}
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <CardContent className="p-4">
            <p className="text-sm opacity-80">Welcome back</p>
            <p className="font-semibold text-lg">Capital India Staff</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              {roles.map((role) => (
                <Badge key={role} variant="secondary" className="bg-white/20 text-white border-0">
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <Clock className="h-6 w-6 text-warning mx-auto mb-1" />
              <p className="text-xl font-bold">{totalActive}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <TrendingUp className="h-6 w-6 text-success mx-auto mb-1" />
              <p className="text-xl font-bold">{approved}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Building2 className="h-6 w-6 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold">{vendors?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Role-Based Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">My Workqueue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(isMaker || isAdmin) && (
              <Button variant="outline" className="w-full justify-start h-14" onClick={() => navigate("/staff/queue")}>
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
              <Button variant="outline" className="w-full justify-start h-14" onClick={() => navigate("/staff/queue")}>
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
              <Button variant="outline" className="w-full justify-start h-14" onClick={() => navigate("/staff/queue")}>
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

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-14 flex flex-col items-center justify-center" onClick={() => navigate("/staff/profile")}>
            <UserCircle className="h-5 w-5 mb-1 text-primary" />
            <span className="text-xs font-medium">My Profile</span>
          </Button>
          <Button variant="outline" className="h-14 flex flex-col items-center justify-center" onClick={() => navigate("/staff/queue")}>
            <UserPlus className="h-5 w-5 mb-1 text-primary" />
            <span className="text-xs font-medium">Invite a Vendor</span>
          </Button>
        </div>

        {/* Fraud Alerts */}
        <Card className="border-warning/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-warning" />
              Fraud Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-start h-14" onClick={() => navigate("/staff/fraud-alerts")}>
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
