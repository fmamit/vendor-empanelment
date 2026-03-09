import { MobileLayout } from "@/components/layout/MobileLayout";
import { StaffEmailLogin } from "@/components/auth/StaffEmailLogin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProcessWalkthrough } from "@/components/staff/ProcessWalkthrough";
import capitalIndiaLogo from "@/assets/capital-india-logo.webp";

export default function StaffLogin() {
  return (
    <MobileLayout showHeader={false}>
      <div className="flex-1 flex min-h-0">
        {/* Left: Login */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
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

        {/* Right: Walkthrough (hidden on mobile) */}
        <div className="hidden lg:block w-[480px] xl:w-[540px] flex-shrink-0 border-l">
          <ProcessWalkthrough />
        </div>
      </div>
    </MobileLayout>
  );
}
