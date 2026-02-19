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
  mobile?: boolean;
}

export function ReferralStepper({ currentStep, mobile }: ReferralStepperProps) {
  return (
    <div className="flex items-center justify-end">
      {STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "rounded-full flex items-center justify-center font-semibold transition-colors",
                mobile
                  ? "w-8 h-8 text-sm"
                  : "w-[72px] h-[72px] text-[30px]",
                currentStep > step.id
                  ? "bg-accent text-accent-foreground"
                  : currentStep === step.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {currentStep > step.id ? (
                <CheckCircle2 className={mobile ? "h-4 w-4" : "h-10 w-10"} />
              ) : (
                step.id
              )}
            </div>
            <span
              className={cn(
                "mt-1 text-center leading-tight font-medium",
                mobile
                  ? "text-[10px] max-w-[40px]"
                  : "text-[27px] max-w-[120px]",
                currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div
              className={cn(
                "rounded-full transition-colors",
                mobile
                  ? "h-0.5 w-4 mx-0.5"
                  : "h-1.5 w-12 mx-1.5",
                currentStep > step.id ? "bg-accent" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
