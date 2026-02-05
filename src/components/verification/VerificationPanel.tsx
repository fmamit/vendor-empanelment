 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { 
   Shield, 
   CreditCard, 
   Fingerprint, 
   Loader2,
   CheckCircle2,
   XCircle,
   Clock,
   RefreshCw
 } from "lucide-react";
 import { useVendorVerifications, useVerifyPAN, useVerifyBankAccount, useInitiateAadhaarVerification } from "@/hooks/useVendorVerifications";
 import { VerificationStatusBadge } from "./VerificationStatusBadge";
 import { format } from "date-fns";
 
 interface VerificationPanelProps {
   vendorId: string;
   panNumber?: string;
   accountNumber?: string;
   ifscCode?: string;
 }
 
 export function VerificationPanel({
   vendorId,
   panNumber,
   accountNumber,
   ifscCode,
 }: VerificationPanelProps) {
   const { data: verifications, isLoading, refetch } = useVendorVerifications(vendorId);
   const verifyPAN = useVerifyPAN();
   const verifyBank = useVerifyBankAccount();
   const initiateAadhaar = useInitiateAadhaarVerification();
 
   const panVerification = verifications?.find(v => v.verification_type === "pan");
   const bankVerification = verifications?.find(v => v.verification_type === "bank_account");
   const aadhaarVerification = verifications?.find(v => v.verification_type === "aadhaar");
 
   const handlePanVerify = async () => {
     if (!panNumber) return;
     await verifyPAN.mutateAsync({ panNumber, vendorId });
   };
 
   const handleBankVerify = async () => {
     if (!accountNumber || !ifscCode) return;
     await verifyBank.mutateAsync({ accountNumber, ifscCode, vendorId });
   };
 
   const handleAadhaarVerify = async () => {
     await initiateAadhaar.mutateAsync({ vendorId, returnUrl: window.location.origin });
   };
 
   if (isLoading) {
     return (
       <Card>
         <CardContent className="flex items-center justify-center py-8">
           <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card>
       <CardHeader className="pb-3">
         <div className="flex items-center justify-between">
           <CardTitle className="text-base flex items-center gap-2">
             <Shield className="h-4 w-4" />
             Identity Verifications
           </CardTitle>
           <Button variant="ghost" size="sm" onClick={() => refetch()}>
             <RefreshCw className="h-4 w-4" />
           </Button>
         </div>
       </CardHeader>
       <CardContent className="space-y-4">
         {/* PAN Verification */}
         <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
           <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
               <Shield className="h-5 w-5 text-primary" />
             </div>
             <div>
               <p className="font-medium text-sm">PAN Verification</p>
               <p className="text-xs text-muted-foreground">
                 {panNumber || "No PAN provided"}
               </p>
               {panVerification?.verified_at && (
                 <p className="text-xs text-muted-foreground">
                   Verified: {format(new Date(panVerification.verified_at), "PPp")}
                 </p>
               )}
             </div>
           </div>
           <div className="flex items-center gap-2">
             {panVerification ? (
               <>
                 <VerificationStatusBadge status={panVerification.status} />
                 {panVerification.response_data?.name && (
                   <Badge variant="outline" className="text-xs">
                     {panVerification.response_data.name}
                   </Badge>
                 )}
               </>
             ) : panNumber ? (
               <Button 
                 size="sm" 
                 onClick={handlePanVerify}
                 disabled={verifyPAN.isPending}
               >
                 {verifyPAN.isPending ? (
                   <Loader2 className="h-4 w-4 animate-spin" />
                 ) : (
                   "Verify"
                 )}
               </Button>
             ) : (
               <Badge variant="outline" className="text-muted-foreground">N/A</Badge>
             )}
           </div>
         </div>
 
         {/* Bank Account Verification */}
         <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
           <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
               <CreditCard className="h-5 w-5 text-primary" />
             </div>
             <div>
               <p className="font-medium text-sm">Bank Account</p>
               <p className="text-xs text-muted-foreground">
                 {accountNumber && ifscCode 
                   ? `****${accountNumber.slice(-4)} | ${ifscCode}` 
                   : "No bank details provided"}
               </p>
               {bankVerification?.verified_at && (
                 <p className="text-xs text-muted-foreground">
                   Verified: {format(new Date(bankVerification.verified_at), "PPp")}
                 </p>
               )}
             </div>
           </div>
           <div className="flex items-center gap-2">
             {bankVerification ? (
               <>
                 <VerificationStatusBadge status={bankVerification.status} />
                 {bankVerification.response_data?.account_holder_name && (
                   <Badge variant="outline" className="text-xs">
                     {bankVerification.response_data.account_holder_name}
                   </Badge>
                 )}
               </>
             ) : accountNumber && ifscCode ? (
               <Button 
                 size="sm" 
                 onClick={handleBankVerify}
                 disabled={verifyBank.isPending}
               >
                 {verifyBank.isPending ? (
                   <Loader2 className="h-4 w-4 animate-spin" />
                 ) : (
                   "Verify"
                 )}
               </Button>
             ) : (
               <Badge variant="outline" className="text-muted-foreground">N/A</Badge>
             )}
           </div>
         </div>
 
         {/* Aadhaar Verification */}
         <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
           <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
               <Fingerprint className="h-5 w-5 text-primary" />
             </div>
             <div>
               <p className="font-medium text-sm">Aadhaar (DigiLocker)</p>
               <p className="text-xs text-muted-foreground">
                 {aadhaarVerification?.response_data?.aadhaar_uid || "Not verified"}
               </p>
               {aadhaarVerification?.verified_at && (
                 <p className="text-xs text-muted-foreground">
                   Verified: {format(new Date(aadhaarVerification.verified_at), "PPp")}
                 </p>
               )}
             </div>
           </div>
           <div className="flex items-center gap-2">
             {aadhaarVerification ? (
               <>
                 <VerificationStatusBadge status={aadhaarVerification.status} />
                 {aadhaarVerification.response_data?.name && (
                   <Badge variant="outline" className="text-xs">
                     {aadhaarVerification.response_data.name}
                   </Badge>
                 )}
               </>
             ) : (
               <Button 
                 size="sm" 
                 onClick={handleAadhaarVerify}
                 disabled={initiateAadhaar.isPending}
               >
                 {initiateAadhaar.isPending ? (
                   <Loader2 className="h-4 w-4 animate-spin" />
                 ) : (
                   "Verify"
                 )}
               </Button>
             )}
           </div>
         </div>
       </CardContent>
     </Card>
   );
 }