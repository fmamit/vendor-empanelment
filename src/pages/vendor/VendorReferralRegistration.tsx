import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ReferralHeader } from "@/components/referral/ReferralHeader";
import { ReferralStepper } from "@/components/referral/ReferralStepper";
import { CompanyDetailsStep } from "@/components/referral/CompanyDetailsStep";
import { ContactDetailsStep } from "@/components/referral/ContactDetailsStep";
import { BankDetailsStep } from "@/components/referral/BankDetailsStep";
import { DocumentUploadStep } from "@/components/referral/DocumentUploadStep";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "vendor_referral_form_state";

interface InvitationData {
  id: string;
  token: string;
  company_name: string;
  contact_email: string;
  contact_phone: string;
  category_id: string;
  category_name: string;
  expires_at: string;
}

type PageState = "loading" | "invalid" | "form" | "submitting" | "success";

export default function VendorReferralRegistration() {
  const { token } = useParams<{ token: string }>();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<Set<string>>(new Set());
  const [categoryDocs, setCategoryDocs] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    company_name: "",
    trade_name: "",
    gst_number: "",
    pan_number: "",
    primary_contact_name: "",
    primary_mobile: "",
    primary_email: "",
    bank_name: "",
    bank_branch: "",
    bank_account_number: "",
    bank_ifsc: "",
  });

  // Sign out any existing session to prevent RLS bleed
  useEffect(() => {
    supabase.auth.signOut();
  }, []);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setErrorMessage("No registration token provided.");
      setPageState("invalid");
      return;
    }
    validateToken(token);
  }, [token]);

  const validateToken = async (t: string) => {
    try {
      const { data, error } = await supabase
        .from("vendor_invitations")
        .select("*, vendor_categories(name)")
        .eq("token", t)
        .is("used_at", null)
        .single();

      if (error || !data) {
        setErrorMessage("This registration link is invalid or has already been used.");
        setPageState("invalid");
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setErrorMessage("This registration link has expired. Please request a new one from your contact.");
        setPageState("invalid");
        return;
      }

      const inv: InvitationData = {
        id: data.id,
        token: data.token,
        company_name: data.company_name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        category_id: data.category_id,
        category_name: (data as any).vendor_categories?.name || "Unknown",
        expires_at: data.expires_at,
      };

      setInvitation(inv);

      // Restore from localStorage or pre-fill from invitation
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed._token === t) {
            setFormData(parsed.formData);
            setCurrentStep(parsed.currentStep || 1);
            setPhoneVerified(parsed.phoneVerified || false);
            setUploadedDocs(new Set(parsed.uploadedDocs || []));
            setPageState("form");
            loadCategoryDocs(data.category_id);
            return;
          }
        } catch {}
      }

      // Pre-fill from invitation
      setFormData((prev) => ({
        ...prev,
        company_name: data.company_name || "",
        primary_email: data.contact_email || "",
        primary_mobile: data.contact_phone?.replace("+91", "") || "",
      }));

      setPageState("form");
      loadCategoryDocs(data.category_id);
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setPageState("invalid");
    }
  };

  const loadCategoryDocs = async (categoryId: string) => {
    const { data } = await supabase
      .from("category_documents")
      .select("*, document_types(*)")
      .eq("category_id", categoryId)
      .order("display_order");
    setCategoryDocs(data || []);
  };

  // Persist state to localStorage
  useEffect(() => {
    if (pageState !== "form" || !token) return;
    const payload = {
      _token: token,
      formData,
      currentStep,
      phoneVerified,
      uploadedDocs: Array.from(uploadedDocs),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [formData, currentStep, phoneVerified, uploadedDocs, pageState, token]);

  const handleFieldChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.company_name.trim().length > 0;
      case 2:
        return (
          formData.primary_contact_name.trim().length > 0 &&
          formData.primary_mobile.replace(/\D/g, "").length === 10 &&
          phoneVerified &&
          formData.primary_email.trim().length > 0
        );
      case 3:
        return (
          formData.bank_name.trim().length > 0 &&
          formData.bank_branch.trim().length > 0 &&
          formData.bank_account_number.trim().length > 0 &&
          formData.bank_ifsc.trim().length > 0
        );
      case 4: {
        const mandatory = categoryDocs.filter((d) => d.is_mandatory);
        return mandatory.every((d) => uploadedDocs.has(d.document_type_id));
      }
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!invitation || !token) return;
    setPageState("submitting");
    try {
      const { data, error } = await supabase.functions.invoke("submit-vendor-referral", {
        body: {
          token,
          formData: {
            ...formData,
            category_id: invitation.category_id,
            primary_mobile: `+91${formData.primary_mobile.replace(/\D/g, "")}`,
          },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      localStorage.removeItem(STORAGE_KEY);
      setPageState("success");
    } catch (err: any) {
      toast.error(err.message || "Submission failed. Please try again.");
      setPageState("form");
    }
  };

  // --- RENDER ---

  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ReferralHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (pageState === "invalid") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ReferralHeader />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-warning mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Link Unavailable</h2>
          <p className="text-muted-foreground max-w-sm">{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (pageState === "submitting") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ReferralHeader />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Submitting your registration...</p>
        </div>
      </div>
    );
  }

  if (pageState === "success") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ReferralHeader />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-accent" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Registration Submitted!</h2>
          <p className="text-muted-foreground max-w-sm">
            Your vendor registration has been received. Our team will review your application and get in touch shortly.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
            <ShieldCheck className="h-4 w-4" />
            <span>256-bit Encrypted</span>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ReferralHeader />
      <ReferralStepper currentStep={currentStep} />

      <div className="flex-1 overflow-y-auto pb-24">
        {currentStep === 1 && (
          <CompanyDetailsStep
            formData={formData}
            categoryName={invitation?.category_name || ""}
            onChange={handleFieldChange}
          />
        )}
        {currentStep === 2 && (
          <ContactDetailsStep
            formData={formData}
            phoneVerified={phoneVerified}
            onChange={handleFieldChange}
            onPhoneVerified={() => setPhoneVerified(true)}
          />
        )}
        {currentStep === 3 && (
          <BankDetailsStep formData={formData} onChange={handleFieldChange} />
        )}
        {currentStep === 4 && (
          <DocumentUploadStep
            categoryDocs={categoryDocs}
            token={token || ""}
            uploadedDocs={uploadedDocs}
            onDocUploaded={(id) => setUploadedDocs((prev) => new Set(prev).add(id))}
          />
        )}
      </div>

      {/* Fixed bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 flex gap-3 safe-area-inset">
        {currentStep > 1 && (
          <Button variant="outline" className="h-12 flex-1" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}
        {currentStep < 4 ? (
          <Button className="h-12 flex-1" onClick={handleNext} disabled={!canProceed()}>
            Next
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button className="h-12 flex-1" onClick={handleSubmit} disabled={!canProceed()}>
            Submit Registration
          </Button>
        )}
      </div>
    </div>
  );
}
