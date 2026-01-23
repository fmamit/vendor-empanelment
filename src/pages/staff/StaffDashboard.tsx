import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
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
  Settings,
  LogOut,
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  Building2,
  ChevronRight,
  Loader2
} from "lucide-react";

export default function StaffDashboard() {
  const { user, userType, loading, signOut } = useAuth();
  const { roles, isAdmin, isMaker, isChecker, isApprover, isLoading: rolesLoading } = useUserRoles();
  const { data: vendors, isLoading: vendorsLoading } = useStaffVendorQueue();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || userType !== "staff")) {
      navigate("/staff/login");
    }
  }, [user, userType, loading, navigate]);

  if (loading || rolesLoading) {
    return (
      <MobileLayout title="Dashboard">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Calculate stats
  const pendingReview = vendors?.filter(v => v.current_status === "pending_review").length || 0;
  const inVerification = vendors?.filter(v => v.current_status === "in_verification").length || 0;
  const pendingApproval = vendors?.filter(v => v.current_status === "pending_approval").length || 0;
  const totalActive = pendingReview + inVerification + pendingApproval;
  const approved = vendors?.filter(v => v.current_status === "approved").length || 0;

  return (
    <MobileLayout title="Staff Dashboard">
      <div className="flex-1 p-4 space-y-4 overflow-auto">
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

        {/* Admin Actions */}
        {isAdmin && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Administration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start h-14" onClick={() => navigate("/admin/users")}>
                <Users className="h-5 w-5 mr-3" />
                <div className="flex-1 text-left">
                  <p className="font-medium">User Management</p>
                  <p className="text-xs text-muted-foreground">Manage staff and assign roles</p>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" className="w-full justify-start h-14" onClick={() => navigate("/admin/settings")}>
                <Settings className="h-5 w-5 mr-3" />
                <div className="flex-1 text-left">
                  <p className="font-medium">System Settings</p>
                  <p className="text-xs text-muted-foreground">Categories, documents, configuration</p>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Sign Out */}
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </MobileLayout>
  );
}
