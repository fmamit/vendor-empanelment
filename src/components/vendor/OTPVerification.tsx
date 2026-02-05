 import { useState, useEffect } from "react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
 import { useSendOTP, useVerifyOTP } from "@/hooks/useOTPVerification";
 import { toast } from "sonner";
 import { Loader2, MessageSquare, Phone, RefreshCw, CheckCircle2 } from "lucide-react";
 
 interface OTPVerificationProps {
   phoneNumber: string;
   companyName: string;
   onVerified: () => void;
 }
 
 export function OTPVerification({ phoneNumber, companyName, onVerified }: OTPVerificationProps) {
   const [otp, setOtp] = useState("");
   const [countdown, setCountdown] = useState(0);
   const [otpSent, setOtpSent] = useState(false);
 
   const sendOTP = useSendOTP();
   const verifyOTP = useVerifyOTP();
 
   // Countdown timer for resend
   useEffect(() => {
     if (countdown > 0) {
       const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
       return () => clearTimeout(timer);
     }
   }, [countdown]);
 
   // Auto-send OTP on mount
   useEffect(() => {
     if (!otpSent && phoneNumber) {
       handleSendOTP();
     }
   }, [phoneNumber]);
 
   const handleSendOTP = async () => {
     try {
       await sendOTP.mutateAsync(phoneNumber);
       setOtpSent(true);
       setCountdown(60); // 60 seconds cooldown
       toast.success("OTP sent to your WhatsApp");
     } catch (error: any) {
       toast.error(error.message || "Failed to send OTP");
     }
   };
 
   const handleVerifyOTP = async () => {
     if (otp.length !== 6) {
       toast.error("Please enter the complete 6-digit OTP");
       return;
     }
 
     try {
       const result = await verifyOTP.mutateAsync({
         phone_number: phoneNumber,
         otp_code: otp,
       });
 
       if (result.verified) {
         toast.success("Phone number verified successfully!");
         onVerified();
       } else {
         toast.error(result.error || "Invalid OTP. Please try again.");
         setOtp("");
       }
     } catch (error: any) {
       toast.error(error.message || "Verification failed");
       setOtp("");
     }
   };
 
   const maskedPhone = phoneNumber.length >= 4 
     ? `******${phoneNumber.slice(-4)}` 
     : phoneNumber;
 
   return (
     <div className="flex-1 flex items-center justify-center p-6">
       <Card className="w-full max-w-md">
         <CardHeader className="text-center">
           <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
             <MessageSquare className="h-8 w-8 text-primary" />
           </div>
           <CardTitle className="text-xl">Verify Your Mobile Number</CardTitle>
           <p className="text-sm text-muted-foreground mt-2">
             We've sent a 6-digit OTP to your WhatsApp
           </p>
         </CardHeader>
         <CardContent className="space-y-6">
           {/* Phone number display */}
           <div className="bg-muted/50 rounded-lg p-4 text-center">
             <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
               <Phone className="h-4 w-4" />
               <span>Mobile Number</span>
             </div>
             <p className="text-lg font-medium">{maskedPhone}</p>
             <p className="text-xs text-muted-foreground mt-1">{companyName}</p>
           </div>
 
           {/* OTP Input */}
           <div className="flex flex-col items-center space-y-4">
             <InputOTP
               maxLength={6}
               value={otp}
               onChange={setOtp}
               disabled={verifyOTP.isPending}
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
             onClick={handleVerifyOTP}
             disabled={otp.length !== 6 || verifyOTP.isPending}
           >
             {verifyOTP.isPending ? (
               <>
                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                 Verifying...
               </>
             ) : (
               <>
                 <CheckCircle2 className="h-4 w-4 mr-2" />
                 Verify OTP
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
                 onClick={handleSendOTP}
                 disabled={sendOTP.isPending}
               >
                 {sendOTP.isPending ? (
                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                 ) : (
                   <RefreshCw className="h-4 w-4 mr-2" />
                 )}
                 Resend OTP
               </Button>
             )}
           </div>
 
           {/* Help text */}
           <p className="text-xs text-center text-muted-foreground">
             Having trouble? Make sure WhatsApp is active on your registered number.
           </p>
         </CardContent>
       </Card>
     </div>
   );
 }