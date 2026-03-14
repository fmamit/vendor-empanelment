import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TenantProvider } from "@/contexts/TenantContext";
import { AuthProvider } from "@/hooks/useAuth";

// Pages
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";

// Vendor Pages
import VendorLogin from "./pages/vendor/VendorLogin";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorRegistration from "./pages/vendor/VendorRegistration";
import VendorDocuments from "./pages/vendor/VendorDocuments";
import VendorReferralRegistration from "./pages/vendor/VendorReferralRegistration";
import VendorSelfRegistration from "./pages/vendor/VendorSelfRegistration";
import PrivacyPolicy from "./pages/vendor/PrivacyPolicy";

// Staff Pages
import StaffLogin from "./pages/staff/StaffLogin";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffReviewQueue from "./pages/staff/StaffReviewQueue";
import VendorReviewDetail from "./pages/staff/VendorReviewDetail";
import FraudAlertsDashboard from "./pages/staff/FraudAlertsDashboard";
import StaffProfile from "./pages/staff/StaffProfile";
import StaffInviteVendor from "./pages/staff/StaffInviteVendor";
import StaffReports from "./pages/staff/StaffReports";
import ApprovedVendors from "./pages/staff/ApprovedVendors";

// Admin Pages
import AdminUserManagement from "./pages/admin/AdminUserManagement";
import AdminSettings from "./pages/admin/AdminSettings";
import DpdpAuditDashboard from "./pages/admin/DpdpAuditDashboard";

const queryClient = new QueryClient();

const App = () => (
  <TenantProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<VendorSelfRegistration />} />
            <Route path="/register/ref/:token" element={<VendorReferralRegistration />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            
            {/* Vendor Routes */}
            <Route path="/vendor/login" element={<VendorLogin />} />
            <Route path="/vendor/dashboard" element={<VendorDashboard />} />
            <Route path="/vendor/register" element={<VendorRegistration />} />
            <Route path="/vendor/documents" element={<VendorDocuments />} />
            
            {/* Staff Routes */}
            <Route path="/staff/login" element={<StaffLogin />} />
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/queue" element={<StaffReviewQueue />} />
            <Route path="/staff/vendor/:vendorId" element={<VendorReviewDetail />} />
            <Route path="/staff/fraud-alerts" element={<FraudAlertsDashboard />} />
            <Route path="/staff/profile" element={<StaffProfile />} />
            <Route path="/staff/invite-vendor" element={<StaffInviteVendor />} />
            <Route path="/staff/reports" element={<StaffReports />} />
            <Route path="/staff/approved-vendors" element={<ApprovedVendors />} />
            
            {/* Admin Routes */}
            <Route path="/admin/users" element={<AdminUserManagement />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/dpdp-audit" element={<DpdpAuditDashboard />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </TenantProvider>
);

export default App;
