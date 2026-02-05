 import { useState } from "react";
 import { Button } from "@/components/ui/button";
 import { Loader2, CheckCircle2, Shield } from "lucide-react";
 import { useVerifyPAN, useLatestVerification } from "@/hooks/useVendorVerifications";
 import { VerificationStatusBadge } from "./VerificationStatusBadge";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
 } from "@/components/ui/dialog";
 
 interface PANVerificationButtonProps {
   panNumber: string;
   vendorId?: string;
   onVerified?: (data: any) => void;
   disabled?: boolean;
 }
 
 export function PANVerificationButton({
   panNumber,
   vendorId,
   onVerified,
   disabled,
 }: PANVerificationButtonProps) {
   const [showResult, setShowResult] = useState(false);
   const [verificationResult, setVerificationResult] = useState<any>(null);
   
   const verifyPAN = useVerifyPAN();
   const latestVerification = useLatestVerification(vendorId || null, "pan");
 
   const handleVerify = async () => {
     if (!panNumber || panNumber.length !== 10) {
       return;
     }
 
     try {
       const result = await verifyPAN.mutateAsync({ panNumber, vendorId });
       setVerificationResult(result.data);
       setShowResult(true);
       onVerified?.(result.data);
     } catch (error) {
       // Error handled by mutation
     }
   };
 
   const isVerified = latestVerification?.status === "success";
   const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
   const isValidFormat = panRegex.test(panNumber?.toUpperCase() || "");
 
   return (
     <>
       <div className="flex items-center gap-2">
         {latestVerification ? (
           <VerificationStatusBadge status={latestVerification.status} />
         ) : (
           <Button
             type="button"
             variant="outline"
             size="sm"
             onClick={handleVerify}
             disabled={disabled || !isValidFormat || verifyPAN.isPending}
             className="text-xs"
           >
             {verifyPAN.isPending ? (
               <>
                 <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                 Verifying...
               </>
             ) : (
               <>
                 <Shield className="h-3 w-3 mr-1" />
                 Verify PAN
               </>
             )}
           </Button>
         )}
       </div>
 
       <Dialog open={showResult} onOpenChange={setShowResult}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2 text-success">
               <CheckCircle2 className="h-5 w-5" />
               PAN Verified Successfully
             </DialogTitle>
           </DialogHeader>
           
           <div className="space-y-3 py-4">
             {verificationResult?.name && (
               <div className="flex justify-between">
                 <span className="text-muted-foreground">Name as per PAN</span>
                 <span className="font-medium">{verificationResult.name}</span>
               </div>
             )}
             {verificationResult?.dob && (
               <div className="flex justify-between">
                 <span className="text-muted-foreground">Date of Birth</span>
                 <span className="font-medium">{verificationResult.dob}</span>
               </div>
             )}
             <div className="flex justify-between">
               <span className="text-muted-foreground">Status</span>
               <VerificationStatusBadge status={verificationResult?.is_valid ? "success" : "failed"} />
             </div>
           </div>
 
           <DialogFooter>
             <Button onClick={() => setShowResult(false)}>Close</Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </>
   );
 }