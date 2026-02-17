import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  ExternalLink, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Sparkles
} from "lucide-react";
import { AIAnalysisPanel } from "./AIAnalysisPanel";
import { ExpiryBadge } from "./ExpiryBadge";
import { DocumentCardData } from "./DocumentCard";
import { useDocumentAnalysis, useTriggerAnalysis } from "@/hooks/useDocumentAnalysis";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface DocumentViewerProps {
  document: DocumentCardData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showApprovalActions?: boolean;
  onApprove?: (docId: string) => void;
  onReject?: (docId: string, reason: string) => void;
}

const STATUS_CONFIG = {
  uploaded: { label: "Uploaded", className: "bg-muted text-muted-foreground", icon: FileText },
  under_review: { label: "Under Review", className: "bg-warning/20 text-warning", icon: Clock },
  approved: { label: "Approved", className: "bg-success/20 text-success", icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "bg-destructive/20 text-destructive", icon: XCircle },
  expired: { label: "Expired", className: "bg-destructive/20 text-destructive", icon: XCircle },
};

export function DocumentViewer({
  document,
  open,
  onOpenChange,
  showApprovalActions = false,
  onApprove,
  onReject,
}: DocumentViewerProps) {
  const [activeTab, setActiveTab] = useState<string>("preview");
  const { analysis, isLoading: analysisLoading } = useDocumentAnalysis(document?.id || null);
  const triggerAnalysis = useTriggerAnalysis();

  if (!document) return null;

  const statusConfig = STATUS_CONFIG[document.status];
  const StatusIcon = statusConfig.icon;

  const isPdf = document.file_name.toLowerCase().endsWith('.pdf');
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(document.file_name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <DialogTitle className="text-base">{document.document_type_name}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-1 truncate">{document.file_name}</p>
            </div>
            <Badge variant="outline" className={cn("shrink-0", statusConfig.className)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2 shrink-0">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              AI Analysis
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="preview" className="m-0 h-full">
              <div className="space-y-4">
                {/* Document Preview */}
                <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {isImage ? (
                    <img 
                      src={document.file_url} 
                      alt={document.file_name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : isPdf ? (
                    <div className="text-center p-6">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-3">PDF Document</p>
                      <Button variant="outline" size="sm" asChild>
                        <a href={document.file_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1.5" />
                          Open in New Tab
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center p-6">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Preview not available</p>
                    </div>
                  )}
                </div>

                {/* Document Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Version</span>
                    <span className="font-medium">v{document.version_number}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Uploaded</span>
                    <span className="font-medium">
                      {format(new Date(document.created_at), "PPp")}
                    </span>
                  </div>

                  {document.expiry_date && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Expiry</span>
                      <ExpiryBadge expiryDate={document.expiry_date} showDate />
                    </div>
                  )}
                </div>

                {/* Rejection Reason */}
                {document.status === 'rejected' && document.review_comments && (
                  <div className="p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                    <p className="text-xs font-medium text-destructive mb-1">Rejection Reason</p>
                    <p className="text-sm text-muted-foreground">{document.review_comments}</p>
                  </div>
                )}

                <Separator />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={document.file_url} download={document.file_name}>
                      <Download className="h-4 w-4 mr-1.5" />
                      Download
                    </a>
                  </Button>
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={document.file_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1.5" />
                      Open
                    </a>
                  </Button>
                </div>

                {/* Approval Actions */}
                {showApprovalActions && document.status !== 'approved' && document.status !== 'rejected' && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 text-destructive border-destructive"
                      onClick={() => onReject?.(document.id, "")}
                    >
                      <XCircle className="h-4 w-4 mr-1.5" />
                      Reject
                    </Button>
                    <Button 
                      className="flex-1 bg-success hover:bg-success/90"
                      onClick={() => onApprove?.(document.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="m-0 space-y-3">
              <AIAnalysisPanel 
                analysis={analysis} 
                isLoading={analysisLoading}
                onRunAnalysis={
                  !analysis || analysis.analysis_status === "failed"
                    ? () => document && triggerAnalysis.mutate(document.id)
                    : undefined
                }
                isRunningAnalysis={triggerAnalysis.isPending}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
