import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentCapture } from "@/components/vendor/DocumentCapture";
import { FileText, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CategoryDoc {
  id: string;
  document_type_id: string;
  is_mandatory: boolean;
  document_types: {
    id: string;
    name: string;
    description: string | null;
    accepted_formats: string[] | null;
    max_file_size_mb: number | null;
  };
}

interface DocumentUploadStepProps {
  categoryDocs: CategoryDoc[];
  token: string;
  uploadedDocs: Set<string>;
  onDocUploaded: (documentTypeId: string) => void;
}

export function DocumentUploadStep({ categoryDocs, token, uploadedDocs, onDocUploaded }: DocumentUploadStepProps) {
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

  const handleUpload = async (documentTypeId: string, file: File) => {
    setUploadingDocId(documentTypeId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("token", token);
      formData.append("document_type_id", documentTypeId);

      const { data, error } = await supabase.functions.invoke("upload-referral-document", {
        body: formData,
      });

      if (error) throw error;
      onDocUploaded(documentTypeId);
      toast.success("Document uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploadingDocId(null);
    }
  };

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Upload Documents</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Upload required documents. Supported: PDF, JPG, PNG (max 5MB)
      </p>

      <div className="space-y-4">
        {categoryDocs.map((doc) => (
          <Card
            key={doc.id}
            className={cn(
              "transition-colors",
              uploadedDocs.has(doc.document_type_id) && "border-accent"
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {doc.document_types.name}
                {doc.is_mandatory && <span className="text-destructive text-sm">*</span>}
                {uploadedDocs.has(doc.document_type_id) && (
                  <CheckCircle2 className="h-4 w-4 text-accent ml-auto" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentCapture
                onCapture={(file) => handleUpload(doc.document_type_id, file)}
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
