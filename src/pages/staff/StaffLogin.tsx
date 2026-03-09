import { useRef } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { StaffEmailLogin } from "@/components/auth/StaffEmailLogin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProcessWalkthrough, chapters, type WalkthroughHandle } from "@/components/staff/ProcessWalkthrough";
import capitalIndiaLogo from "@/assets/capital-india-logo.webp";

export default function StaffLogin() {
  const walkthroughRef = useRef<WalkthroughHandle>(null);

  return (
    <MobileLayout showHeader={false}>
      <div className="flex-1 flex min-h-0">
        {/* Left: Login */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <img src={capitalIndiaLogo} alt="Capital India" className="h-[6rem] w-auto rounded-lg bg-white p-2 shadow-sm" />
              </div>
              <CardTitle className="text-2xl">Staff Login</CardTitle>
              <CardDescription>
                Sign in with your Capital India email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StaffEmailLogin />
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-sm text-muted-foreground max-w-xs">
            Contact your administrator if you need access.
          </p>
        </div>

        {/* Right: Walkthrough + Step Cards (hidden on mobile) */}
        <div className="hidden lg:flex flex-col items-center justify-center gap-4 w-[520px] xl:w-[580px] flex-shrink-0 p-6 overflow-y-auto">
          {/* 16:9 video container */}
          <div className="w-full rounded-xl overflow-hidden border shadow-lg aspect-video">
            <ProcessWalkthrough ref={walkthroughRef} />
          </div>

          {/* Step Cards */}
          <div className="w-full">
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 text-center">Jump to Section</h3>
            <div className="grid grid-cols-4 gap-1.5">
              {chapters.map((ch, i) => (
                <button
                  key={i}
                  onClick={() => walkthroughRef.current?.goToSlide(ch.slideIndex)}
                  className="group flex flex-col items-center gap-1 p-2 rounded-lg border bg-card hover:shadow-md hover:border-primary/30 transition-all text-center"
                >
                  <div className={`h-6 w-6 rounded-md flex items-center justify-center ${ch.color} group-hover:scale-110 transition-transform`}>
                    {ch.icon}
                  </div>
                  <span className="text-[10px] font-medium leading-tight">{ch.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
