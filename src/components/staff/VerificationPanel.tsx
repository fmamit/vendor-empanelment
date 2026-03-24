import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, XCircle, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useVendorVerifications,
  useVerifyPan,
  useVerifyBankAccount,
  useVerifyAadhaarInit,
  useSaveAadhaarDetails,
} from "@/hooks/useVendorVerification";
import { toast } from "@/hooks/use-toast";
import { VerificationBadge } from "@/components/fraud/VerificationBadge";

interface VerificationPanelProps {
  vendorId: string;
  panNumber?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
}

export function VerificationPanel({
  vendorId,
  panNumber,
  bankAccountNumber,
  bankIfsc,
}: VerificationPanelProps) {
  const { data: verifications, isLoading: verificationsLoading, refetch } = useVendorVerifications(vendorId);
  const verifyPan = useVerifyPan();
  const verifyBankAccount = useVerifyBankAccount();
  const verifyAadhaarInit = useVerifyAadhaarInit();
  const saveAadhaarDetails = useSaveAadhaarDetails();

  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [aadhaarLoading, setAadhaarLoading] = useState(false);

  // Build verification status map
  const verificationStatusMap = verifications?.reduce((acc, v) => {
    acc[v.verification_type] = {
      status: v.status,
      data: v.response_data,
      verified_at: v.verified_at,
    };
    return acc;
  }, {} as Record<string, any>) || {};

  const handleVerifyAadhaar = async () => {
    setAadhaarLoading(true);
    try {
      // Step 1: Initialize Surepass Digilocker session
      const initData = await verifyAadhaarInit.mutateAsync({ vendorId });

      // Step 2: Load Digiboost SDK and open popup
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/gh/surepassio/surepass-digiboost-web-sdk@latest/index.min.js";
        script.onload = () => {
          (window as any).DigiboostSdk({
            gateway: "sandbox",
            token: initData.token,
            selector: "#digilocker-trigger",
            onSuccess: async (data: any) => {
              try {
                // Step 3: Save Aadhaar data to backend
                await saveAadhaarDetails.mutateAsync({
                  verificationId: initData.verification_id,
                  aadhaarData: data,
                });
                toast({ title: "Success", description: "Aadhaar verified successfully" });
                refetch();
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            onFailure: (error: any) => {
              reject(new Error(error?.message || "Digilocker verification was cancelled or failed"));
            },
          });
        };
        script.onerror = () => reject(new Error("Failed to load Digilocker SDK"));
        document.body.appendChild(script);
      });
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Aadhaar verification failed",
        variant: "destructive",
      });
    } finally {
      setAadhaarLoading(false);
    }
  };

  const handleVerifyPan = async () => {
    if (!panNumber) {
      toast({ title: "Error", description: "PAN number not available", variant: "destructive" });
      return;
    }

    try {
      await verifyPan.mutateAsync({ panNumber, vendorId });
      toast({ title: "Success", description: "PAN verified successfully" });
      refetch();
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "PAN verification failed",
        variant: "destructive",
      });
    }
  };

  const handleVerifyBankAccount = async () => {
    if (!bankAccountNumber || !bankIfsc) {
      toast({
        title: "Error",
        description: "Bank account details not available",
        variant: "destructive",
      });
      return;
    }

    try {
      await verifyBankAccount.mutateAsync({
        accountNumber: bankAccountNumber,
        ifscCode: bankIfsc,
        vendorId,
      });
      toast({ title: "Success", description: "Bank account verified successfully" });
      refetch();
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Bank account verification failed",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case "in_progress":
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "success":
        return "bg-success/20 text-success";
      case "failed":
        return "bg-destructive/20 text-destructive";
      case "error":
        return "bg-warning/20 text-warning";
      case "in_progress":
        return "bg-primary/20 text-primary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (verificationsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Verifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Verification Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* PAN Verification */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">PAN Verification</span>
              {verificationStatusMap.pan && getStatusIcon(verificationStatusMap.pan.status)}
            </div>
            {verificationStatusMap.pan && (
              <Badge className={cn("text-xs", getStatusBadgeVariant(verificationStatusMap.pan.status))}>
                {verificationStatusMap.pan.status}
              </Badge>
            )}
          </div>

          {verificationStatusMap.pan?.data && (
            <div className="text-sm text-muted-foreground mb-3 space-y-1">
              <p>Name: <span className="text-foreground font-medium">{verificationStatusMap.pan.data.name}</span></p>
              <p>DOB: <span className="text-foreground font-medium">{verificationStatusMap.pan.data.dob}</span></p>
            </div>
          )}

          <Button
            onClick={handleVerifyPan}
            disabled={!panNumber || verifyPan.isPending}
            variant={verificationStatusMap.pan ? "outline" : "default"}
            size="sm"
            className="w-full"
          >
            {verifyPan.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify PAN"
            )}
          </Button>
        </div>

        {/* Bank Account Verification */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Bank Account Verification</span>
              {verificationStatusMap.bank_account && getStatusIcon(verificationStatusMap.bank_account.status)}
            </div>
            {verificationStatusMap.bank_account && (
              <Badge className={cn("text-xs", getStatusBadgeVariant(verificationStatusMap.bank_account.status))}>
                {verificationStatusMap.bank_account.status}
              </Badge>
            )}
          </div>

          {verificationStatusMap.bank_account?.data && (
            <div className="text-sm text-muted-foreground mb-3 space-y-1">
              <p>Account Holder: <span className="text-foreground font-medium">{verificationStatusMap.bank_account.data.account_holder_name}</span></p>
              <p>Bank: <span className="text-foreground font-medium">{verificationStatusMap.bank_account.data.bank_name}</span></p>
              <p>Branch: <span className="text-foreground font-medium">{verificationStatusMap.bank_account.data.branch_name}</span></p>
            </div>
          )}

          {!bankAccountNumber || !bankIfsc ? (
            <p className="text-sm text-muted-foreground italic">
              Bank details not available for this vendor. Please ensure bank account number and IFSC are provided during registration.
            </p>
          ) : (
            <Button
              onClick={handleVerifyBankAccount}
              disabled={verifyBankAccount.isPending}
              variant={verificationStatusMap.bank_account ? "outline" : "default"}
              size="sm"
              className="w-full"
            >
              {verifyBankAccount.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Bank Account"
              )}
            </Button>
          )}
        </div>

        {/* Aadhaar Verification via Digilocker */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Aadhaar (DigiLocker)</span>
              {verificationStatusMap.aadhaar && getStatusIcon(verificationStatusMap.aadhaar.status)}
            </div>
            {verificationStatusMap.aadhaar && (
              <Badge className={cn("text-xs", getStatusBadgeVariant(verificationStatusMap.aadhaar.status))}>
                {verificationStatusMap.aadhaar.status}
              </Badge>
            )}
          </div>

          {verificationStatusMap.aadhaar?.data && (
            <div className="text-sm text-muted-foreground mb-3 space-y-1">
              {verificationStatusMap.aadhaar.data.name && (
                <p>Name: <span className="text-foreground font-medium">{verificationStatusMap.aadhaar.data.name}</span></p>
              )}
              {verificationStatusMap.aadhaar.data.dob && (
                <p>DOB: <span className="text-foreground font-medium">{verificationStatusMap.aadhaar.data.dob}</span></p>
              )}
              {verificationStatusMap.aadhaar.data.gender && (
                <p>Gender: <span className="text-foreground font-medium">{verificationStatusMap.aadhaar.data.gender}</span></p>
              )}
            </div>
          )}

          <div id="digilocker-trigger" />
          <Button
            onClick={handleVerifyAadhaar}
            disabled={aadhaarLoading}
            variant={verificationStatusMap.aadhaar ? "outline" : "default"}
            size="sm"
            className="w-full"
          >
            {aadhaarLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Aadhaar"
            )}
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
