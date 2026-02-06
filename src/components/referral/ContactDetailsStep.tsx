import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Phone, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface ContactDetailsStepProps {
  formData: {
    primary_contact_name: string;
    primary_mobile: string;
    primary_email: string;
  };
  phoneVerified: boolean;
  onChange: (field: string, value: string) => void;
  onPhoneVerified: () => void;
}

export function ContactDetailsStep({ formData, phoneVerified, onChange, onPhoneVerified }: ContactDetailsStepProps) {
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendOtp = useCallback(async () => {
    const phone = formData.primary_mobile.replace(/\D/g, "");
    if (phone.length !== 10) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    setSendingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone_number: `+91${phone}` },
      });
      if (error) throw error;
      setOtpSent(true);
      setCooldown(60);
      toast.success("OTP sent via WhatsApp");
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  }, [formData.primary_mobile]);

  const verifyOtp = useCallback(async () => {
    if (otpValue.length !== 6) return;
    const phone = formData.primary_mobile.replace(/\D/g, "");
    setVerifyingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { phone_number: `+91${phone}`, otp_code: otpValue },
      });
      if (error) throw error;
      if (data?.valid) {
        onPhoneVerified();
        toast.success("Phone verified!");
      } else {
        toast.error("Invalid OTP. Please try again.");
      }
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setVerifyingOtp(false);
    }
  }, [otpValue, formData.primary_mobile, onPhoneVerified]);

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Contact Details</h2>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="primary_contact_name">Contact Person Name *</Label>
          <Input
            id="primary_contact_name"
            value={formData.primary_contact_name}
            onChange={(e) => onChange("primary_contact_name", e.target.value)}
            placeholder="Full name"
            className="h-12 mt-1"
          />
        </div>

        <div>
          <Label htmlFor="primary_mobile">Mobile Number *</Label>
          <div className="flex gap-2 mt-1">
            <div className="flex items-center px-3 h-12 rounded-md border border-input bg-muted/50 text-sm text-muted-foreground">
              +91
            </div>
            <Input
              id="primary_mobile"
              type="tel"
              value={formData.primary_mobile}
              onChange={(e) => onChange("primary_mobile", e.target.value.replace(/\D/g, ""))}
              placeholder="10-digit number"
              className="h-12 flex-1"
              maxLength={10}
              disabled={phoneVerified}
            />
          </div>

          {phoneVerified ? (
            <div className="flex items-center gap-1.5 mt-2 text-sm text-accent">
              <CheckCircle2 className="h-4 w-4" />
              Phone verified
            </div>
          ) : !otpSent ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={sendOtp}
              disabled={sendingOtp || formData.primary_mobile.replace(/\D/g, "").length !== 10}
            >
              {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Phone className="h-4 w-4 mr-1" />}
              Send OTP
            </Button>
          ) : (
            <div className="mt-3 space-y-3">
              <Label>Enter 6-digit OTP</Label>
              <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={verifyOtp}
                  disabled={verifyingOtp || otpValue.length !== 6}
                >
                  {verifyingOtp ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Verify
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={sendOtp}
                  disabled={cooldown > 0 || sendingOtp}
                >
                  {cooldown > 0 ? `Resend (${cooldown}s)` : "Resend OTP"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="primary_email">Email Address *</Label>
          <div className="flex items-center gap-2 mt-1">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <Input
              id="primary_email"
              type="email"
              value={formData.primary_email}
              onChange={(e) => onChange("primary_email", e.target.value)}
              placeholder="email@company.com"
              className="h-12 flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
