import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Phone, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function VendorPhoneLogin() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits.slice(0, 10);
  };

  const getEdgeFunctionUrl = useCallback(() => {
    const projectUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${projectUrl}/functions/v1/send-public-otp`;
  }, []);

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(getEdgeFunctionUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, channel: "whatsapp" }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to send OTP");
      }

      toast.success("OTP sent to your WhatsApp");
      setStep("otp");
      setResendCooldown(60);
    } catch (error: any) {
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(getEdgeFunctionUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp, action: "verify" }),
      });

      const result = await response.json();

      if (!result.verified) {
        throw new Error(result.error || "Invalid OTP");
      }

      // OTP verified — now sign in via Supabase Auth
      // Use signInWithOtp to create/get a session for this phone user
      const { error: authError } = await supabase.auth.signInWithOtp({
        phone: `+91${phone}`,
      });

      if (authError) {
        console.warn("Auth sign-in note:", authError.message);
      }

      await refreshAuth();
      toast.success("Verification successful!");
      navigate("/vendor/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {step === "phone" ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-base">
              Mobile Number
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                +91
              </span>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="Enter 10-digit number"
                value={phone}
                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                className="pl-12 h-14 text-lg"
                maxLength={10}
              />
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <Button
            onClick={handleSendOTP}
            disabled={phone.length !== 10 || loading}
            className="w-full h-14 text-lg"
            size="lg"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Get OTP via WhatsApp
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-base">
              Enter OTP
            </Label>
            <p className="text-sm text-muted-foreground">
              Sent to your WhatsApp on +91 {phone}
            </p>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="h-14 text-2xl text-center tracking-[0.5em] font-mono"
              maxLength={6}
            />
          </div>

          <Button
            onClick={handleVerifyOTP}
            disabled={otp.length !== 6 || loading}
            className="w-full h-14 text-lg"
            size="lg"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Verify & Login
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setStep("phone");
                setOtp("");
              }}
              className="flex-1"
            >
              Change Number
            </Button>
            <Button
              variant="outline"
              onClick={handleSendOTP}
              disabled={resendCooldown > 0 || loading}
              className="flex-1"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
