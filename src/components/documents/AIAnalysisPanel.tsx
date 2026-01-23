import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Loader2,
  FileText
} from "lucide-react";
import { TamperingIndicator } from "@/components/fraud/TamperingIndicator";
import { DocumentAnalysis, ExtractedField } from "@/hooks/useDocumentAnalysis";
import { cn } from "@/lib/utils";

interface AIAnalysisPanelProps {
  analysis: DocumentAnalysis | null;
  isLoading?: boolean;
}

function ConfidenceBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn(
          "font-mono font-medium",
          value >= 90 && "text-success",
          value >= 70 && value < 90 && "text-warning",
          value < 70 && "text-destructive"
        )}>
          {value}%
        </span>
      </div>
      <Progress 
        value={value} 
        className="h-1.5"
      />
    </div>
  );
}

function ExtractedFieldRow({ field }: { field: ExtractedField }) {
  const hasMismatch = !field.is_match && field.entered_value;
  
  return (
    <div className={cn(
      "flex items-start gap-3 p-2 rounded-lg text-sm",
      hasMismatch && "bg-warning/10",
      field.is_match && "bg-success/5"
    )}>
      <div className="pt-0.5">
        {field.is_match ? (
          <CheckCircle2 className="h-4 w-4 text-success" />
        ) : hasMismatch ? (
          <AlertTriangle className="h-4 w-4 text-warning" />
        ) : (
          <FileText className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{field.field_name}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-primary/5">AI</Badge>
            <span className="font-mono text-xs truncate">
              {field.extracted_value || "—"}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {field.confidence}%
            </span>
          </div>
          {field.entered_value && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Entered</Badge>
              <span className={cn(
                "font-mono text-xs truncate",
                hasMismatch && "text-warning"
              )}>
                {field.entered_value}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AIAnalysisPanel({ analysis, isLoading }: AIAnalysisPanelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span className="text-sm text-muted-foreground">Loading analysis...</span>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No AI analysis available</p>
        </CardContent>
      </Card>
    );
  }

  if (analysis.analysis_status === 'pending') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Sparkles className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-sm mb-1">Analysis Pending</p>
          <p className="text-xs text-muted-foreground">
            Document will be analyzed shortly
          </p>
        </CardContent>
      </Card>
    );
  }

  if (analysis.analysis_status === 'processing') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="font-medium text-sm mb-1">Analyzing Document</p>
          <p className="text-xs text-muted-foreground">
            AI is extracting and validating data...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (analysis.analysis_status === 'failed') {
    return (
      <Card className="border-destructive/30">
        <CardContent className="p-6 text-center">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <p className="font-medium text-sm mb-1 text-destructive">Analysis Failed</p>
          <p className="text-xs text-muted-foreground">
            Unable to analyze this document. Please try re-uploading.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasFlags = analysis.tampering_score > 50 || 
    analysis.extracted_data.some(f => !f.is_match && f.entered_value);

  return (
    <Card className={cn(hasFlags && "border-warning/50")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Analysis Results
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {analysis.ai_model_version}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Document Classification */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Detected Document Type</p>
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{analysis.classification_result}</span>
            <Badge variant="outline" className={cn(
              "text-xs",
              analysis.classification_confidence >= 90 && "bg-success/10 text-success",
              analysis.classification_confidence < 90 && "bg-warning/10 text-warning"
            )}>
              {analysis.classification_confidence}% match
            </Badge>
          </div>
        </div>

        {/* Confidence Scores */}
        <div className="space-y-2">
          <ConfidenceBar value={analysis.confidence_score} label="Overall Confidence" />
        </div>

        {/* Tampering Detection */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Tampering Detection
          </p>
          <TamperingIndicator
            score={analysis.tampering_score}
            indicators={analysis.tampering_indicators}
            showDetails={analysis.tampering_score > 25}
            size="sm"
          />
        </div>

        <Separator />

        {/* Extracted Fields */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Extracted Data ({analysis.extracted_data.length} fields)
          </p>
          <div className="space-y-2">
            {analysis.extracted_data.map((field, idx) => (
              <ExtractedFieldRow key={idx} field={field} />
            ))}
          </div>
        </div>

        {/* Analysis Timestamp */}
        {analysis.analyzed_at && (
          <p className="text-xs text-muted-foreground text-center pt-2 border-t">
            Analyzed on {new Date(analysis.analyzed_at).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
