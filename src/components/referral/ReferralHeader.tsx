import capitalIndiaLogo from "@/assets/capital-india-logo.jpg";

export function ReferralHeader() {
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="flex items-center justify-center py-6 px-4">
        <img
          src={capitalIndiaLogo}
          alt="Capital India"
          className="h-40 object-contain"
        />
      </div>
      <div className="bg-primary text-primary-foreground text-center py-2 text-base font-semibold">
        Vendor Registration
      </div>
    </header>
  );
}
