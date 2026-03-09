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
        {/* Left column — 1/3 width: Login */}
        <div className="flex-1 lg:w-1/3 lg:flex-none flex flex-col items-center justify-center p-6 overflow-y-auto">
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

        {/* Right column — 2/3 width: Walkthrough + Step Cards */}
        <div className="hidden lg:flex lg:w-2/3 flex-col items-center justify-center gap-5 p-8 overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 border-l">
          {/* Framed video container */}
          <div className="w-full max-w-3xl">
            <div className="rounded-2xl overflow-hidden border-2 border-slate-200/80 shadow-2xl ring-1 ring-black/5 bg-card aspect-video">
              <ProcessWalkthrough ref={walkthroughRef} />
            </div>
          </div>

          {/* Step Cards */}
          <div className="w-full max-w-3xl">
            <h3 className="text-xs font-semibold text-muted-foreground mb-2.5 text-center">Jump to Section</h3>
            <div className="grid grid-cols-7 gap-2">
              {chapters.map((ch, i) => (
                <button
                  key={i}
                  onClick={() => walkthroughRef.current?.goToSlide(ch.slideIndex)}
                  className="group flex flex-col items-center gap-1.5 p-2.5 rounded-xl border bg-white/80 backdrop-blur-sm hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 transition-all text-center"
                >
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${ch.color} group-hover:scale-110 transition-transform`}>
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
