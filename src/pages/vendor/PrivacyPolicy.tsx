import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <MobileLayout title="Privacy Policy" showHeader={true}>
      <div className="flex-1 overflow-auto p-4 space-y-4 pb-8">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-6 w-6" />
          <h1 className="text-xl font-bold">Privacy Policy</h1>
        </div>
        <p className="text-xs text-muted-foreground">Last updated: February 2026 | DPDP Act 2023 Compliant</p>

        <Card><CardContent className="p-4 space-y-2">
          <h2 className="font-semibold">1. Who We Are</h2>
          <p className="text-sm text-muted-foreground">Capital India Corp Limited ("Capital India", "we", "us") is the Data Fiduciary for personal data collected through this Vendor Onboarding Portal.</p>
        </CardContent></Card>

        <Card><CardContent className="p-4 space-y-2">
          <h2 className="font-semibold">2. Data We Collect</h2>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>Company information: name, trade name, GST number, PAN, CIN, registered & operational addresses, constitution type</li>
            <li>Contact details: name, salutation, mobile number, email address</li>
            <li>Bank details: account number, IFSC code, bank name, branch</li>
            <li>Identity & business documents: as required for your vendor category</li>
            <li>Verification data: OTP records, PAN/GST/bank verification responses</li>
          </ul>
        </CardContent></Card>

        <Card><CardContent className="p-4 space-y-2">
          <h2 className="font-semibold">3. Purpose of Collection</h2>
          <p className="text-sm text-muted-foreground">We collect personal data solely for vendor onboarding, identity verification, regulatory compliance (KYC/AML), payment processing, and maintaining an ongoing business relationship.</p>
        </CardContent></Card>

        <Card><CardContent className="p-4 space-y-2">
          <h2 className="font-semibold">4. Legal Basis</h2>
          <p className="text-sm text-muted-foreground">We process your data based on your explicit consent obtained before data collection, as required by Section 6 of the Digital Personal Data Protection Act, 2023.</p>
        </CardContent></Card>

        <Card><CardContent className="p-4 space-y-2">
          <h2 className="font-semibold">5. Data Retention</h2>
          <p className="text-sm text-muted-foreground">Your data is retained for the duration of the business relationship and for 7 years thereafter as required by Indian tax and regulatory laws. Upon consent withdrawal or erasure request, data is anonymised within 90 days, subject to legal retention requirements.</p>
        </CardContent></Card>

        <Card><CardContent className="p-4 space-y-2">
          <h2 className="font-semibold">6. Your Rights (DPDP Act 2023)</h2>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li><strong>Right to Access:</strong> Request a summary of all data held about you</li>
            <li><strong>Right to Correction:</strong> Request correction of inaccurate data</li>
            <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
            <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
            <li><strong>Right to Nominate:</strong> Appoint a nominee to exercise rights on your behalf</li>
            <li><strong>Right to Grievance Redressal:</strong> File complaints within 90 days</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-2">You can exercise these rights from your Vendor Dashboard or by contacting our DPO.</p>
        </CardContent></Card>

        <Card><CardContent className="p-4 space-y-2">
          <h2 className="font-semibold">7. Data Security</h2>
          <p className="text-sm text-muted-foreground">We implement industry-standard security measures including 256-bit encryption, role-based access control, row-level security policies, and comprehensive audit logging.</p>
        </CardContent></Card>

        <Card><CardContent className="p-4 space-y-2">
          <h2 className="font-semibold">8. Data Breach Notification</h2>
          <p className="text-sm text-muted-foreground">In the event of a data breach, we will notify affected individuals and the Data Protection Board of India without delay, in plain language, describing the nature of the breach, its impact, and remedial steps taken.</p>
        </CardContent></Card>

        <Card><CardContent className="p-4 space-y-2">
          <h2 className="font-semibold">9. Contact Us</h2>
          <p className="text-sm text-muted-foreground">
            <strong>Data Protection Officer:</strong><br />
            Email: dpo@capitalindia.com<br />
            Phone: +91-11-XXXX-XXXX<br /><br />
            If your concern is not addressed within 90 days, you may approach the Data Protection Board of India.
          </p>
        </CardContent></Card>
      </div>
    </MobileLayout>
  );
}
