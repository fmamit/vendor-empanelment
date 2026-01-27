import { ReactNode } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { StaffSidebar } from "./StaffSidebar";
import { Separator } from "@/components/ui/separator";

interface StaffLayoutProps {
  children: ReactNode;
  title?: string;
}

export function StaffLayout({ children, title }: StaffLayoutProps) {
  return (
    <SidebarProvider>
      <StaffSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          {title && (
            <>
              <Separator orientation="vertical" className="h-4 mx-2" />
              <h1 className="font-semibold text-foreground">{title}</h1>
            </>
          )}
        </header>
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
