import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useStaffVendorQueue } from "@/hooks/useStaffWorkflow";
import { NavLink } from "@/components/NavLink";
import capitalIndiaLogo from "@/assets/capital-india-logo.jpg";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  FileSearch,
  CheckSquare,
  ThumbsUp,
  ShieldAlert,
  Users,
  Settings,
  LogOut,
} from "lucide-react";

export function StaffSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { isAdmin, isMaker, isChecker, isApprover } = useUserRoles();
  const { data: vendors } = useStaffVendorQueue();
  const { setOpenMobile, isMobile } = useSidebar();

  // Calculate counts
  const pendingReview = vendors?.filter(v => v.current_status === "pending_review").length || 0;
  const inVerification = vendors?.filter(v => v.current_status === "in_verification").length || 0;
  const pendingApproval = vendors?.filter(v => v.current_status === "pending_approval").length || 0;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <img 
            src={capitalIndiaLogo} 
            alt="Capital India" 
            className="h-10 w-auto rounded bg-white p-1"
          />
          <div>
            <p className="font-semibold text-sidebar-foreground">Capital India</p>
            <p className="text-xs text-sidebar-foreground/70">Staff Portal</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/staff/dashboard")}
                  tooltip="Dashboard"
                >
                  <NavLink
                    to="/staff/dashboard"
                    onClick={() => isMobile && setOpenMobile(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Workqueue */}
        <SidebarGroup>
          <SidebarGroupLabel>Workqueue</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(isMaker || isAdmin) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/staff/queue") && location.search.includes("pending_review")}
                    tooltip="Pending Review"
                  >
                    <NavLink
                      to="/staff/queue"
                      onClick={() => isMobile && setOpenMobile(false)}
                    >
                      <FileSearch className="h-4 w-4" />
                      <span>Pending Review</span>
                    </NavLink>
                  </SidebarMenuButton>
                  {pendingReview > 0 && (
                    <SidebarMenuBadge>{pendingReview}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              )}

              {(isChecker || isAdmin) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={false}
                    tooltip="In Verification"
                  >
                    <NavLink
                      to="/staff/queue"
                      onClick={() => isMobile && setOpenMobile(false)}
                    >
                      <CheckSquare className="h-4 w-4" />
                      <span>In Verification</span>
                    </NavLink>
                  </SidebarMenuButton>
                  {inVerification > 0 && (
                    <SidebarMenuBadge>{inVerification}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              )}

              {(isApprover || isAdmin) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={false}
                    tooltip="Pending Approval"
                  >
                    <NavLink
                      to="/staff/queue"
                      onClick={() => isMobile && setOpenMobile(false)}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>Pending Approval</span>
                    </NavLink>
                  </SidebarMenuButton>
                  {pendingApproval > 0 && (
                    <SidebarMenuBadge>{pendingApproval}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Alerts */}
        <SidebarGroup>
          <SidebarGroupLabel>Alerts</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/staff/fraud-alerts")}
                  tooltip="Fraud Alerts"
                >
                  <NavLink
                    to="/staff/fraud-alerts"
                    onClick={() => isMobile && setOpenMobile(false)}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    <span>Fraud Alerts</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Administration (admin only) */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/admin/users")}
                    tooltip="User Management"
                  >
                    <NavLink
                      to="/admin/users"
                      onClick={() => isMobile && setOpenMobile(false)}
                    >
                      <Users className="h-4 w-4" />
                      <span>User Management</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/admin/settings")}
                    tooltip="System Settings"
                  >
                    <NavLink
                      to="/admin/settings"
                      onClick={() => isMobile && setOpenMobile(false)}
                    >
                      <Settings className="h-4 w-4" />
                      <span>System Settings</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="space-y-3">
          <div className="text-sm">
            <p className="font-medium text-sidebar-foreground truncate">
              {user?.email || "Staff User"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start bg-white/10 border-white/30 text-sidebar-foreground hover:bg-white/20 hover:text-sidebar-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
