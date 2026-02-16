import capitalIndiaLogo from "@/assets/capital-india-logo.jpg";
import { ReferralStepper } from "./ReferralStepper";

interface ReferralHeaderProps {
  currentStep?: number;
}

export function ReferralHeader({ currentStep = 0 }: ReferralHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="flex items-center justify-between px-3 py-2">
        {/* Left: Logo */}
        <img
          src={capitalIndiaLogo}
          alt="Capital India"
          className="h-10 object-contain shrink-0"
        />
        {/* Center: Title */}
        <h1 className="text-sm font-semibold text-primary whitespace-nowrap px-3">
          Vendor Registration
        </h1>
        {/* Right: Stepper */}
        <div className="flex-1 min-w-0">
          <ReferralStepper currentStep={currentStep} />
        </div>
      </div>
    </header>
  );
}
