import capitalIndiaLogo from "@/assets/capital-india-logo.webp";
import { ReferralStepper } from "./ReferralStepper";

interface ReferralHeaderProps {
  currentStep?: number;
}

export function ReferralHeader({ currentStep = 0 }: ReferralHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      {/* Desktop: single row */}
      <div className="hidden md:flex items-center justify-between px-9 py-6">
        <img
          src={capitalIndiaLogo}
          alt="Capital India"
          className="h-[120px] object-contain shrink-0"
        />
        <h1 className="text-[2.625rem] font-semibold text-primary whitespace-nowrap px-6">
          Vendor Registration
        </h1>
        <div className="flex-1 min-w-0">
          <ReferralStepper currentStep={currentStep} />
        </div>
      </div>
      {/* Mobile: stacked */}
      <div className="md:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <img
            src={capitalIndiaLogo}
            alt="Capital India"
            className="h-10 object-contain shrink-0 rounded bg-white p-0.5"
          />
          <h1 className="text-lg font-semibold text-primary">
            Vendor Registration
          </h1>
        </div>
        <div className="px-4 pb-3 overflow-x-auto">
          <ReferralStepper currentStep={currentStep} mobile />
        </div>
      </div>
    </header>
  );
}
