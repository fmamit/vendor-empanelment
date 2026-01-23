import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useStaffVendorQueue, VendorWithCategory } from "@/hooks/useStaffWorkflow";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Building2, 
  Clock, 
  ChevronRight,
  Filter,
  Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_LABELS = {
  draft: "Draft",
  pending_review: "Pending Review",
  in_verification: "In Verification",
  pending_approval: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_COLORS = {
  draft: "bg-muted text-muted-foreground",
  pending_review: "bg-warning/20 text-warning",
  in_verification: "bg-primary/20 text-primary",
  pending_approval: "bg-accent/20 text-accent",
  approved: "bg-success/20 text-success",
  rejected: "bg-destructive/20 text-destructive",
};

export default function StaffReviewQueue() {
  const navigate = useNavigate();
  const { user, userType, loading } = useAuth();
  const { isAdmin, isMaker, isChecker, isApprover, isLoading: rolesLoading } = useUserRoles();
  const { data: vendors, isLoading: vendorsLoading } = useStaffVendorQueue();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending_review");

  if (loading || rolesLoading) {
    return (
      <MobileLayout title="Review Queue">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  // Filter vendors based on role and tab
  const getFilteredVendors = (status: string) => {
    return vendors?.filter(v => {
      const matchesStatus = v.current_status === status;
      const matchesSearch = search === "" || 
        v.company_name.toLowerCase().includes(search.toLowerCase()) ||
        v.vendor_code?.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    }) || [];
  };

  const pendingReviewVendors = getFilteredVendors("pending_review");
  const inVerificationVendors = getFilteredVendors("in_verification");
  const pendingApprovalVendors = getFilteredVendors("pending_approval");
  const approvedVendors = getFilteredVendors("approved");
  const rejectedVendors = getFilteredVendors("rejected");

  const renderVendorCard = (vendor: VendorWithCategory) => (
    <Card 
      key={vendor.id} 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/staff/vendor/${vendor.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{vendor.company_name}</p>
            <p className="text-sm text-muted-foreground">{vendor.vendor_code || 'No code'}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {vendor.vendor_categories?.name}
              </Badge>
              <Badge className={`text-xs ${STATUS_COLORS[vendor.current_status]}`}>
                {STATUS_LABELS[vendor.current_status]}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {formatDistanceToNow(new Date(vendor.updated_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const tabs = [
    { value: "pending_review", label: "Review", count: pendingReviewVendors.length, show: isMaker || isAdmin },
    { value: "in_verification", label: "Verify", count: inVerificationVendors.length, show: isChecker || isAdmin },
    { value: "pending_approval", label: "Approve", count: pendingApprovalVendors.length, show: isApprover || isAdmin },
    { value: "approved", label: "Approved", count: approvedVendors.length, show: isAdmin },
    { value: "rejected", label: "Rejected", count: rejectedVendors.length, show: isAdmin },
  ].filter(tab => tab.show);

  return (
    <MobileLayout title="Vendor Queue">
      <div className="flex-1 flex flex-col">
        {/* Search */}
        <div className="p-4 border-b bg-card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start px-4 h-auto py-2 bg-card border-b rounded-none overflow-x-auto">
            {tabs.map(tab => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                className="relative data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-muted">
                    {tab.count}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {vendorsLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="pending_review" className="flex-1 p-4 space-y-3 overflow-auto mt-0">
                {pendingReviewVendors.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No vendors pending review</p>
                ) : (
                  pendingReviewVendors.map(renderVendorCard)
                )}
              </TabsContent>

              <TabsContent value="in_verification" className="flex-1 p-4 space-y-3 overflow-auto mt-0">
                {inVerificationVendors.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No vendors in verification</p>
                ) : (
                  inVerificationVendors.map(renderVendorCard)
                )}
              </TabsContent>

              <TabsContent value="pending_approval" className="flex-1 p-4 space-y-3 overflow-auto mt-0">
                {pendingApprovalVendors.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No vendors pending approval</p>
                ) : (
                  pendingApprovalVendors.map(renderVendorCard)
                )}
              </TabsContent>

              <TabsContent value="approved" className="flex-1 p-4 space-y-3 overflow-auto mt-0">
                {approvedVendors.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No approved vendors</p>
                ) : (
                  approvedVendors.map(renderVendorCard)
                )}
              </TabsContent>

              <TabsContent value="rejected" className="flex-1 p-4 space-y-3 overflow-auto mt-0">
                {rejectedVendors.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No rejected vendors</p>
                ) : (
                  rejectedVendors.map(renderVendorCard)
                )}
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Back to Dashboard */}
        <div className="p-4 border-t">
          <Button variant="outline" className="w-full" onClick={() => navigate("/staff/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}
