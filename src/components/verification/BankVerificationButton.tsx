 import { useState } from "react";
 import { Button } from "@/components/ui/button";
 import { Loader2, CheckCircle2, CreditCard } from "lucide-react";
 import { useVerifyBankAccount, useLatestVerification } from "@/hooks/useVendorVerifications";
 import { VerificationStatusBadge } from "./VerificationStatusBadge";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
 } from "@/components/ui/dialog";
 
 interface BankVerificationButtonProps {
   accountNumber: string;
   ifscCode: string;
   vendorId?: string;
   onVerified?: (data: any) => void;
   disabled?: boolean;
 }
 
 export function BankVerificationButton({
   accountNumber,
   ifscCode,
   vendorId,
   onVerified,
   disabled,
 }: BankVerificationButtonProps) {
   const [showResult, setShowResult] = useState(false);
   const [verificationResult, setVerificationResult] = useState<any>(null);
   
   const verifyBank = useVerifyBankAccount();
   const latestVerification = useLatestVerification(vendorId || null, "bank_account");
 
   const handleVerify = async () => {
     if (!accountNumber || !ifscCode) {
       return;
     }
 
     try {
       const result = await verifyBank.mutateAsync({ accountNumber, ifscCode, vendorId });
       setVerificationResult(result.data);
       setShowResult(true);
       onVerified?.(result.data);
     } catch (error) {
       // Error handled by mutation
     }
   };
 
   const isVerified = latestVerification?.status === "success";
   const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
   const isValidIfsc = ifscRegex.test(ifscCode?.toUpperCase() || "");
   const hasAccountNumber = accountNumber?.length >= 8;
 
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
             disabled={disabled || !isValidIfsc || !hasAccountNumber || verifyBank.isPending}
             className="text-xs"
           >
             {verifyBank.isPending ? (
               <>
                 <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                 Verifying...
               </>
             ) : (
               <>
                 <CreditCard className="h-3 w-3 mr-1" />
                 Verify Account
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
               Bank Account Verified
             </DialogTitle>
           </DialogHeader>
           
           <div className="space-y-3 py-4">
             {verificationResult?.account_holder_name && (
               <div className="flex justify-between">
                 <span className="text-muted-foreground">Account Holder</span>
                 <span className="font-medium">{verificationResult.account_holder_name}</span>
               </div>
             )}
             {verificationResult?.bank_name && (
               <div className="flex justify-between">
                 <span className="text-muted-foreground">Bank Name</span>
                 <span className="font-medium">{verificationResult.bank_name}</span>
               </div>
             )}
             <div className="flex justify-between">
               <span className="text-muted-foreground">Account Number</span>
               <span className="font-medium font-mono">
                 {'•'.repeat(Math.max(0, accountNumber.length - 4))}{accountNumber.slice(-4)}
               </span>
             </div>
             <div className="flex justify-between">
               <span className="text-muted-foreground">IFSC Code</span>
               <span className="font-medium font-mono">{ifscCode?.toUpperCase()}</span>
             </div>
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