import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  Calendar,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Loader2
} from "lucide-react";
import { AlertSeverityBadge } from "./AlertSeverityBadge";
import { TamperingIndicator } from "./TamperingIndicator";
import { DuplicateComparisonCard } from "./DuplicateComparisonCard";
import { FraudAlert } from "@/hooks/useFraudAlerts";
import { format } from "date-fns";

interface FraudAlertDetailProps {
  alert: FraudAlert;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss?: (alertId: string, reason: string) => void;
  onConfirm?: (alertId: string) => void;
  onViewVendor?: (vendorId: string) => void;
}

export function FraudAlertDetail({
  alert,
  open,
  onOpenChange,
  onDismiss,
  onConfirm,
  onViewVendor,
}: FraudAlertDetailProps) {
  const [dismissReason, setDismissReason] = useState("");
  const [showDismissForm, setShowDismissForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDismiss = async () => {
    if (!dismissReason.trim() || !onDismiss) return;
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 500));
    onDismiss(alert.id, dismissReason);
    setIsSubmitting(false);
    setShowDismissForm(false);
    setDismissReason("");
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!onConfirm) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 500));
    onConfirm(alert.id);
    setIsSubmitting(false);
    onOpenChange(false);
  };

  const isDuplicateType = ['duplicate_gst', 'duplicate_pan', 'duplicate_bank', 'similar_name'].includes(alert.alert_type);
  const isTamperingType = alert.alert_type === 'tampering';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertSeverityBadge severity={alert.severity} />
            <DialogTitle className="text-base">{alert.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Alert Description */}
          <p className="text-sm text-muted-foreground">{alert.description}</p>

          {/* Vendor Info */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{alert.vendor_name}</p>
                  {alert.vendor_code && (
                    <p className="text-xs text-muted-foreground">{alert.vendor_code}</p>
                  )}
                </div>
                {onViewVendor && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onViewVendor(alert.vendor_id)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    View
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Duplicate Comparison */}
          {isDuplicateType && alert.details.matching_vendor_id && (
            <DuplicateComparisonCard
              currentVendor={{
                id: alert.vendor_id,
                name: alert.vendor_name,
                code: alert.vendor_code,
                status: "pending_review",
              }}
              matchingVendor={{
                id: alert.details.matching_vendor_id,
                name: alert.details.matching_vendor_name || "Unknown Vendor",
                code: null,
                status: "approved",
              }}
              matchType={
                alert.alert_type === 'duplicate_gst' ? 'gst' :
                alert.alert_type === 'duplicate_pan' ? 'pan' :
                alert.alert_type === 'duplicate_bank' ? 'bank' : 'name'
              }
              matchValue={alert.details.matching_value || ""}
              similarityScore={alert.details.similarity_score}
              onViewVendor={onViewVendor}
            />
          )}

          {/* Tampering Details */}
          {isTamperingType && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-3">Tampering Analysis</p>
                <TamperingIndicator
                  score={alert.details.confidence_score || 0}
                  indicators={alert.details.tampering_indicators || []}
                  showDetails
                />
              </CardContent>
            </Card>
          )}

          {/* Verification Failed Details */}
          {alert.alert_type === 'verification_failed' && (
            <Card className="border-destructive/30">
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-2">Verification Details</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">{alert.details.verification_type}</span>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Error</p>
                    <p className="text-destructive text-xs bg-destructive/5 p-2 rounded">
                      {alert.details.verification_error}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Meta Info */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Created: {format(new Date(alert.created_at), "PPp")}</span>
          </div>

          {/* Status Badge */}
          {alert.status !== 'pending' && (
            <>
              <Separator />
              <div className="space-y-2">
                <Badge variant="outline" className={
                  alert.status === 'dismissed' ? "bg-muted" :
                  alert.status === 'confirmed' ? "bg-destructive/10 text-destructive border-destructive/30" :
                  "bg-primary/10 text-primary border-primary/30"
                }>
                  {alert.status === 'dismissed' ? 'Dismissed' : 
                   alert.status === 'confirmed' ? 'Confirmed Fraud' : 'Reviewed'}
                </Badge>
                {alert.dismiss_reason && (
                  <p className="text-xs text-muted-foreground">
                    Reason: {alert.dismiss_reason}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Dismiss Form */}
          {showDismissForm && (
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Dismiss Reason</p>
              <Textarea
                placeholder="Explain why this alert is being dismissed..."
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowDismissForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleDismiss}
                  disabled={!dismissReason.trim() || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Dismiss"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {alert.status === 'pending' && !showDismissForm && (
          <DialogFooter className="flex-row gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDismissForm(true)}
            >
              <XCircle className="h-4 w-4 mr-1.5" />
              Dismiss
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-1.5" />
                  Confirm Fraud
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
