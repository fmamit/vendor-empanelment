import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, AlertCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type VerificationStatus = 'verified' | 'pending' | 'failed' | 'mismatch' | 'not_checked';
type VerificationType = 'GST' | 'PAN' | 'Bank' | 'CIN';

interface VerificationBadgeProps {
  type: VerificationType;
  status: VerificationStatus;
  compact?: boolean;
}

const STATUS_CONFIG: Record<VerificationStatus, { label: string; className: string; icon: React.ElementType }> = {
  verified: {
    label: "Verified",
    className: "bg-success/20 text-success border-success/30",
    icon: CheckCircle2,
  },
  pending: {
    label: "Pending",
    className: "bg-warning/20 text-warning border-warning/30",
    icon: Clock,
  },
  failed: {
    label: "Failed",
    className: "bg-destructive/20 text-destructive border-destructive/30",
    icon: XCircle,
  },
  mismatch: {
    label: "Mismatch",
    className: "bg-warning/20 text-warning border-warning/30",
    icon: AlertCircle,
  },
  not_checked: {
    label: "Not Checked",
    className: "bg-muted text-muted-foreground border-muted",
    icon: HelpCircle,
  },
};

export function VerificationBadge({ type, status, compact = false }: VerificationBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{type}</span>
        <Icon className={cn("h-4 w-4", 
          status === 'verified' && "text-success",
          status === 'pending' && "text-warning",
          status === 'failed' && "text-destructive",
          status === 'mismatch' && "text-warning",
          status === 'not_checked' && "text-muted-foreground"
        )} />
      </div>
    );
  }

  return (
    <Badge variant="outline" className={cn("gap-1", config.className)}>
      <Icon className="h-3 w-3" />
      <span>{type}:</span>
      <span className="font-medium">{config.label}</span>
    </Badge>
  );
}

interface VerificationStatusRowProps {
  verifications: Array<{ type: VerificationType; status: VerificationStatus }>;
}

export function VerificationStatusRow({ verifications }: VerificationStatusRowProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {verifications.map((v) => (
        <VerificationBadge key={v.type} type={v.type} status={v.status} />
      ))}
    </div>
  );
}
