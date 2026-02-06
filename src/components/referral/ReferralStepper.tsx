import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

const STEPS = [
  { id: 1, label: "Company" },
  { id: 2, label: "Contact" },
  { id: 3, label: "Bank" },
  { id: 4, label: "Documents" },
];

interface ReferralStepperProps {
  currentStep: number;
}

export function ReferralStepper({ currentStep }: ReferralStepperProps) {
  return (
    <div className="flex items-center justify-between px-4 py-4 bg-card border-b border-border">
      {STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                currentStep > step.id
                  ? "bg-accent text-accent-foreground"
                  : currentStep === step.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {currentStep > step.id ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                step.id
              )}
            </div>
            <span
              className={cn(
                "text-[11px] mt-1 max-w-[56px] text-center leading-tight font-medium",
                currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div
              className={cn(
                "h-1 w-8 mx-1 rounded-full transition-colors",
                currentStep > step.id ? "bg-accent" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
