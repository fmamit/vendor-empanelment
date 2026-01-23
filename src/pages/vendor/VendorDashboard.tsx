import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  LogOut,
  ChevronRight
} from "lucide-react";

export default function VendorDashboard() {
  const { user, userType, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || userType !== "vendor")) {
      navigate("/vendor/login");
    }
  }, [user, userType, loading, navigate]);

  if (loading) {
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
    <MobileLayout title="My Dashboard">
      <div className="flex-1 p-4 space-y-4">
        {/* Status Card */}
        <Card className="border-2 border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-warning/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Application Status</p>
                <p className="font-semibold text-lg">Pending Review</p>
              </div>
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                In Progress
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-medium text-sm">My Documents</p>
              <p className="text-xs text-muted-foreground">4 uploaded</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="font-medium text-sm">Action Required</p>
              <p className="text-xs text-muted-foreground">2 items</p>
            </CardContent>
          </Card>
        </div>

        {/* Document Checklist */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Document Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span className="flex-1 text-sm">GST Registration Certificate</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span className="flex-1 text-sm">PAN Card</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="flex-1 text-sm">Cancelled Cheque</span>
              <Badge variant="destructive" className="text-xs">Required</Badge>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg bg-muted">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 text-sm">Trade License</span>
              <Badge variant="outline" className="text-xs">Optional</Badge>
            </div>
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
