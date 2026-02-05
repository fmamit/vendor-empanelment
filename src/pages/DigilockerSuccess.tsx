 import { useEffect, useState } from "react";
 import { useNavigate, useSearchParams } from "react-router-dom";
 import { Card, CardContent } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { CheckCircle2, Loader2, AlertTriangle, User, Calendar, MapPin } from "lucide-react";
 import { useFetchAadhaarDetails } from "@/hooks/useVendorVerifications";
 
 export default function DigilockerSuccess() {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
   const [aadhaarData, setAadhaarData] = useState<any>(null);
   const [errorMessage, setErrorMessage] = useState("");
 
   const id = searchParams.get("id");
   const vendorId = searchParams.get("vendorId");
   const isMock = searchParams.get("mock") === "true";
 
   const fetchDetails = useFetchAadhaarDetails();
 
   useEffect(() => {
     const fetchAadhaarData = async () => {
       if (!id) {
         setErrorMessage("Missing verification ID");
         setStatus("error");
         return;
       }
 
       try {
         const result = await fetchDetails.mutateAsync({ 
           uniqueRequestNumber: id, 
           vendorId: vendorId || undefined 
         });
         setAadhaarData(result.data);
         setStatus("success");
       } catch (error: any) {
         setErrorMessage(error.message || "Failed to fetch Aadhaar details");
         setStatus("error");
       }
     };
 
     fetchAadhaarData();
   }, [id, vendorId]);
 
   const handleContinue = () => {
     if (vendorId) {
       navigate(`/vendor/register?step=1`);
     } else {
       navigate("/vendor/dashboard");
     }
   };
 
   return (
     <div className="min-h-screen bg-background flex items-center justify-center p-4">
       <Card className="w-full max-w-md">
         <CardContent className="pt-8 pb-6 text-center space-y-6">
           {status === "loading" && (
             <>
               <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
               <div>
                 <h2 className="text-xl font-semibold">Processing Verification</h2>
                 <p className="text-muted-foreground mt-2">
                   Fetching your Aadhaar details from DigiLocker...
                 </p>
               </div>
             </>
           )}
 
           {status === "success" && (
             <>
               <div className="mx-auto h-16 w-16 rounded-full bg-success/20 flex items-center justify-center">
                 <CheckCircle2 className="h-8 w-8 text-success" />
               </div>
               <div>
                 <h2 className="text-xl font-semibold text-success">Verification Successful</h2>
                 <p className="text-muted-foreground mt-2">
                   Your Aadhaar has been verified via DigiLocker
                   {isMock && " (Mock Mode)"}
                 </p>
               </div>
 
               {aadhaarData && (
                 <div className="text-left space-y-3 p-4 bg-muted/50 rounded-lg">
                   {aadhaarData.name && (
                     <div className="flex items-center gap-3">
                       <User className="h-4 w-4 text-muted-foreground" />
                       <div>
                         <p className="text-xs text-muted-foreground">Name</p>
                         <p className="font-medium">{aadhaarData.name}</p>
                       </div>
                     </div>
                   )}
                   {aadhaarData.dob && (
                     <div className="flex items-center gap-3">
                       <Calendar className="h-4 w-4 text-muted-foreground" />
                       <div>
                         <p className="text-xs text-muted-foreground">Date of Birth</p>
                         <p className="font-medium">{aadhaarData.dob}</p>
                       </div>
                     </div>
                   )}
                   {aadhaarData.aadhaar_uid && (
                     <div className="flex items-center gap-3">
                       <div className="h-4 w-4 flex items-center justify-center text-muted-foreground text-xs font-bold">
                         #
                       </div>
                       <div>
                         <p className="text-xs text-muted-foreground">Aadhaar UID</p>
                         <p className="font-medium font-mono">{aadhaarData.aadhaar_uid}</p>
                       </div>
                     </div>
                   )}
                   {aadhaarData.addresses?.[0]?.combined && (
                     <div className="flex items-start gap-3">
                       <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                       <div>
                         <p className="text-xs text-muted-foreground">Address</p>
                         <p className="font-medium text-sm">{aadhaarData.addresses[0].combined}</p>
                       </div>
                     </div>
                   )}
                 </div>
               )}
             </>
           )}
 
           {status === "error" && (
             <>
               <div className="mx-auto h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center">
                 <AlertTriangle className="h-8 w-8 text-destructive" />
               </div>
               <div>
                 <h2 className="text-xl font-semibold">Verification Failed</h2>
                 <p className="text-muted-foreground mt-2">{errorMessage}</p>
               </div>
             </>
           )}
 
           <Button onClick={handleContinue} className="w-full mt-4">
             Continue
           </Button>
         </CardContent>
       </Card>
     </div>
   );
 }