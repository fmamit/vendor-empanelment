import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { differenceInDays, format } from "date-fns";

interface ExpiryBadgeProps {
  expiryDate: string | Date | null;
  showDate?: boolean;
}

export function ExpiryBadge({ expiryDate, showDate = false }: ExpiryBadgeProps) {
  if (!expiryDate) {
    return null;
  }

  const date = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  const daysUntilExpiry = differenceInDays(date, new Date());

  const getExpiryStatus = () => {
    if (daysUntilExpiry < 0) {
      return {
        label: "Expired",
        className: "bg-destructive text-destructive-foreground",
        icon: AlertCircle,
      };
    }
    if (daysUntilExpiry <= 7) {
      return {
        label: `${daysUntilExpiry}d left`,
        className: "bg-destructive/20 text-destructive border-destructive/30",
        icon: AlertTriangle,
      };
    }
    if (daysUntilExpiry <= 15) {
      return {
        label: `${daysUntilExpiry}d left`,
        className: "bg-warning/20 text-warning border-warning/30",
        icon: AlertTriangle,
      };
    }
    if (daysUntilExpiry <= 30) {
      return {
        label: `${daysUntilExpiry}d left`,
        className: "bg-warning/10 text-warning border-warning/20",
        icon: Clock,
      };
    }
    return {
      label: showDate ? format(date, "MMM d, yyyy") : "Valid",
      className: "bg-success/10 text-success border-success/20",
      icon: null,
    };
  };

  const status = getExpiryStatus();
  const Icon = status.icon;

  return (
    <Badge variant="outline" className={cn("gap-1 text-xs", status.className)}>
      {Icon && <Icon className="h-3 w-3" />}
      {status.label}
    </Badge>
  );
}
