import capitalIndiaLogo from "@/assets/capital-india-logo.webp";
import { ReferralStepper } from "./ReferralStepper";

interface ReferralHeaderProps {
  currentStep?: number;
}

export function ReferralHeader({ currentStep = 0 }: ReferralHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="flex items-center gap-3 px-4 py-2">
        <img
          src={capitalIndiaLogo}
          alt="Capital India"
          className="h-8 object-contain shrink-0"
        />
        <h1 className="text-sm font-semibold text-primary whitespace-nowrap">
          Vendor Registration
        </h1>
        <div className="flex-1 min-w-0">
          <ReferralStepper currentStep={currentStep} />
        </div>
      </div>
    </header>
  );
}
