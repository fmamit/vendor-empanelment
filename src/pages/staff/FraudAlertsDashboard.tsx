import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useFraudAlerts, FraudAlert } from "@/hooks/useFraudAlerts";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FraudAlertCard } from "@/components/fraud/FraudAlertCard";
import { FraudAlertDetail } from "@/components/fraud/FraudAlertDetail";
import { 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

export default function FraudAlertsDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRoles();
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);

  const { alerts, stats, isLoading } = useFraudAlerts({
    status: activeTab === 'all' ? undefined : [activeTab as any],
  });

  const handleDismiss = (alertId: string, reason: string) => {
    toast.success("Alert dismissed successfully");
  };

  const handleConfirm = (alertId: string) => {
    toast.success("Fraud confirmed - vendor flagged for review");
  };

  const handleViewVendor = (vendorId: string) => {
    navigate(`/staff/vendor/${vendorId}`);
  };

  return (
    <StaffLayout title="Fraud Detection">
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="p-6 border-b bg-card">
          <h1 className="text-2xl font-semibold">Fraud Detection</h1>
          <p className="text-sm text-muted-foreground">Monitor and review security alerts</p>
        </div>

        {/* Stats Cards */}
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-destructive/30">
            <CardContent className="p-4 text-center">
              <ShieldAlert className="h-6 w-6 text-destructive mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.critical}</p>
              <p className="text-sm text-muted-foreground">Critical</p>
            </CardContent>
          </Card>
          <Card className="border-warning/30">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-6 w-6 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.high}</p>
              <p className="text-sm text-muted-foreground">High</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.dismissed}</p>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
              <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Alerts List */}
        <div className="p-6 space-y-3">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
                <p className="font-medium">No alerts found</p>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'pending' ? "All caught up! No pending alerts." : "No alerts in this category."}
                </p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert) => (
              <FraudAlertCard
                key={alert.id}
                alert={alert}
                onClick={() => setSelectedAlert(alert)}
              />
            ))
          )}
        </div>
      </div>

      {/* Alert Detail Dialog */}
      {selectedAlert && (
        <FraudAlertDetail
          alert={selectedAlert}
          open={!!selectedAlert}
          onOpenChange={(open) => !open && setSelectedAlert(null)}
          onDismiss={handleDismiss}
          onConfirm={handleConfirm}
          onViewVendor={handleViewVendor}
        />
      )}
    </StaffLayout>
  );
}
