import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TamperingIndicatorProps {
  score: number; // 0-100, higher = more suspicious
  indicators?: string[];
  showDetails?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export function TamperingIndicator({ 
  score, 
  indicators = [], 
  showDetails = false,
  size = 'default' 
}: TamperingIndicatorProps) {
  const getSeverity = () => {
    if (score <= 25) return { label: "Low Risk", color: "text-success", bgColor: "bg-success", icon: ShieldCheck };
    if (score <= 50) return { label: "Moderate", color: "text-warning", bgColor: "bg-warning", icon: Shield };
    if (score <= 75) return { label: "Suspicious", color: "text-warning", bgColor: "bg-warning", icon: ShieldAlert };
    return { label: "High Risk", color: "text-destructive", bgColor: "bg-destructive", icon: ShieldAlert };
  };

  const severity = getSeverity();
  const Icon = severity.icon;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className={cn(
          "rounded-full p-1.5",
          score <= 25 && "bg-success/10",
          score > 25 && score <= 50 && "bg-warning/10",
          score > 50 && "bg-destructive/10"
        )}>
          <Icon className={cn(
            size === 'sm' && "h-4 w-4",
            size === 'default' && "h-5 w-5",
            size === 'lg' && "h-6 w-6",
            severity.color
          )} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className={cn(
              "font-medium",
              size === 'sm' && "text-xs",
              size === 'default' && "text-sm",
              severity.color
            )}>
              {severity.label}
            </span>
            <span className={cn(
              "font-mono",
              size === 'sm' && "text-xs",
              size === 'default' && "text-sm",
              severity.color
            )}>
              {score}%
            </span>
          </div>
          <Progress 
            value={score} 
            className={cn(
              "h-1.5",
              size === 'sm' && "h-1"
            )}
          />
        </div>
      </div>

      {showDetails && indicators.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Indicators Detected
          </p>
          <ul className="space-y-1">
            {indicators.map((indicator, idx) => (
              <li 
                key={idx}
                className="text-sm text-muted-foreground flex items-start gap-2"
              >
                <span className="text-destructive mt-1">•</span>
                {indicator}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
