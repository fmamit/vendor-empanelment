import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2, XCircle, Loader2, ShieldCheck, Link2, Copy, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useVendorVerifications,
  useVerifyPan,
  useVerifyBankAccount,
} from "@/hooks/useVendorVerification";
import { supabase } from "@/integrations/supabase/client";
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

  const [aadhaarLink, setAadhaarLink] = useState<string | null>(null);
  const [aadhaarLinkLoading, setAadhaarLinkLoading] = useState(false);
  const [checkingAadhaar, setCheckingAadhaar] = useState(false);

  // Build verification status map
  const verificationStatusMap = verifications?.reduce((acc, v) => {
    acc[v.verification_type] = {
      status: v.status,
      data: v.response_data,
      verified_at: v.verified_at,
    };
    return acc;
  }, {} as Record<string, any>) || {};

  const handleGenerateAadhaarLink = async () => {
    setAadhaarLinkLoading(true);
    try {
      // Create a pending verification record; vendor opens the link to complete DigiLocker
      const { data, error } = await supabase
        .from("vendor_verifications")
        .insert({
          vendor_id: vendorId,
          verification_type: "aadhaar",
          verification_source: "surepass",
          status: "pending",
          request_data: { initiated_at: new Date().toISOString() },
        })
        .select("id")
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/vendor/verify-aadhaar/${data.id}`;
      setAadhaarLink(link);
      navigator.clipboard.writeText(link).catch(() => {});
      toast({ title: "Link generated", description: "Copied to clipboard — send to the vendor" });
    } catch (error) {
      toast({
        title: "Failed to generate link",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setAadhaarLinkLoading(false);
    }
  };

  const handleCheckAadhaarStatus = async () => {
    setCheckingAadhaar(true);
    try {
      await refetch();
      const latest = verifications?.find(v => v.verification_type === "aadhaar");
      if (latest?.status === "success") {
        toast({ title: "Aadhaar verified!", description: "Vendor has completed DigiLocker verification" });
      } else {
        toast({ title: "Not yet verified", description: "Vendor hasn't completed the DigiLocker flow yet" });
      }
    } finally {
      setCheckingAadhaar(false);
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

        {/* Aadhaar Verification via DigiLocker */}
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

          {/* Link display once generated */}
          {aadhaarLink && (
            <div className="flex items-center gap-2 mb-3">
              <Input value={aadhaarLink} readOnly className="text-xs h-8 font-mono" />
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(aadhaarLink);
                  toast({ title: "Copied to clipboard" });
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleGenerateAadhaarLink}
              disabled={aadhaarLinkLoading || verificationStatusMap.aadhaar?.status === "success"}
              variant={verificationStatusMap.aadhaar ? "outline" : "default"}
              size="sm"
              className="flex-1"
            >
              {aadhaarLinkLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-1" />
                  {aadhaarLink ? "Regenerate Link" : "Generate Link"}
                </>
              )}
            </Button>
            {(aadhaarLink || verificationStatusMap.aadhaar?.status === "in_progress" || verificationStatusMap.aadhaar?.status === "pending") && (
              <Button
                onClick={handleCheckAadhaarStatus}
                disabled={checkingAadhaar}
                variant="outline"
                size="sm"
              >
                {checkingAadhaar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Generate a link and share it with the vendor. They complete DigiLocker on their own device.
          </p>
        </div>

      </CardContent>
    </Card>
  );
}
