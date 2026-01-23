import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Copy, 
  CreditCard, 
  Building2, 
  FileWarning, 
  ShieldX, 
  ChevronRight,
  Clock
} from "lucide-react";
import { AlertSeverityBadge } from "./AlertSeverityBadge";
import { FraudAlert } from "@/hooks/useFraudAlerts";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface FraudAlertCardProps {
  alert: FraudAlert;
  onClick?: () => void;
  compact?: boolean;
}

const ALERT_TYPE_CONFIG = {
  duplicate_gst: { icon: Copy, label: "Duplicate GST" },
  duplicate_pan: { icon: Copy, label: "Duplicate PAN" },
  duplicate_bank: { icon: CreditCard, label: "Duplicate Bank" },
  similar_name: { icon: Building2, label: "Similar Name" },
  tampering: { icon: FileWarning, label: "Tampering" },
  verification_failed: { icon: ShieldX, label: "Verification Failed" },
};

const STATUS_CONFIG = {
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/30" },
  reviewed: { label: "Reviewed", className: "bg-primary/10 text-primary border-primary/30" },
  dismissed: { label: "Dismissed", className: "bg-muted text-muted-foreground" },
  confirmed: { label: "Confirmed Fraud", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

export function FraudAlertCard({ alert, onClick, compact = false }: FraudAlertCardProps) {
  const typeConfig = ALERT_TYPE_CONFIG[alert.alert_type];
  const statusConfig = STATUS_CONFIG[alert.status];
  const TypeIcon = typeConfig.icon;

  if (compact) {
    return (
      <div 
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
          alert.severity === 'critical' && "border-destructive/50 bg-destructive/5",
          alert.severity === 'high' && "border-warning/50 bg-warning/5"
        )}
        onClick={onClick}
      >
        <div className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
          alert.severity === 'critical' && "bg-destructive/10",
          alert.severity === 'high' && "bg-warning/10",
          alert.severity === 'medium' && "bg-primary/10",
          alert.severity === 'low' && "bg-muted"
        )}>
          <TypeIcon className={cn(
            "h-4 w-4",
            alert.severity === 'critical' && "text-destructive",
            alert.severity === 'high' && "text-warning",
            alert.severity === 'medium' && "text-primary",
            alert.severity === 'low' && "text-muted-foreground"
          )} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{alert.title}</p>
          <p className="text-xs text-muted-foreground truncate">{alert.vendor_name}</p>
        </div>

        <AlertSeverityBadge severity={alert.severity} showIcon={false} size="sm" />
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    );
  }

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all",
        alert.severity === 'critical' && "border-destructive/50",
        alert.severity === 'high' && "border-warning/50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
            alert.severity === 'critical' && "bg-destructive/10",
            alert.severity === 'high' && "bg-warning/10",
            alert.severity === 'medium' && "bg-primary/10",
            alert.severity === 'low' && "bg-muted"
          )}>
            <TypeIcon className={cn(
              "h-5 w-5",
              alert.severity === 'critical' && "text-destructive",
              alert.severity === 'high' && "text-warning",
              alert.severity === 'medium' && "text-primary",
              alert.severity === 'low' && "text-muted-foreground"
            )} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="font-medium text-sm">{alert.title}</h4>
              <AlertSeverityBadge severity={alert.severity} showIcon={false} size="sm" />
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {alert.description}
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                <Building2 className="h-3 w-3 mr-1" />
                {alert.vendor_name}
              </Badge>
              <Badge variant="outline" className={cn("text-xs", statusConfig.className)}>
                {statusConfig.label}
              </Badge>
            </div>

            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
