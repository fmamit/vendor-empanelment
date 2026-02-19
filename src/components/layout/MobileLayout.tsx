import { ReactNode } from "react";
import capitalIndiaLogo from "@/assets/capital-india-logo.webp";

interface MobileLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  title?: string;
}

export function MobileLayout({ children, showHeader = true, title }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-inset">
      {showHeader && (
        <header className="sticky top-0 z-50 bg-primary px-4 py-3 shadow-md">
          <div className="flex items-center gap-3">
            <img 
              src={capitalIndiaLogo} 
              alt="Capital India" 
              className="h-10 w-auto rounded bg-white p-1"
            />
            {title && (
              <h1 className="text-lg font-semibold text-primary-foreground">
                {title}
              </h1>
            )}
          </div>
        </header>
      )}
      
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      
      <footer className="border-t border-border bg-card px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <a href="/privacy-policy" className="hover:underline">Privacy Policy</a>
          <span>•</span>
          <span>DPO: dpo@capitalindia.com</span>
        </div>
      </footer>
    </div>
  );
}
