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
        {/* Left: Login + Step Cards */}
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

          {/* Step Cards */}
          <div className="w-full max-w-md mt-8">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 text-center">Onboarding Process</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {chapters.map((ch, i) => (
                <button
                  key={i}
                  onClick={() => walkthroughRef.current?.goToSlide(ch.slideIndex)}
                  className="group flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-card hover:shadow-md hover:border-primary/30 transition-all text-center"
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${ch.color} group-hover:scale-110 transition-transform`}>
                    {ch.icon}
                  </div>
                  <span className="text-xs font-medium leading-tight">{ch.title}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{ch.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Video Walkthrough (hidden on mobile) */}
        <div className="hidden lg:block w-[480px] xl:w-[540px] flex-shrink-0">
          <ProcessWalkthrough ref={walkthroughRef} />
        </div>
      </div>
    </MobileLayout>
  );
}
