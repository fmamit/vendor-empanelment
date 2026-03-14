import { MobileLayout } from "@/components/layout/MobileLayout";
import { VendorPhoneLogin } from "@/components/auth/VendorPhoneLogin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default function VendorLogin() {
  return (
    <MobileLayout title="Vendor Login">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Vendor Login</CardTitle>
            <CardDescription>
              Enter your registered mobile number to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VendorPhoneLogin />
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground max-w-xs">
          New vendor? <a href="/register" className="text-primary hover:underline">Register here</a> or contact us to receive your registration link.
        </p>
      </div>
    </MobileLayout>
  );
}
