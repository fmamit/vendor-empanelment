import { useNavigate, useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import {
  LayoutDashboard,
  ClipboardList,
  ShieldAlert,
  Users,
  Settings,
  LogOut,
  UserCircle,
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
import { Button } from "@/components/ui/button";
import capitalIndiaLogo from "@/assets/capital-india-logo.jpg";

const mainItems = [
  { title: "Dashboard", url: "/staff/dashboard", icon: LayoutDashboard },
  { title: "Vendor Queue", url: "/staff/queue", icon: ClipboardList },
  { title: "Fraud Alerts", url: "/staff/fraud-alerts", icon: ShieldAlert },
];

const adminItems = [
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "System Settings", url: "/admin/settings", icon: Settings },
];

export function StaffSidebar() {
  const { signOut } = useAuth();
  const { isAdmin } = useUserRoles();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b">
        <img src={capitalIndiaLogo} alt="Capital India" className="h-8 w-8 rounded object-cover shrink-0" />
        {!collapsed && <span className="font-semibold text-sm truncate">Capital India</span>}
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
