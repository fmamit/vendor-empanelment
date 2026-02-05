 import { Button } from "@/components/ui/button";
 import { Loader2, Fingerprint } from "lucide-react";
 import { useInitiateAadhaarVerification, useLatestVerification } from "@/hooks/useVendorVerifications";
 import { VerificationStatusBadge } from "./VerificationStatusBadge";
 
 interface AadhaarVerificationButtonProps {
   vendorId: string;
   disabled?: boolean;
 }
 
 export function AadhaarVerificationButton({
   vendorId,
   disabled,
 }: AadhaarVerificationButtonProps) {
   const initiateAadhaar = useInitiateAadhaarVerification();
   const latestVerification = useLatestVerification(vendorId, "aadhaar");
 
   const handleVerify = async () => {
     try {
       await initiateAadhaar.mutateAsync({ 
         vendorId, 
         returnUrl: window.location.origin 
       });
     } catch (error) {
       // Error handled by mutation
     }
   };
 
   if (latestVerification) {
     return <VerificationStatusBadge status={latestVerification.status} />;
   }
 
   return (
     <Button
       type="button"
       variant="outline"
       size="sm"
       onClick={handleVerify}
       disabled={disabled || initiateAadhaar.isPending}
       className="text-xs"
     >
       {initiateAadhaar.isPending ? (
         <>
           <Loader2 className="h-3 w-3 mr-1 animate-spin" />
           Initiating...
         </>
       ) : (
         <>
           <Fingerprint className="h-3 w-3 mr-1" />
           Verify via DigiLocker
         </>
       )}
     </Button>
   );
 }