import capitalIndiaLogo from "@/assets/capital-india-logo.jpg";

export function ReferralHeader() {
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="flex items-center justify-center h-14 px-4">
        <img
          src={capitalIndiaLogo}
          alt="Capital India"
          className="h-8 object-contain"
        />
      </div>
      <div className="bg-primary text-primary-foreground text-center py-1.5 text-sm font-medium">
        Vendor Registration
      </div>
    </header>
  );
}
