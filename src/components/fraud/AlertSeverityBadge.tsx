import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type Severity = 'critical' | 'high' | 'medium' | 'low';

interface AlertSeverityBadgeProps {
  severity: Severity;
  showIcon?: boolean;
  size?: 'sm' | 'default';
}

const SEVERITY_CONFIG: Record<Severity, { label: string; className: string; icon: React.ElementType }> = {
  critical: {
    label: "Critical",
    className: "bg-destructive text-destructive-foreground",
    icon: ShieldAlert,
  },
  high: {
    label: "High",
    className: "bg-warning text-warning-foreground",
    icon: AlertTriangle,
  },
  medium: {
    label: "Medium",
    className: "bg-primary text-primary-foreground",
    icon: AlertCircle,
  },
  low: {
    label: "Low",
    className: "bg-muted text-muted-foreground",
    icon: Info,
  },
};

export function AlertSeverityBadge({ severity, showIcon = true, size = 'default' }: AlertSeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity];
  const Icon = config.icon;

  return (
    <Badge 
      className={cn(
        config.className,
        size === 'sm' && 'text-xs px-1.5 py-0.5'
      )}
    >
      {showIcon && <Icon className={cn("mr-1", size === 'sm' ? "h-3 w-3" : "h-3.5 w-3.5")} />}
      {config.label}
    </Badge>
  );
}
