import { useNavigate, useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  ClipboardList,
  ShieldAlert,
  ShieldCheck,
  Users,
  Settings,
  LogOut,
  UserCircle,
  UserPlus,
  BarChart3,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import capitalIndiaLogo from "@/assets/capital-india-logo.jpg";

const mainItems = [
  { title: "Dashboard", url: "/staff/dashboard", icon: LayoutDashboard },
  { title: "Vendor Queue", url: "/staff/queue", icon: ClipboardList },
  { title: "Invite Vendor", url: "/staff/invite-vendor", icon: UserPlus },
  { title: "Fraud Alerts", url: "/staff/fraud-alerts", icon: ShieldAlert },
  { title: "Reports", url: "/staff/reports", icon: BarChart3 },
];

const adminItems = [
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "System Settings", url: "/admin/settings", icon: Settings },
  { title: "DPDP Audit", url: "/admin/dpdp-audit", icon: ShieldCheck },
];

export function StaffSidebar() {
  const { signOut, user } = useAuth();
  const { isAdmin } = useUserRoles();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const { data: profile } = useQuery({
    queryKey: ["sidebar-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, department")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon">
      {/* Logo & User Identity Header */}
      <div className="flex flex-col items-center gap-2 px-3 py-5 border-b border-border/50">
        <div className="bg-white rounded-xl p-3 shadow-sm shrink-0">
          <img
            src={capitalIndiaLogo}
            alt="Capital India"
            className="h-[120px] w-[120px] rounded-lg object-cover"
          />
        </div>
        {!collapsed && (
          <div className="text-center mt-1">
            <p className="text-sm font-semibold text-white truncate max-w-[160px]">
              {profile?.full_name || "Staff User"}
            </p>
            {profile?.department && (
              <p className="text-xs text-white/70 truncate max-w-[160px]">
                {profile.department}
              </p>
            )}
          </div>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={location.pathname === item.url}>
                    <NavLink
                      to={item.url}
                      className="hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title} isActive={location.pathname === item.url}>
                      <NavLink
                        to={item.url}
                        className="hover:bg-muted/50"
                        activeClassName="bg-primary/10 text-primary font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="space-y-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="My Profile" isActive={location.pathname === "/staff/profile"}>
              <NavLink
                to="/staff/profile"
                className="hover:bg-muted/50"
                activeClassName="bg-primary/10 text-primary font-medium"
              >
                <UserCircle className="h-4 w-4" />
                <span>My Profile</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sign Out" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
