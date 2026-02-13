import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useFetchAadhaarDetails } from "@/hooks/useVendorVerification";
import { useNavigate } from "react-router-dom";

export default function DigiLockerSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const uniqueRequestNumber = searchParams.get("id");
  const vendorId = sessionStorage.getItem("current_vendor_id");
  const fetchAadhaarDetails = useFetchAadhaarDetails();
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    if (uniqueRequestNumber && vendorId) {
      fetchAadhaarDetails.mutateAsync({
        uniqueRequestNumber,
        vendorId,
      }).then(data => {
        setDetails(data);
      }).catch(error => {
        console.error("Failed to fetch Aadhaar details:", error);
      });
    }
  }, [uniqueRequestNumber, vendorId]);

  return (
    <StaffLayout title="Aadhaar Verification">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Aadhaar Verification Successful
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fetchAadhaarDetails.isPending ? (
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : details ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{details.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium">{details.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{details.dob}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="text-sm">{details.address?.line1}</p>
                  <p className="text-sm">{details.address?.line2}</p>
                  <p className="text-sm">
                    {details.address?.city}, {details.address?.state} {details.address?.pincode}
                  </p>
                </div>
                <Button onClick={() => navigate(-1)} className="w-full">
                  Back to Review
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                <p className="text-sm text-muted-foreground">Failed to retrieve Aadhaar details</p>
                <Button onClick={() => navigate(-1)} variant="outline" className="w-full">
                  Back to Review
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}
