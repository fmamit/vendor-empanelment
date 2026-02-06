import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { StaffSidebar } from "./StaffSidebar";
import { Loader2 } from "lucide-react";

interface StaffLayoutProps {
  children: ReactNode;
  title?: string;
}

export function StaffLayout({ children, title }: StaffLayoutProps) {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || userType !== "staff")) {
      navigate("/staff/login");
    }
  }, [user, userType, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <StaffSidebar />
        <SidebarInset>
          <header className="h-14 flex items-center border-b px-4 shrink-0">
            <SidebarTrigger className="mr-3" />
            {title && <h1 className="font-semibold text-lg truncate">{title}</h1>}
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
