import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Building2, 
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Phone,
  Mail,
  MessageSquare,
  RefreshCw,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * REDESIGNED VENDOR REGISTRATION FLOW
 * 
 * Architecture:
 * 1. Token validation via edge function (no client-side DB queries)
 * 2. OTP verification 
 * 3. Vendor creation + session in one atomic operation
 * 4. Redirect to dashboard
 * 
 * Key improvements:
 * - No RLS queries before authentication
 * - Single edge function handles validation + creation
 * - Simple state machine: VALIDATING → VERIFY_PHONE → REGISTERING → SUCCESS
 */

type RegistrationState = 
  | "VALIDATING"      // Checking token validity
  | "INVALID_TOKEN"   // Token invalid or expired
  | "VERIFY_PHONE"    // OTP verification step
  | "REGISTERING"     // Creating vendor + session
  | "ERROR"           // Something went wrong
  | "SUCCESS";        // Done - redirecting

interface InvitationData {
  company_name: string;
  contact_phone: string;
  contact_email: string;
  category_name: string;
}

export default function VendorRegistration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  // State machine - start with CLEARING_SESSION to ensure clean slate
  const [state, setState] = useState<RegistrationState>("VALIDATING");
  const [error, setError] = useState<string | null>(null);
  const [sessionCleared, setSessionCleared] = useState(false);
  
  // Invitation data (fetched via edge function)
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  
  // OTP state
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  
  // Prevent double execution
  const registrationInProgressRef = useRef(false);
  const sessionClearingRef = useRef(false);

  // Step 0: Clear any existing session FIRST to prevent RLS issues
  useEffect(() => {
    const clearExistingSession = async () => {
      if (sessionClearingRef.current || sessionCleared) return;
      sessionClearingRef.current = true;
      
      try {
        console.log("[VendorRegistration] Clearing any existing session...");
        await supabase.auth.signOut();
        console.log("[VendorRegistration] Session cleared successfully");
      } catch (err) {
        // Ignore errors - session might not exist
        console.log("[VendorRegistration] No session to clear or error:", err);
      } finally {
        setSessionCleared(true);
        sessionClearingRef.current = false;
      }
    };

    clearExistingSession();
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Step 1: Validate token via edge function (no RLS involved)
  // ONLY runs after session is cleared
  useEffect(() => {
    const validateToken = async () => {
      // Wait for session to be cleared first
      if (!sessionCleared) {
        console.log("[VendorRegistration] Waiting for session to clear...");
        return;
      }
      
      if (!token) {
        setState("INVALID_TOKEN");
        setError("Registration requires a valid invitation link from Capital India.");
        return;
      }

      console.log("[VendorRegistration] Session cleared, validating token...");
      
      try {
        const { data, error: fnError } = await supabase.functions.invoke("validate-invitation", {
          body: { token },
        });

        if (fnError) throw fnError;

        if (!data.valid) {
          setState("INVALID_TOKEN");
          setError(data.error || "This invitation link is invalid or has expired.");
          return;
        }

        setInvitation({
          company_name: data.company_name,
          contact_phone: data.contact_phone,
          contact_email: data.contact_email,
          category_name: data.category_name,
        });
        setState("VERIFY_PHONE");
        
        // Auto-send OTP after validation
        sendOTP(data.contact_phone);
      } catch (err: any) {
        console.error("Token validation error:", err);
        setState("INVALID_TOKEN");
        setError("Failed to validate invitation. Please try again.");
      }
    };

    validateToken();
  }, [token, sessionCleared]);

  // Send OTP function
  const sendOTP = async (phone: string) => {
    setIsSendingOtp(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("send-otp", {
        body: { phone_number: phone },
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error || "Failed to send OTP");

      setOtpSent(true);
      setCountdown(60);
      toast.success("OTP sent to your WhatsApp");
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP and complete registration
  const handleVerifyAndRegister = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    if (!invitation || !token || registrationInProgressRef.current) return;
    
    registrationInProgressRef.current = true;
    setIsVerifyingOtp(true);

    try {
      // First verify OTP
      const { data: otpData, error: otpError } = await supabase.functions.invoke("verify-otp", {
        body: { 
          phone_number: invitation.contact_phone, 
          otp_code: otp 
        },
      });

      if (otpError) throw otpError;
      if (!otpData.verified) {
        toast.error(otpData.error || "Invalid OTP. Please try again.");
        setOtp("");
        registrationInProgressRef.current = false;
        setIsVerifyingOtp(false);
        return;
      }

      // OTP verified - now create vendor
      setState("REGISTERING");

      const { data: regData, error: regError } = await supabase.functions.invoke("create-vendor-registration", {
        body: { 
          invitation_token: token, 
          phone_number: invitation.contact_phone 
        },
      });

      if (regError) throw regError;
      if (!regData.success) throw new Error(regData.error || "Failed to create vendor");

      // Set session if tokens returned
      if (regData.access_token && regData.refresh_token) {
        await supabase.auth.setSession({
          access_token: regData.access_token,
          refresh_token: regData.refresh_token,
        });
      }

      // Success!
      setState("SUCCESS");
      toast.success("Registration successful!");
      
      // Wait for session to propagate
      await new Promise(resolve => setTimeout(resolve, 800));
      navigate("/vendor/dashboard");

    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed. Please try again.");
      setState("ERROR");
      registrationInProgressRef.current = false;
    }
  };

  // Helper: masked phone number
  const maskedPhone = invitation?.contact_phone 
    ? `******${invitation.contact_phone.slice(-4)}` 
    : "";

  // RENDER: Loading state
  if (state === "VALIDATING") {
    return (
      <MobileLayout title="Registration">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Validating invitation...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  // RENDER: Invalid token
  if (state === "INVALID_TOKEN") {
    return (
      <MobileLayout title="Registration">
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Access Denied</h2>
                <p className="text-muted-foreground mt-2">{error}</p>
              </div>
              <div className="pt-4 border-t space-y-3">
                <p className="text-sm font-medium">Contact Capital India for assistance:</p>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>+91 1800-XXX-XXXX</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>vendors@capitalindia.com</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate("/")} className="mt-4">
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </MobileLayout>
    );
  }

  // RENDER: Error state
  if (state === "ERROR") {
    return (
      <MobileLayout title="Registration">
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Registration Error</h2>
                <p className="text-muted-foreground mt-2">{error}</p>
              </div>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </MobileLayout>
    );
  }

  // RENDER: Registering state
  if (state === "REGISTERING" || state === "SUCCESS") {
    return (
      <MobileLayout title="Registration">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">
              {state === "SUCCESS" ? "Redirecting to dashboard..." : "Setting up your account..."}
            </p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  // RENDER: OTP Verification (main state)
  return (
    <MobileLayout title="Verify Mobile">
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            {/* Company badge */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mx-auto">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-medium text-sm">{invitation?.company_name}</span>
              </div>
            </div>
            
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            
            <div>
              <CardTitle className="text-xl">Verify Your Mobile Number</CardTitle>
              <CardDescription className="mt-2">
                Enter the 6-digit OTP sent to your WhatsApp
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Phone number display */}
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
                <Phone className="h-4 w-4" />
                <span>Mobile Number</span>
              </div>
              <p className="text-lg font-medium font-mono">{maskedPhone}</p>
            </div>

            {/* OTP Input */}
            <div className="flex flex-col items-center space-y-4">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                disabled={isVerifyingOtp}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>

              <p className="text-xs text-muted-foreground text-center">
                Enter the 6-digit code sent to your WhatsApp
              </p>
            </div>

            {/* Verify Button */}
            <Button
              className="w-full h-12"
              onClick={handleVerifyAndRegister}
              disabled={otp.length !== 6 || isVerifyingOtp}
            >
              {isVerifyingOtp ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Verify & Continue
                </>
              )}
            </Button>

            {/* Resend OTP */}
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Resend OTP in <span className="font-medium">{countdown}s</span>
                </p>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => invitation && sendOTP(invitation.contact_phone)}
                  disabled={isSendingOtp}
                >
                  {isSendingOtp ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Resend OTP
                </Button>
              )}
            </div>

            {/* Security notice */}
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">
                <Shield className="h-3 w-3 inline-block mr-1" />
                Secure registration powered by Capital India
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
}
