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

// Staff Pages
import StaffLogin from "./pages/staff/StaffLogin";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffReviewQueue from "./pages/staff/StaffReviewQueue";
import VendorReviewDetail from "./pages/staff/VendorReviewDetail";
import FraudAlertsDashboard from "./pages/staff/FraudAlertsDashboard";
import VendorInvitations from "./pages/staff/VendorInvitations";

// Admin Pages
import AdminUserManagement from "./pages/admin/AdminUserManagement";
import AdminSettings from "./pages/admin/AdminSettings";
 
// DigiLocker Callback Pages
import DigilockerSuccess from "./pages/DigilockerSuccess";
import DigilockerFailure from "./pages/DigilockerFailure";

const queryClient = new QueryClient();

// Routes that should NOT be wrapped with AuthProvider (to avoid session conflicts)
function PublicRoutes() {
  return (
    <Routes>
      {/* Vendor Registration - completely isolated from auth */}
      <Route path="/vendor/register" element={<VendorRegistration />} />
    </Routes>
  );
}

// Routes that need AuthProvider
function AuthenticatedApp() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/install" element={<InstallApp />} />
        
        {/* Vendor Routes */}
        <Route path="/vendor/login" element={<VendorLogin />} />
        <Route path="/vendor/dashboard" element={<VendorDashboard />} />
        <Route path="/vendor/documents" element={<VendorDocuments />} />
        
        {/* Staff Routes */}
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/staff/queue" element={<StaffReviewQueue />} />
        <Route path="/staff/vendor/:vendorId" element={<VendorReviewDetail />} />
        <Route path="/staff/fraud-alerts" element={<FraudAlertsDashboard />} />
        <Route path="/staff/invitations" element={<VendorInvitations />} />
        
        {/* DigiLocker Callback Routes */}
        <Route path="/digilocker/success" element={<DigilockerSuccess />} />
        <Route path="/digilocker/failure" element={<DigilockerFailure />} />
        
        {/* Admin Routes */}
        <Route path="/admin/users" element={<AdminUserManagement />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        
        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

const App = () => {
  // Check if we're on the registration path - render without AuthProvider
  const isRegistrationPath = window.location.pathname.startsWith('/vendor/register');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {isRegistrationPath ? <PublicRoutes /> : <AuthenticatedApp />}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
