import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface Step {
  id: number;
  title: string;
}

interface RegistrationStepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function RegistrationStepper({ steps, currentStep, className }: RegistrationStepperProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                currentStep > step.id
                  ? "bg-success text-success-foreground"
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
                "text-xs mt-1 max-w-[60px] text-center leading-tight",
                currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.title}
            </span>
          </div>
          
          {index < steps.length - 1 && (
            <div
              className={cn(
                "h-1 w-8 mx-1 rounded-full",
                currentStep > step.id ? "bg-success" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
