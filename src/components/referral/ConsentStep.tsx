import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";

interface ConsentStepProps {
  consented: boolean;
  onConsentChange: (consented: boolean) => void;
}

const CONSENT_VERSION = "1.0";

export function ConsentStep({ consented, onConsentChange }: ConsentStepProps) {
  const { tenant } = useTenant();
  const orgName = tenant?.short_name || "the organization";
  const dpoEmail = tenant?.dpo_email || "dpo@company.com";

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3 text-primary">
        <ShieldCheck className="h-10 w-10" />
        <h2 className="font-semibold text-2xl">Data Protection Notice</h2>
      </div>

      <p className="text-lg text-muted-foreground">
        Under the Digital Personal Data Protection Act, 2023, we are required to inform you about how your data will be used before collection.
      </p>

      <ScrollArea className="h-[55vh] rounded-lg border border-border bg-muted/30 p-6">
        <div className="space-y-5 text-base text-foreground pr-4">
          <section>
            <h3 className="font-semibold text-lg mb-1">What data we collect</h3>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Company information (name, trade name, GST, PAN, CIN, addresses)</li>
              <li>Contact details (name, mobile number, email address)</li>
              <li>Bank account details (account number, IFSC, bank name, branch)</li>
              <li>Identity & business documents (PAN card, GST certificate, cancelled cheque, etc.)</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-1">Why we collect it</h3>
            <p className="text-muted-foreground">
              Your data is collected solely for the purpose of vendor onboarding, identity verification, and maintaining an ongoing business relationship with {orgName}.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-1">How long we retain it</h3>
            <p className="text-muted-foreground">
              Your data is retained for the duration of the business relationship and for a period of 7 years thereafter, as required by applicable laws and regulations.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-1">Your rights</h3>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>Right to Access:</strong> Request a copy of all personal data held about you.</li>
              <li><strong>Right to Correction:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data.</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw this consent at any time from your dashboard.</li>
              <li><strong>Right to Nominate:</strong> Appoint someone to exercise your data rights on your behalf.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-1">Data Protection Officer</h3>
            <p className="text-muted-foreground">
              For any data-related queries, contact our Data Protection Officer at{" "}
              <span className="font-medium text-primary">{dpoEmail}</span>
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-1">Grievance Redressal</h3>
            <p className="text-muted-foreground">
              If your concern is not resolved within 90 days, you may file a complaint with the Data Protection Board of India.
            </p>
          </section>
        </div>
      </ScrollArea>

      <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
        <Checkbox
          id="consent"
          checked={consented}
          onCheckedChange={(checked) => onConsentChange(checked === true)}
          className="mt-0.5"
        />
        <label htmlFor="consent" className="text-base leading-relaxed cursor-pointer">
          I have read and understood the above notice. I freely consent to the collection and processing of my personal data for the stated purpose of vendor onboarding.{" "}
          <span className="text-sm text-muted-foreground">(Consent v{CONSENT_VERSION})</span>
        </label>
      </div>

      <a
        href="/privacy-policy"
        target="_blank"
        className="inline-flex items-center gap-1 text-base text-primary hover:underline"
      >
        View full Privacy Policy <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}

export { CONSENT_VERSION };
