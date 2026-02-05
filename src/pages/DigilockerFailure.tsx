 import { useNavigate, useSearchParams } from "react-router-dom";
 import { Card, CardContent } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { XCircle } from "lucide-react";
 
 export default function DigilockerFailure() {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const error = searchParams.get("error");
   const vendorId = searchParams.get("vendorId");
 
   const handleRetry = () => {
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
           <div className="mx-auto h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center">
             <XCircle className="h-8 w-8 text-destructive" />
           </div>
           <div>
             <h2 className="text-xl font-semibold">Verification Failed</h2>
             <p className="text-muted-foreground mt-2">
               {error === "callback_failed" 
                 ? "There was an error processing the DigiLocker callback."
                 : "Aadhaar verification was not completed. You may have cancelled the process or there was an error."}
             </p>
           </div>
 
           <div className="space-y-3">
             <Button onClick={handleRetry} className="w-full">
               Try Again
             </Button>
             <Button variant="outline" onClick={() => navigate("/")} className="w-full">
               Go to Home
             </Button>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }