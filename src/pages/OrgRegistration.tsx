import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenantLogo } from "@/hooks/useTenantLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Building2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function OrgRegistration() {
  const navigate = useNavigate();
  const logo = useTenantLogo();

  const [orgName, setOrgName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    orgName.trim().length >= 2 &&
    adminName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail) &&
    adminPassword.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("register-organization", {
        body: {
          org_name: orgName.trim(),
          admin_name: adminName.trim(),
          admin_email: adminEmail.toLowerCase().trim(),
          admin_password: adminPassword,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Auto-login with the new credentials
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: adminEmail.toLowerCase().trim(),
        password: adminPassword,
      });

      if (loginError) {
        toast.success("Organization created! Please log in with your credentials.");
        navigate("/staff/login");
        return;
      }

      toast.success("Welcome! Your organization is ready.");
      navigate("/staff/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 to-background flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/">
              <img src={logo} alt="Vendor Verification Portal" className="h-10 w-auto" />
            </a>
          </div>
          <Button variant="ghost" onClick={() => navigate("/staff/login")}>
            Already have an account? Login
          </Button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Register Your Organization</CardTitle>
            <CardDescription>
              Set up your vendor verification portal. First 5 verifications free.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  placeholder="e.g., Acme Industries"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  maxLength={100}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminName">Your Full Name</Label>
                <Input
                  id="adminName"
                  placeholder="e.g., Rajesh Kumar"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Work Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="you@company.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminPassword">Password</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating your organization...
                  </>
                ) : (
                  "Create Organization"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate("/")}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to home
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
