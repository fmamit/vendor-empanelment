import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
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
  AlertTriangle
} from "lucide-react";

export default function StaffDashboard() {
  const { user, userType, loading, signOut } = useAuth();
  const { roles, isAdmin, isMaker, isChecker, isApprover, isLoading: rolesLoading } = useUserRoles();
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
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </MobileLayout>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <MobileLayout title="Staff Dashboard">
      <div className="flex-1 p-4 space-y-4">
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
              <p className="text-xl font-bold">12</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <TrendingUp className="h-6 w-6 text-success mx-auto mb-1" />
              <p className="text-xl font-bold">8</p>
              <p className="text-xs text-muted-foreground">This Week</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <AlertTriangle className="h-6 w-6 text-destructive mx-auto mb-1" />
              <p className="text-xl font-bold">3</p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </CardContent>
          </Card>
        </div>

        {/* Role-Based Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">My Workqueue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isMaker && (
              <Button variant="outline" className="w-full justify-start h-14" onClick={() => navigate("/staff/review")}>
                <FileSearch className="h-5 w-5 mr-3 text-primary" />
                <div className="flex-1 text-left">
                  <p className="font-medium">Pending Review</p>
                  <p className="text-xs text-muted-foreground">5 vendors awaiting initial review</p>
                </div>
                <Badge>5</Badge>
              </Button>
            )}
            
            {isChecker && (
              <Button variant="outline" className="w-full justify-start h-14" onClick={() => navigate("/staff/verify")}>
                <CheckSquare className="h-5 w-5 mr-3 text-accent" />
                <div className="flex-1 text-left">
                  <p className="font-medium">Verification Queue</p>
                  <p className="text-xs text-muted-foreground">4 vendors in verification</p>
                </div>
                <Badge variant="secondary">4</Badge>
              </Button>
            )}
            
            {isApprover && (
              <Button variant="outline" className="w-full justify-start h-14" onClick={() => navigate("/staff/approve")}>
                <ThumbsUp className="h-5 w-5 mr-3 text-success" />
                <div className="flex-1 text-left">
                  <p className="font-medium">Pending Approval</p>
                  <p className="text-xs text-muted-foreground">3 vendors ready for approval</p>
                </div>
                <Badge variant="outline">3</Badge>
              </Button>
            )}
            
            {isAdmin && (
              <>
                <Button variant="outline" className="w-full justify-start h-14" onClick={() => navigate("/admin/users")}>
                  <Users className="h-5 w-5 mr-3" />
                  <div className="flex-1 text-left">
                    <p className="font-medium">User Management</p>
                    <p className="text-xs text-muted-foreground">Manage staff and roles</p>
                  </div>
                </Button>
                
                <Button variant="outline" className="w-full justify-start h-14" onClick={() => navigate("/admin/settings")}>
                  <Settings className="h-5 w-5 mr-3" />
                  <div className="flex-1 text-left">
                    <p className="font-medium">System Settings</p>
                    <p className="text-xs text-muted-foreground">Categories, documents, config</p>
                  </div>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

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
