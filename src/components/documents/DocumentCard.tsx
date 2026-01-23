import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Eye, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { ExpiryBadge } from "./ExpiryBadge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export interface DocumentCardData {
  id: string;
  document_type_id: string;
  document_type_name: string;
  file_name: string;
  file_url: string;
  status: 'uploaded' | 'under_review' | 'approved' | 'rejected' | 'expired';
  expiry_date: string | null;
  version_number: number;
  created_at: string;
  review_comments?: string | null;
  ai_analysis_status?: 'pending' | 'processing' | 'completed' | 'failed';
  tampering_score?: number;
  is_mandatory?: boolean;
}

interface DocumentCardProps {
  document: DocumentCardData;
  onView?: () => void;
  onReupload?: () => void;
  onAnalysisClick?: () => void;
  showReupload?: boolean;
  showAIBadge?: boolean;
}

const STATUS_CONFIG = {
  uploaded: { 
    label: "Uploaded", 
    className: "bg-muted text-muted-foreground",
    icon: FileText,
  },
  under_review: { 
    label: "Under Review", 
    className: "bg-warning/20 text-warning border-warning/30",
    icon: Clock,
  },
  approved: { 
    label: "Approved", 
    className: "bg-success/20 text-success border-success/30",
    icon: CheckCircle2,
  },
  rejected: { 
    label: "Rejected", 
    className: "bg-destructive/20 text-destructive border-destructive/30",
    icon: XCircle,
  },
  expired: { 
    label: "Expired", 
    className: "bg-destructive/20 text-destructive border-destructive/30",
    icon: AlertTriangle,
  },
};

export function DocumentCard({ 
  document, 
  onView, 
  onReupload,
  onAnalysisClick,
  showReupload = false,
  showAIBadge = true,
}: DocumentCardProps) {
  const statusConfig = STATUS_CONFIG[document.status];
  const StatusIcon = statusConfig.icon;

  const hasAIAnalysis = document.ai_analysis_status && document.ai_analysis_status !== 'pending';
  const isFlagged = (document.tampering_score || 0) > 50;

  return (
    <Card className={cn(
      "overflow-hidden",
      document.status === 'rejected' && "border-destructive/30",
      isFlagged && "border-warning/50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
            document.status === 'approved' && "bg-success/10",
            document.status === 'rejected' && "bg-destructive/10",
            document.status === 'under_review' && "bg-warning/10",
            (document.status === 'uploaded' || document.status === 'expired') && "bg-muted"
          )}>
            <FileText className={cn(
              "h-5 w-5",
              document.status === 'approved' && "text-success",
              document.status === 'rejected' && "text-destructive",
              document.status === 'under_review' && "text-warning",
              (document.status === 'uploaded' || document.status === 'expired') && "text-muted-foreground"
            )} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="font-medium text-sm truncate">{document.document_type_name}</h4>
              <Badge variant="outline" className={cn("text-xs shrink-0", statusConfig.className)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground truncate mb-2">
              {document.file_name}
            </p>

            {/* Badges Row */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {document.version_number > 1 && (
                <Badge variant="outline" className="text-xs">
                  v{document.version_number}
                </Badge>
              )}
              
              {document.expiry_date && (
                <ExpiryBadge expiryDate={document.expiry_date} />
              )}

              {showAIBadge && hasAIAnalysis && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs cursor-pointer",
                    isFlagged 
                      ? "bg-warning/10 text-warning border-warning/30" 
                      : "bg-primary/10 text-primary border-primary/30"
                  )}
                  onClick={onAnalysisClick}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {document.ai_analysis_status === 'processing' ? "Analyzing..." : 
                   isFlagged ? "Flagged" : "AI Verified"}
                </Badge>
              )}
            </div>

            {/* Rejection Comment */}
            {document.status === 'rejected' && document.review_comments && (
              <div className="p-2 bg-destructive/5 rounded text-xs text-destructive mt-2">
                <span className="font-medium">Reason:</span> {document.review_comments}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1" onClick={onView}>
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                View
              </Button>
              
              {showReupload && (document.status === 'rejected' || document.status === 'expired') && (
                <Button variant="outline" size="sm" className="flex-1" onClick={onReupload}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Re-upload
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
