import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Building2, Users, Download, Smartphone } from "lucide-react";
import capitalIndiaLogo from "@/assets/capital-india-logo.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout showHeader={false}>
      <div className="flex-1 flex flex-col">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary to-primary/80 px-6 py-12 text-center">
          <img
            src={capitalIndiaLogo}
            alt="Capital India"
            className="mx-auto h-20 w-auto rounded-lg bg-white p-2 shadow-lg"
          />
          <h1 className="mt-6 text-2xl font-bold text-primary-foreground">
            Vendor Portal
          </h1>
          <p className="mt-2 text-primary-foreground/80">
            Onboarding & Management System
          </p>
        </div>

        {/* Login Options */}
        <div className="flex-1 px-6 py-8 space-y-4">
          <h2 className="text-lg font-semibold text-center mb-6">
            Select your login type
          </h2>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
            onClick={() => navigate("/vendor/login")}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">I'm a Vendor</h3>
                <p className="text-sm text-muted-foreground">
                  Register or track your onboarding status
                </p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-accent"
            onClick={() => navigate("/staff/login")}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center">
                <Users className="h-7 w-7 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Staff Login</h3>
                <p className="text-sm text-muted-foreground">
                  Internal team access for review & approval
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Install PWA Banner */}
        <div className="px-6 pb-8">
          <Card className="bg-secondary border-0">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Install this app</p>
                <p className="text-xs text-muted-foreground">
                  Add to home screen for quick access
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/install")}>
                <Download className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Index;
