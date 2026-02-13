import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DigiLockerFailure() {
  const navigate = useNavigate();

  return (
    <StaffLayout title="Aadhaar Verification">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Aadhaar Verification Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The Aadhaar verification process was not completed. This could be due to:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>User cancelled the verification</li>
              <li>Incorrect credentials provided</li>
              <li>Technical issue with DigiLocker</li>
            </ul>
            <Button onClick={() => navigate(-1)} className="w-full">
              Back to Review
            </Button>
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}
