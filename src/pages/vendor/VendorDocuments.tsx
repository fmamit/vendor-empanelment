import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useAuth } from "@/hooks/useAuth";
import { useVendorProfile, useVendorDocuments } from "@/hooks/useVendor";
import { useCategoryDocuments } from "@/hooks/useVendorData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DocumentCard, DocumentCardData } from "@/components/documents/DocumentCard";
import { DocumentViewer } from "@/components/documents/DocumentViewer";
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Loader2,
  FolderOpen
} from "lucide-react";

export default function VendorDocuments() {
  const navigate = useNavigate();
  const { user, userType, loading } = useAuth();
  const { data: vendor, isLoading: vendorLoading } = useVendorProfile();
  const { data: documents, isLoading: docsLoading } = useVendorDocuments(vendor?.id || null);
  const { data: categoryDocs } = useCategoryDocuments(vendor?.category_id || null);
  
  const [selectedDocument, setSelectedDocument] = useState<DocumentCardData | null>(null);

  useEffect(() => {
    if (!loading && (!user || userType !== "vendor")) {
      navigate("/vendor/login");
    }
  }, [user, userType, loading, navigate]);

  if (loading || vendorLoading || docsLoading) {
    return (
      <MobileLayout title="My Documents">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  // Transform documents to DocumentCardData format
  const documentCards: DocumentCardData[] = documents?.map(doc => ({
    id: doc.id,
    document_type_id: doc.document_type_id,
    document_type_name: doc.document_types?.name || "Document",
    file_name: doc.file_name,
    file_url: doc.file_url,
    status: doc.status,
    expiry_date: doc.expiry_date,
    version_number: doc.version_number,
    created_at: doc.created_at,
    review_comments: doc.review_comments,
    ai_analysis_status: 'completed', // Mock status
    tampering_score: Math.floor(Math.random() * 30), // Mock score
  })) || [];

  // Calculate stats
  const uploadedDocIds = new Set(documents?.map(d => d.document_type_id) || []);
  const mandatoryDocs = categoryDocs?.filter(d => d.is_mandatory) || [];
  const uploadedMandatory = mandatoryDocs.filter(d => uploadedDocIds.has(d.document_type_id));
  const approvedDocs = documents?.filter(d => d.status === 'approved').length || 0;
  const rejectedDocs = documents?.filter(d => d.status === 'rejected').length || 0;

  return (
    <MobileLayout title="My Documents">
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="p-4 border-b bg-card">
          <Button variant="ghost" size="sm" onClick={() => navigate("/vendor/dashboard")} className="mb-2 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-xl font-semibold">Document Repository</h1>
          <p className="text-sm text-muted-foreground">Manage your uploaded documents</p>
        </div>

        {/* Stats */}
        <div className="p-4 grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <FileText className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{documents?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-1" />
              <p className="text-lg font-bold">{approvedDocs}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <AlertCircle className={`h-5 w-5 mx-auto mb-1 ${rejectedDocs > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
              <p className="text-lg font-bold">{rejectedDocs}</p>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Mandatory Progress */}
        <div className="px-4 pb-4">
          <Card className={mandatoryDocs.length === uploadedMandatory.length ? "border-success/30" : "border-warning/30"}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Mandatory Documents</span>
                <Badge variant={mandatoryDocs.length === uploadedMandatory.length ? "default" : "secondary"}>
                  {uploadedMandatory.length}/{mandatoryDocs.length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        <div className="px-4 pb-4 space-y-3">
          {documentCards.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">No documents uploaded</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Start by uploading your required documents
                </p>
                <Button onClick={() => navigate("/vendor/register")}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documents
                </Button>
              </CardContent>
            </Card>
          ) : (
            documentCards.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onView={() => setSelectedDocument(doc)}
                onReupload={() => navigate("/vendor/register")}
                showReupload={vendor?.current_status === 'draft'}
                showAIBadge
              />
            ))
          )}
        </div>
      </div>

      {/* Document Viewer */}
      <DocumentViewer
        document={selectedDocument}
        open={!!selectedDocument}
        onOpenChange={(open) => !open && setSelectedDocument(null)}
      />
    </MobileLayout>
  );
}
