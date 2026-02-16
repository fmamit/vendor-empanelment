import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

const STEPS = [
  { id: 0, label: "Consent" },
  { id: 1, label: "Company" },
  { id: 2, label: "Contact" },
  { id: 3, label: "Bank" },
  { id: 4, label: "Docs" },
];

interface ReferralStepperProps {
  currentStep: number;
}

export function ReferralStepper({ currentStep }: ReferralStepperProps) {
  return (
    <div className="flex items-center justify-end">
      {STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-colors",
                currentStep > step.id
                  ? "bg-accent text-accent-foreground"
                  : currentStep === step.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {currentStep > step.id ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                step.id
              )}
            </div>
            <span
              className={cn(
                "text-[9px] mt-0.5 max-w-[40px] text-center leading-tight font-medium",
                currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div
              className={cn(
                "h-0.5 w-4 mx-0.5 rounded-full transition-colors",
                currentStep > step.id ? "bg-accent" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
