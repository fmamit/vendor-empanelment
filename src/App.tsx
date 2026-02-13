import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import InstallApp from "./pages/InstallApp";

// Vendor Pages
import VendorLogin from "./pages/vendor/VendorLogin";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorRegistration from "./pages/vendor/VendorRegistration";
import VendorDocuments from "./pages/vendor/VendorDocuments";
import VendorReferralRegistration from "./pages/vendor/VendorReferralRegistration";

// Staff Pages
import StaffLogin from "./pages/staff/StaffLogin";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffReviewQueue from "./pages/staff/StaffReviewQueue";
import VendorReviewDetail from "./pages/staff/VendorReviewDetail";
import FraudAlertsDashboard from "./pages/staff/FraudAlertsDashboard";
import StaffProfile from "./pages/staff/StaffProfile";
import StaffInviteVendor from "./pages/staff/StaffInviteVendor";
import DigiLockerSuccess from "./pages/vendor/DigiLockerSuccess";
import DigiLockerFailure from "./pages/vendor/DigiLockerFailure";

// Admin Pages
import AdminUserManagement from "./pages/admin/AdminUserManagement";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<StaffLogin />} />
            <Route path="/install" element={<InstallApp />} />
            <Route path="/register/ref/:token" element={<VendorReferralRegistration />} />
            
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
            <Route path="/digilocker/success" element={<DigiLockerSuccess />} />
            <Route path="/digilocker/failure" element={<DigiLockerFailure />} />
            
            {/* Admin Routes */}
            <Route path="/admin/users" element={<AdminUserManagement />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
