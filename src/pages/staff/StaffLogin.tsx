import { MobileLayout } from "@/components/layout/MobileLayout";
import { StaffEmailLogin } from "@/components/auth/StaffEmailLogin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function StaffLogin() {
  return (
    <MobileLayout title="Staff Login">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-accent" />
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
    </MobileLayout>
  );
}
