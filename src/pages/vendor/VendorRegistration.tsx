import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { RegistrationStepper } from "@/components/vendor/RegistrationStepper";
import { DocumentCapture } from "@/components/vendor/DocumentCapture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVendorCategories, useCategoryDocuments } from "@/hooks/useVendorData";
import { useVendorProfile, useUpdateVendor, useUploadDocument, useSubmitVendorApplication } from "@/hooks/useVendor";
import { toast } from "sonner";
import { 
  Building2, 
  User, 
  CreditCard, 
  FileText, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "Category" },
  { id: 2, title: "Company" },
  { id: 3, title: "Contact" },
  { id: 4, title: "Bank" },
  { id: 5, title: "Documents" },
];

export default function VendorRegistration() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Set<string>>(new Set());

  const { data: categories, isLoading: categoriesLoading } = useVendorCategories();
  const { data: categoryDocs } = useCategoryDocuments(selectedCategory);
  const { data: vendor, refetch: refetchVendor } = useVendorProfile();
  const updateVendor = useUpdateVendor();
  const uploadDocument = useUploadDocument();
  const submitApplication = useSubmitVendorApplication();

  // Form state
  const [formData, setFormData] = useState({
    company_name: "",
    trade_name: "",
    gst_number: "",
    pan_number: "",
    cin_number: "",
    registered_address: "",
    operational_address: "",
    primary_contact_name: "",
    primary_mobile: "",
    primary_email: "",
    secondary_contact_name: "",
    secondary_mobile: "",
    bank_account_number: "",
    bank_ifsc: "",
    bank_name: "",
    bank_branch: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNext = async () => {
    if (currentStep === 1 && !selectedCategory) {
      toast.error("Please select a category");
      return;
    }

    if (currentStep === 2) {
      if (!formData.company_name.trim()) {
        toast.error("Company name is required");
        return;
      }
    }

    if (currentStep === 3) {
      if (!formData.primary_contact_name.trim() || !formData.primary_mobile.trim() || !formData.primary_email.trim()) {
        toast.error("Primary contact details are required");
        return;
      }
    }

    // Save data if we have a vendor
    if (vendor && currentStep > 1) {
      await updateVendor.mutateAsync({
        vendorId: vendor.id,
        data: formData,
      });
    }

    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleDocumentUpload = async (documentTypeId: string, file: File) => {
    if (!vendor) {
      toast.error("Vendor profile not found");
      return;
    }

    setUploadingDocId(documentTypeId);
    try {
      await uploadDocument.mutateAsync({
        vendorId: vendor.id,
        documentTypeId,
        file,
      });
      setUploadedDocs(prev => new Set(prev).add(documentTypeId));
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleSubmit = async () => {
    if (!vendor) return;

    // Check mandatory documents
    const mandatoryDocs = categoryDocs?.filter(d => d.is_mandatory) || [];
    const missingDocs = mandatoryDocs.filter(d => !uploadedDocs.has(d.document_type_id));

    if (missingDocs.length > 0) {
      toast.error(`Please upload all mandatory documents: ${missingDocs.map(d => d.document_types.name).join(", ")}`);
      return;
    }

    await submitApplication.mutateAsync(vendor.id);
    navigate("/vendor/dashboard");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Select Vendor Category</h2>
            <p className="text-sm text-muted-foreground text-center">
              Choose the category that best describes your business
            </p>
            
            {categoriesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-3">
                {categories?.map((category) => (
                  <Card
                    key={category.id}
                    className={cn(
                      "cursor-pointer transition-all",
                      selectedCategory === category.id
                        ? "border-2 border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    )}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center",
                        selectedCategory === category.id ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{category.name}</p>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                      {selectedCategory === category.id && (
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Company Details</h2>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  placeholder="Enter registered company name"
                  className="h-12"
                />
              </div>

              <div>
                <Label htmlFor="trade_name">Trade Name</Label>
                <Input
                  id="trade_name"
                  name="trade_name"
                  value={formData.trade_name}
                  onChange={handleInputChange}
                  placeholder="Enter trade/brand name if different"
                  className="h-12"
                />
              </div>

              <div>
                <Label htmlFor="gst_number">GST Number</Label>
                <Input
                  id="gst_number"
                  name="gst_number"
                  value={formData.gst_number}
                  onChange={handleInputChange}
                  placeholder="e.g., 22AAAAA0000A1Z5"
                  className="h-12 uppercase"
                  maxLength={15}
                />
              </div>

              <div>
                <Label htmlFor="pan_number">PAN Number</Label>
                <Input
                  id="pan_number"
                  name="pan_number"
                  value={formData.pan_number}
                  onChange={handleInputChange}
                  placeholder="e.g., ABCDE1234F"
                  className="h-12 uppercase"
                  maxLength={10}
                />
              </div>

              <div>
                <Label htmlFor="cin_number">CIN Number</Label>
                <Input
                  id="cin_number"
                  name="cin_number"
                  value={formData.cin_number}
                  onChange={handleInputChange}
                  placeholder="Corporate Identification Number"
                  className="h-12 uppercase"
                />
              </div>

              <div>
                <Label htmlFor="registered_address">Registered Address</Label>
                <Textarea
                  id="registered_address"
                  name="registered_address"
                  value={formData.registered_address}
                  onChange={handleInputChange}
                  placeholder="Enter full registered address"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="operational_address">Operational Address</Label>
                <Textarea
                  id="operational_address"
                  name="operational_address"
                  value={formData.operational_address}
                  onChange={handleInputChange}
                  placeholder="Enter operational address if different"
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Contact Details</h2>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Primary Contact *
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="primary_contact_name">Full Name *</Label>
                  <Input
                    id="primary_contact_name"
                    name="primary_contact_name"
                    value={formData.primary_contact_name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    className="h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="primary_mobile">Mobile Number *</Label>
                  <Input
                    id="primary_mobile"
                    name="primary_mobile"
                    type="tel"
                    value={formData.primary_mobile}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile number"
                    className="h-12"
                    maxLength={10}
                  />
                </div>

                <div>
                  <Label htmlFor="primary_email">Email Address *</Label>
                  <Input
                    id="primary_email"
                    name="primary_email"
                    type="email"
                    value={formData.primary_email}
                    onChange={handleInputChange}
                    placeholder="email@company.com"
                    className="h-12"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Secondary Contact (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="secondary_contact_name">Full Name</Label>
                  <Input
                    id="secondary_contact_name"
                    name="secondary_contact_name"
                    value={formData.secondary_contact_name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    className="h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="secondary_mobile">Mobile Number</Label>
                  <Input
                    id="secondary_mobile"
                    name="secondary_mobile"
                    type="tel"
                    value={formData.secondary_mobile}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile number"
                    className="h-12"
                    maxLength={10}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Banking Details</h2>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Bank Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleInputChange}
                    placeholder="e.g., State Bank of India"
                    className="h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="bank_branch">Branch Name</Label>
                  <Input
                    id="bank_branch"
                    name="bank_branch"
                    value={formData.bank_branch}
                    onChange={handleInputChange}
                    placeholder="e.g., Mumbai Main Branch"
                    className="h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="bank_account_number">Account Number</Label>
                  <Input
                    id="bank_account_number"
                    name="bank_account_number"
                    value={formData.bank_account_number}
                    onChange={handleInputChange}
                    placeholder="Enter bank account number"
                    className="h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="bank_ifsc">IFSC Code</Label>
                  <Input
                    id="bank_ifsc"
                    name="bank_ifsc"
                    value={formData.bank_ifsc}
                    onChange={handleInputChange}
                    placeholder="e.g., SBIN0000123"
                    className="h-12 uppercase"
                    maxLength={11}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Upload Documents</h2>
            <p className="text-sm text-muted-foreground">
              Upload required documents. Supported formats: PDF, JPG, PNG (max 5MB)
            </p>
            
            <div className="space-y-4">
              {categoryDocs?.map((doc) => (
                <Card key={doc.id} className={cn(
                  uploadedDocs.has(doc.document_type_id) && "border-success"
                )}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {doc.document_types.name}
                      {doc.is_mandatory && (
                        <span className="text-destructive text-sm">*</span>
                      )}
                      {uploadedDocs.has(doc.document_type_id) && (
                        <CheckCircle2 className="h-4 w-4 text-success ml-auto" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DocumentCapture
                      onCapture={(file) => handleDocumentUpload(doc.document_type_id, file)}
                      disabled={uploadingDocId === doc.document_type_id}
                    />
                    {uploadingDocId === doc.document_type_id && (
                      <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <MobileLayout title="Registration">
      <div className="flex-1 flex flex-col">
        {/* Stepper */}
        <div className="px-4 py-4 bg-card border-b">
          <RegistrationStepper steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="p-4 bg-card border-t flex gap-3">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack} className="flex-1 h-12">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          
          {currentStep < 5 ? (
            <Button onClick={handleNext} className="flex-1 h-12" disabled={updateVendor.isPending}>
              {updateVendor.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              className="flex-1 h-12 bg-success hover:bg-success/90"
              disabled={submitApplication.isPending}
            >
              {submitApplication.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
