import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ExtractedField {
  field_name: string;
  extracted_value: string | null;
  entered_value: string | null;
  is_match: boolean;
  confidence: number;
}

export interface DocumentAnalysis {
  id: string;
  document_id: string;
  document_type: string;
  analysis_status: 'pending' | 'processing' | 'completed' | 'failed';
  extracted_data: ExtractedField[];
  confidence_score: number;
  tampering_score: number;
  tampering_indicators: string[];
  classification_result: string;
  classification_confidence: number;
  analyzed_at: string | null;
  ai_model_version: string;
  error_message?: string | null;
}

function mapDbToAnalysis(row: any): DocumentAnalysis {
  return {
    id: row.id,
    document_id: row.document_id,
    document_type: row.document_type_detected || "",
    analysis_status: row.analysis_status,
    extracted_data: Array.isArray(row.extracted_data) ? row.extracted_data : [],
    confidence_score: row.confidence_score || 0,
    tampering_score: row.tampering_score || 0,
    tampering_indicators: Array.isArray(row.tampering_indicators) ? row.tampering_indicators : [],
    classification_result: row.document_type_detected || "",
    classification_confidence: row.classification_confidence || 0,
    analyzed_at: row.analyzed_at,
    ai_model_version: row.ai_model_version || "",
    error_message: row.error_message,
  };
}

export function useDocumentAnalysis(documentId: string | null) {
  const { data: analysis, isLoading } = useQuery({
    queryKey: ["document-analysis", documentId],
    queryFn: async () => {
      if (!documentId) return null;
      const { data, error } = await supabase
        .from("document_analyses" as any)
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching analysis:", error);
        return null;
      }
      return data ? mapDbToAnalysis(data) : null;
    },
    enabled: !!documentId,
    refetchInterval: (query) => {
      const data = query.state.data as DocumentAnalysis | null;
      // Poll while processing
      if (data?.analysis_status === "processing") return 3000;
      return false;
    },
  });

  return { analysis: analysis ?? null, isLoading };
}

export function useTriggerAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const { data, error } = await supabase.functions.invoke("analyze-document", {
        body: { document_id: documentId },
      });

      if (error) throw error;
      if (data && !data.success) throw new Error(data.error || "Analysis failed");
      return data;
    },
    onSuccess: (_data, documentId) => {
      queryClient.invalidateQueries({ queryKey: ["document-analysis", documentId] });
      queryClient.invalidateQueries({ queryKey: ["document-analyses"] });
      toast.success("AI analysis started");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to start analysis");
    },
  });
}

export function useVendorDocumentAnalyses(vendorId: string | null) {
  const { data: analyses, isLoading } = useQuery({
    queryKey: ["document-analyses", vendorId],
    queryFn: async () => {
      if (!vendorId) return [];

      // Get vendor's document IDs first
      const { data: docs, error: docsError } = await supabase
        .from("vendor_documents")
        .select("id")
        .eq("vendor_id", vendorId);

      if (docsError || !docs?.length) return [];

      const docIds = docs.map((d) => d.id);

      const { data, error } = await supabase
        .from("document_analyses" as any)
        .select("*")
        .in("document_id", docIds)
        .eq("analysis_status", "completed");

      if (error) {
        console.error("Error fetching analyses:", error);
        return [];
      }

      return (data || []).map(mapDbToAnalysis);
    },
    enabled: !!vendorId,
  });

  return { analyses: analyses ?? [], isLoading };
}

export function useDocumentAnalysisStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["document-analysis-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_analyses" as any)
        .select("analysis_status, tampering_score, confidence_score");

      if (error) {
        console.error("Error fetching stats:", error);
        return {
          total_analyzed: 0,
          pending: 0,
          processing: 0,
          flagged: 0,
          high_confidence: 0,
        };
      }

      const rows = data || [];
      return {
        total_analyzed: rows.filter((r: any) => r.analysis_status === "completed").length,
        pending: rows.filter((r: any) => r.analysis_status === "pending").length,
        processing: rows.filter((r: any) => r.analysis_status === "processing").length,
        flagged: rows.filter((r: any) => r.tampering_score > 50).length,
        high_confidence: rows.filter((r: any) => r.confidence_score > 90).length,
      };
    },
  });

  return { stats: stats ?? { total_analyzed: 0, pending: 0, processing: 0, flagged: 0, high_confidence: 0 }, isLoading };
}
