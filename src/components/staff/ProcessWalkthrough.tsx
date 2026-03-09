import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Building2,
  Phone,
  Landmark,
  FileText,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Users,
  ClipboardCheck,
  Lock,
  ScanSearch,
  CreditCard,
  Fingerprint,
  Receipt,
  Wallet,
  Bot,
  Upload,
  Eye,
} from "lucide-react";

export function ProcessWalkthrough() {
  return (
    <div className="h-full flex flex-col bg-card border-l">
      {/* Header */}
      <div className="px-5 py-4 border-b bg-primary/5">
        <h2 className="text-lg font-semibold text-primary">Process Walkthrough</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          End-to-end vendor onboarding guide
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
        <div className="px-3 pt-3 border-b">
          <TabsList className="w-full h-auto flex-wrap gap-1 bg-transparent p-0 justify-start">
            <TabsTrigger value="overview" className="text-xs px-2.5 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Overview</TabsTrigger>
            <TabsTrigger value="registration" className="text-xs px-2.5 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Registration</TabsTrigger>
            <TabsTrigger value="verification" className="text-xs px-2.5 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Verifications</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs px-2.5 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Documents</TabsTrigger>
            <TabsTrigger value="workflow" className="text-xs px-2.5 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Workflow</TabsTrigger>
            <TabsTrigger value="security" className="text-xs px-2.5 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Security</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            {/* ─── OVERVIEW ─── */}
            <TabsContent value="overview" className="mt-0">
              <OverviewTab />
            </TabsContent>

            {/* ─── REGISTRATION ─── */}
            <TabsContent value="registration" className="mt-0">
              <RegistrationTab />
            </TabsContent>

            {/* ─── VERIFICATION ─── */}
            <TabsContent value="verification" className="mt-0">
              <VerificationTab />
            </TabsContent>

            {/* ─── DOCUMENTS ─── */}
            <TabsContent value="documents" className="mt-0">
              <DocumentsTab />
            </TabsContent>

            {/* ─── WORKFLOW ─── */}
            <TabsContent value="workflow" className="mt-0">
              <WorkflowTab />
            </TabsContent>

            {/* ─── SECURITY ─── */}
            <TabsContent value="security" className="mt-0">
              <SecurityTab />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   OVERVIEW TAB
   ════════════════════════════════════════════════════ */
function OverviewTab() {
  return (
    <div className="space-y-4">
      {/* 3-step summary */}
      <div className="grid gap-3">
        <StepCard
          icon={<Building2 className="h-4 w-4" />}
          color="blue"
          step="1"
          title="Register"
          description="Vendor fills multi-step form via staff referral link. Phone & email verified with OTP."
        />
        <StepCard
          icon={<ShieldCheck className="h-4 w-4" />}
          color="amber"
          step="2"
          title="Verify"
          description="Six real-time API checks (PAN, GST, Bank, UPI, Aadhaar, Experian) plus AI document analysis."
        />
        <StepCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          color="green"
          step="3"
          title="Approve"
          description="Maker > Checker > Approver workflow with full audit trail and send-back capability."
        />
      </div>

      {/* Status lifecycle */}
      <div className="rounded-lg border p-3 bg-muted/30">
        <h4 className="text-sm font-semibold mb-3">Vendor Status Lifecycle</h4>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <StatusBadge color="bg-slate-100 text-slate-600 border-slate-300">Draft</StatusBadge>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <StatusBadge color="bg-amber-50 text-amber-700 border-amber-300">Pending Review</StatusBadge>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <StatusBadge color="bg-blue-50 text-blue-700 border-blue-300">In Verification</StatusBadge>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <StatusBadge color="bg-purple-50 text-purple-700 border-purple-300">Pending Approval</StatusBadge>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <StatusBadge color="bg-green-50 text-green-700 border-green-300">Approved</StatusBadge>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs mt-2">
          <StatusBadge color="bg-orange-50 text-orange-700 border-orange-300">Sent Back</StatusBadge>
          <span className="text-muted-foreground text-[10px]">at any stage</span>
          <span className="mx-2" />
          <StatusBadge color="bg-red-50 text-red-700 border-red-300">Deactivated</StatusBadge>
          <span className="text-muted-foreground text-[10px]">admin action</span>
        </div>
      </div>

      {/* Tech stack */}
      <div className="rounded-lg border p-3">
        <h4 className="text-sm font-semibold mb-2">Technology Stack</h4>
        <div className="space-y-2">
          <TagGroup label="Frontend" tags={["React 18", "TypeScript", "Tailwind", "Shadcn/ui"]} />
          <TagGroup label="Backend" tags={["Supabase", "Deno Edge Functions", "PostgreSQL", "RLS"]} />
          <TagGroup label="APIs" tags={["VerifiedU (KYC)", "Exotel (WhatsApp)", "Resend (Email)", "Gemini 2.5 Pro"]} />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   REGISTRATION TAB
   ════════════════════════════════════════════════════ */
function RegistrationTab() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Five-step form accessed via staff referral link: <code className="bg-muted px-1 rounded text-[11px]">/register/ref/:token</code>
      </p>

      <Accordion type="single" collapsible className="w-full">
        {/* Step 1: Consent */}
        <AccordionItem value="consent">
          <AccordionTrigger className="text-sm py-3">
            <span className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-bold">1</span>
              DPDP Consent
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
              <li>Explicit consent checkbox with full privacy policy</li>
              <li>Stores consent version, purpose, IP address, user agent</li>
              <li>Consent can be withdrawn later (status changes to <strong>consent_withdrawn</strong>)</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* Step 2: Company */}
        <AccordionItem value="company">
          <AccordionTrigger className="text-sm py-3">
            <span className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">2</span>
              Company Details
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-1.5 text-xs">
              <FieldRow field="Company Name" required />
              <FieldRow field="Trade Name" />
              <FieldRow field="Constitution Type" required note="Dropdown" />
              <FieldRow field="Vendor Category" required note="From referral link" />
              <FieldRow field="GST Number" note="15-char GSTIN format" />
              <FieldRow field="PAN Number" note="10-char format" />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Step 3: Contact */}
        <AccordionItem value="contact">
          <AccordionTrigger className="text-sm py-3">
            <span className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center font-bold">3</span>
              Contact & OTP
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border p-2 bg-green-50/50">
                  <div className="font-medium text-green-800 mb-1 flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Phone OTP
                  </div>
                  <ul className="text-muted-foreground space-y-0.5 list-disc pl-3 text-[11px]">
                    <li>WhatsApp via Exotel</li>
                    <li>6-digit, 5min expiry</li>
                    <li>Max 3 attempts</li>
                    <li>60s cooldown</li>
                  </ul>
                </div>
                <div className="rounded border p-2 bg-blue-50/50">
                  <div className="font-medium text-blue-800 mb-1 flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Email OTP
                  </div>
                  <ul className="text-muted-foreground space-y-0.5 list-disc pl-3 text-[11px]">
                    <li>Via Resend</li>
                    <li>Branded template</li>
                    <li>Same 6-digit, 5min</li>
                    <li>Max 3 attempts</li>
                  </ul>
                </div>
              </div>
              <div className="rounded bg-blue-50 border border-blue-200 p-2 text-[11px] text-blue-800">
                <strong>Test mode:</strong> Phone +919999999999 accepts code 123456
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Step 4: Bank */}
        <AccordionItem value="bank">
          <AccordionTrigger className="text-sm py-3">
            <span className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-amber-100 text-amber-700 text-xs flex items-center justify-center font-bold">4</span>
              Bank Details
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-1.5 text-xs">
              <FieldRow field="Bank Name" required />
              <FieldRow field="Branch Name" required />
              <FieldRow field="Account Number" required note="Numeric" />
              <FieldRow field="IFSC Code" required note="11 chars, auto-corrects O>0 at pos 5" />
            </div>
            <div className="rounded bg-amber-50 border border-amber-200 p-2 text-[11px] text-amber-800 mt-2">
              All PII fields encrypted at rest with pgp_sym_encrypt.
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Step 5: Documents */}
        <AccordionItem value="documents">
          <AccordionTrigger className="text-sm py-3">
            <span className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-teal-100 text-teal-700 text-xs flex items-center justify-center font-bold">5</span>
              Document Upload
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
              <li>Formats: PDF, JPG, PNG (max 10 MB)</li>
              <li>Stored in Supabase Storage with RLS</li>
              <li>Each upload triggers AI analysis automatically</li>
              <li>Mandatory docs marked with *</li>
            </ul>
            <div className="flex flex-wrap gap-1 mt-2">
              {["GST Certificate", "PAN Card", "Cancelled Cheque", "Address Proof", "CIN Certificate"].map(doc => (
                <span key={doc} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{doc}</span>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="rounded bg-green-50 border border-green-200 p-2.5 text-xs text-green-800">
        On submission, vendor gets status <strong>pending_review</strong> and a Vendor ID (<code className="bg-green-100 px-1 rounded">CI-YYYY-####</code>).
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   VERIFICATION TAB
   ════════════════════════════════════════════════════ */
function VerificationTab() {
  return (
    <div className="space-y-4">
      <div className="rounded bg-blue-50 border border-blue-200 p-2.5 text-xs text-blue-800">
        All checks powered by <strong>VerifiedU</strong> (resources.earlywages.in). Includes retry with exponential backoff.
      </div>

      <Accordion type="single" collapsible className="w-full">
        <VerificationItem
          value="pan"
          icon={<CreditCard className="h-3.5 w-3.5" />}
          title="PAN Verification"
          status="working"
          fn="verify-pan"
          endpoint="VerifyPAN"
          input="pan_number, vendor_id"
          returns={["Registered name", "Date of birth", "is_valid status"]}
        />
        <VerificationItem
          value="gst"
          icon={<Receipt className="h-3.5 w-3.5" />}
          title="GST Verification"
          status="working"
          fn="verify-gst"
          endpoint="VerifyGstin"
          input="gstin, vendor_id"
          returns={["Business name / legal name", "Trade name", "Registration date & status", "is_valid"]}
        />
        <VerificationItem
          value="bank"
          icon={<Landmark className="h-3.5 w-3.5" />}
          title="Bank Account"
          status="working"
          fn="verify-bank-account"
          endpoint="VerifyBankAccountNumber"
          input="account_number, ifsc_code, vendor_id"
          returns={["Account holder name", "Bank name & branch", "is_valid"]}
        />
        <VerificationItem
          value="upi"
          icon={<Wallet className="h-3.5 w-3.5" />}
          title="UPI VPA"
          status="working"
          fn="verify-upi"
          endpoint="VerifyVPA"
          input="vpa, vendor_id"
          returns={["VPA address", "Account holder name", "is_valid"]}
        />
        <VerificationItem
          value="aadhaar"
          icon={<Fingerprint className="h-3.5 w-3.5" />}
          title="Aadhaar (DigiLocker)"
          status="multi-step"
          fn="verify-aadhaar + get-aadhaar-details"
          endpoint="VerifyAadhaarViaDigilocker + GetAadhaarDetailsById"
          input="vendor_id, surl, furl (step 1) / unique_request_number (step 2)"
          returns={["Name, DOB, gender", "Address, photo", "Redirect-based flow"]}
        />
        <VerificationItem
          value="experian"
          icon={<ScanSearch className="h-3.5 w-3.5" />}
          title="Experian Credit Report"
          status="inactive"
          fn="credit-report-experian"
          endpoint="GetIndivisualCreditReport"
          input="name, mobile, pan_number, rs_type"
          returns={["Full credit report data", "Credit score and history"]}
        />
      </Accordion>

      {/* Summary table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Type</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <SummaryRow type="PAN" status="working" />
            <SummaryRow type="GST" status="working" />
            <SummaryRow type="Bank Account" status="working" />
            <SummaryRow type="UPI" status="working" />
            <SummaryRow type="Aadhaar" status="multi-step" />
            <SummaryRow type="Experian" status="inactive" />
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   DOCUMENTS TAB
   ════════════════════════════════════════════════════ */
function DocumentsTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Upload className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-xs font-semibold">Upload Pipeline</span>
          </div>
          <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc pl-3">
            <li>PDF, JPG, PNG (max 10 MB)</li>
            <li>Supabase Storage with RLS</li>
            <li>Versioning tracked</li>
            <li>Expiry dates flagged</li>
          </ul>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Bot className="h-3.5 w-3.5 text-purple-600" />
            <span className="text-xs font-semibold">AI Analysis</span>
          </div>
          <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc pl-3">
            <li>Google Gemini 2.5 Pro</li>
            <li>Auto-triggered on upload</li>
            <li>Vision + tool calling</li>
            <li>Runs async</li>
          </ul>
        </div>
      </div>

      {/* What AI extracts */}
      <div className="rounded-lg border p-3">
        <h4 className="text-xs font-semibold mb-2">AI Extraction Details</h4>
        <div className="space-y-2 text-[11px]">
          <div>
            <span className="font-medium text-foreground">Field Extraction:</span>
            <span className="text-muted-foreground"> Field name, value, and confidence score per field</span>
          </div>
          <div>
            <span className="font-medium text-foreground">Classification:</span>
            <span className="text-muted-foreground"> Auto-detected document type with confidence %</span>
          </div>
          <div>
            <span className="font-medium text-foreground">Tamper Detection:</span>
            <span className="text-muted-foreground"> Tampering indicators list and score (0-1)</span>
          </div>
        </div>
      </div>

      <div className="rounded bg-amber-50 border border-amber-200 p-2 text-[11px] text-amber-800">
        <strong>PII Masking:</strong> PAN: AB***34F, Account: ****1234, Mobile: ****5678
      </div>

      {/* Document status flow */}
      <div className="rounded-lg border p-3">
        <h4 className="text-xs font-semibold mb-2">Document Status Flow</h4>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <StatusBadge color="bg-slate-100 text-slate-600 border-slate-300">Uploaded</StatusBadge>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <StatusBadge color="bg-blue-50 text-blue-700 border-blue-300">Under Review</StatusBadge>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <StatusBadge color="bg-green-50 text-green-700 border-green-300">Approved</StatusBadge>
        </div>
        <div className="flex items-center gap-1.5 text-xs mt-1.5">
          <StatusBadge color="bg-red-50 text-red-700 border-red-300">Rejected</StatusBadge>
          <StatusBadge color="bg-orange-50 text-orange-700 border-orange-300">Expired</StatusBadge>
        </div>
      </div>

      {/* DB tables */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Table</th>
              <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Purpose</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr><td className="px-2 py-1.5 font-mono">vendor_documents</td><td className="px-2 py-1.5 text-muted-foreground">Metadata & review status</td></tr>
            <tr><td className="px-2 py-1.5 font-mono">document_analyses</td><td className="px-2 py-1.5 text-muted-foreground">AI extraction results</td></tr>
            <tr><td className="px-2 py-1.5 font-mono">document_types</td><td className="px-2 py-1.5 text-muted-foreground">Master document list</td></tr>
            <tr><td className="px-2 py-1.5 font-mono">category_documents</td><td className="px-2 py-1.5 text-muted-foreground">Required docs per category</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   WORKFLOW TAB
   ════════════════════════════════════════════════════ */
function WorkflowTab() {
  return (
    <div className="space-y-4">
      {/* Roles */}
      <div className="space-y-2">
        <RoleCard
          title="Maker"
          color="border-blue-400"
          description="Reviews initial submissions. Triggers API verifications. Can send back for corrections."
          tags={["View queue", "Run verifications", "Review docs", "Send back"]}
        />
        <RoleCard
          title="Checker"
          color="border-purple-400"
          description="Second-level review. Cross-checks verification results and AI analysis."
          tags={["Cross-verify", "Review AI analysis", "Approve / send back"]}
        />
        <RoleCard
          title="Approver"
          color="border-green-400"
          description="Final sign-off. Reviews complete verification package and grants approval."
          tags={["Final review", "Approve vendor", "Reject with reason"]}
        />
      </div>

      {/* Features */}
      <div className="rounded-lg border p-3">
        <h4 className="text-xs font-semibold mb-2">Staff Features</h4>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="font-medium">Referrals:</span>
            <span className="text-muted-foreground"> Unique code per staff, shareable link</span>
          </div>
          <div>
            <span className="font-medium">Invitations:</span>
            <span className="text-muted-foreground"> Email with token, 7-day expiry</span>
          </div>
          <div>
            <span className="font-medium">Verifications:</span>
            <span className="text-muted-foreground"> One-click trigger, live status</span>
          </div>
          <div>
            <span className="font-medium">Audit trail:</span>
            <span className="text-muted-foreground"> Full workflow history, time-in-stage</span>
          </div>
        </div>
      </div>

      {/* Staff pages */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Page</th>
              <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Route</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr><td className="px-2 py-1.5">Dashboard</td><td className="px-2 py-1.5 font-mono text-muted-foreground">/staff/dashboard</td></tr>
            <tr><td className="px-2 py-1.5">Review Queue</td><td className="px-2 py-1.5 font-mono text-muted-foreground">/staff/queue</td></tr>
            <tr><td className="px-2 py-1.5">Vendor Detail</td><td className="px-2 py-1.5 font-mono text-muted-foreground">/staff/vendor/:id</td></tr>
            <tr><td className="px-2 py-1.5">Invite Vendor</td><td className="px-2 py-1.5 font-mono text-muted-foreground">/staff/invite-vendor</td></tr>
            <tr><td className="px-2 py-1.5">Fraud Alerts</td><td className="px-2 py-1.5 font-mono text-muted-foreground">/staff/fraud-alerts</td></tr>
            <tr><td className="px-2 py-1.5">Approved Vendors</td><td className="px-2 py-1.5 font-mono text-muted-foreground">/staff/approved-vendors</td></tr>
            <tr><td className="px-2 py-1.5">Reports</td><td className="px-2 py-1.5 font-mono text-muted-foreground">/staff/reports</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   SECURITY TAB
   ════════════════════════════════════════════════════ */
function SecurityTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border p-3 border-l-4 border-l-red-400">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Lock className="h-3.5 w-3.5 text-red-600" />
            <span className="text-xs font-semibold">PII Encryption</span>
          </div>
          <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc pl-3">
            <li>pgp_sym_encrypt on all sensitive fields</li>
            <li>Key in Supabase Vault</li>
            <li>Auto-encrypt triggers</li>
            <li>Decrypted views for authorized access</li>
          </ul>
        </div>
        <div className="rounded-lg border p-3 border-l-4 border-l-purple-400">
          <div className="flex items-center gap-1.5 mb-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
            <span className="text-xs font-semibold">Row-Level Security</span>
          </div>
          <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc pl-3">
            <li>RLS on all tables</li>
            <li>Role-based policies</li>
            <li>Storage bucket isolation</li>
            <li>Public: categories, doc types only</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border p-3 border-l-4 border-l-amber-400">
          <div className="flex items-center gap-1.5 mb-1.5">
            <ClipboardCheck className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-xs font-semibold">DPDP Compliance</span>
          </div>
          <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc pl-3">
            <li>Consent tracking</li>
            <li>Data export requests</li>
            <li>Breach notifications</li>
            <li>Admin audit page</li>
          </ul>
        </div>
        <div className="rounded-lg border p-3 border-l-4 border-l-green-400">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Eye className="h-3.5 w-3.5 text-green-600" />
            <span className="text-xs font-semibold">Audit Logging</span>
          </div>
          <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc pl-3">
            <li>PII access log</li>
            <li>Workflow history</li>
            <li>WhatsApp message log</li>
            <li>Consent records</li>
          </ul>
        </div>
      </div>

      {/* Permissions table */}
      <div className="rounded-lg border overflow-hidden">
        <h4 className="text-xs font-semibold px-3 py-2 bg-muted/50">Role Permissions</h4>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-muted/30">
              <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Role</th>
              <th className="text-center px-1 py-1.5 font-medium text-muted-foreground">View</th>
              <th className="text-center px-1 py-1.5 font-medium text-muted-foreground">Verify</th>
              <th className="text-center px-1 py-1.5 font-medium text-muted-foreground">Approve</th>
              <th className="text-center px-1 py-1.5 font-medium text-muted-foreground">Admin</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <PermRow role="Maker" view check={false} approve={false} admin={false} />
            <PermRow role="Checker" view check approve={false} admin={false} />
            <PermRow role="Approver" view check approve admin={false} />
            <PermRow role="Admin" view check approve admin />
          </tbody>
        </table>
      </div>

      <div className="rounded bg-blue-50 border border-blue-200 p-2 text-[11px] text-blue-800">
        <strong>Encrypted fields:</strong> PAN, GST, phone, email, bank account, IFSC, nominee contact, CIN
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   REUSABLE SUB-COMPONENTS
   ════════════════════════════════════════════════════ */

function StepCard({ icon, color, step, title, description }: {
  icon: React.ReactNode; color: string; step: string; title: string; description: string;
}) {
  const bgMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    green: "bg-green-100 text-green-700",
  };
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${bgMap[color]}`}>
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function StatusBadge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${color}`}>
      {children}
    </span>
  );
}

function TagGroup({ label, tags }: { label: string; tags: string[] }) {
  return (
    <div>
      <span className="text-xs font-medium text-foreground">{label}: </span>
      <span className="inline-flex flex-wrap gap-1 mt-0.5">
        {tags.map(t => (
          <span key={t} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{t}</span>
        ))}
      </span>
    </div>
  );
}

function FieldRow({ field, required, note }: { field: string; required?: boolean; note?: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-dashed last:border-0">
      <span className="text-foreground">{field}</span>
      <span className="flex items-center gap-1.5">
        {note && <span className="text-muted-foreground text-[10px]">{note}</span>}
        {required ? (
          <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4">Required</Badge>
        ) : (
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">Optional</Badge>
        )}
      </span>
    </div>
  );
}

function VerificationItem({ value, icon, title, status, fn, endpoint, input, returns }: {
  value: string; icon: React.ReactNode; title: string;
  status: "working" | "inactive" | "multi-step";
  fn: string; endpoint: string; input: string; returns: string[];
}) {
  const statusConfig = {
    working: { label: "Working", variant: "default" as const, className: "bg-green-600 text-white border-green-600" },
    inactive: { label: "Inactive", variant: "destructive" as const, className: "" },
    "multi-step": { label: "Multi-step", variant: "secondary" as const, className: "bg-blue-100 text-blue-700 border-blue-200" },
  };
  const sc = statusConfig[status];

  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="text-sm py-3">
        <span className="flex items-center gap-2 flex-1">
          {icon}
          <span>{title}</span>
          <Badge variant={sc.variant} className={`text-[9px] px-1.5 py-0 h-4 ml-auto mr-2 ${sc.className}`}>
            {sc.label}
          </Badge>
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-1.5 text-[11px]">
          <div><span className="font-medium">Function:</span> <code className="bg-muted px-1 rounded">{fn}</code></div>
          <div><span className="font-medium">Endpoint:</span> <code className="bg-muted px-1 rounded">{endpoint}</code></div>
          <div><span className="font-medium">Input:</span> <span className="text-muted-foreground">{input}</span></div>
          <div>
            <span className="font-medium">Returns:</span>
            <ul className="list-disc pl-4 text-muted-foreground mt-0.5">
              {returns.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function SummaryRow({ type, status }: { type: string; status: "working" | "inactive" | "multi-step" }) {
  return (
    <tr>
      <td className="px-3 py-1.5">{type}</td>
      <td className="px-3 py-1.5">
        {status === "working" && <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-3 w-3" /> Working</span>}
        {status === "inactive" && <span className="flex items-center gap-1 text-red-600"><XCircle className="h-3 w-3" /> Inactive</span>}
        {status === "multi-step" && <span className="flex items-center gap-1 text-blue-600"><AlertCircle className="h-3 w-3" /> Multi-step</span>}
      </td>
    </tr>
  );
}

function RoleCard({ title, color, description, tags }: {
  title: string; color: string; description: string; tags: string[];
}) {
  return (
    <div className={`rounded-lg border p-3 border-t-4 ${color}`}>
      <h4 className="text-xs font-semibold mb-1">{title}</h4>
      <p className="text-[11px] text-muted-foreground mb-1.5">{description}</p>
      <div className="flex flex-wrap gap-1">
        {tags.map(t => (
          <span key={t} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{t}</span>
        ))}
      </div>
    </div>
  );
}

function PermRow({ role, view, check, approve, admin }: {
  role: string; view: boolean; check: boolean; approve: boolean; admin: boolean;
}) {
  const Yes = () => <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mx-auto" />;
  const No = () => <XCircle className="h-3.5 w-3.5 text-red-400 mx-auto" />;
  return (
    <tr>
      <td className="px-2 py-1.5 font-medium">{role}</td>
      <td className="text-center px-1 py-1.5">{view ? <Yes /> : <No />}</td>
      <td className="text-center px-1 py-1.5">{check ? <Yes /> : <No />}</td>
      <td className="text-center px-1 py-1.5">{approve ? <Yes /> : <No />}</td>
      <td className="text-center px-1 py-1.5">{admin ? <Yes /> : <No />}</td>
    </tr>
  );
}
