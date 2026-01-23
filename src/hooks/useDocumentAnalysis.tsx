import { useMemo } from "react";

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
}

// Mock document analysis data
const MOCK_ANALYSES: DocumentAnalysis[] = [
  {
    id: "analysis-1",
    document_id: "doc-001",
    document_type: "GST Certificate",
    analysis_status: "completed",
    extracted_data: [
      { field_name: "GSTIN", extracted_value: "27AABCU9603R1ZM", entered_value: "27AABCU9603R1ZM", is_match: true, confidence: 98 },
      { field_name: "Legal Name", extracted_value: "ABC SUPPLIES PVT LTD", entered_value: "ABC Supplies Pvt Ltd", is_match: true, confidence: 95 },
      { field_name: "Trade Name", extracted_value: "ABC SUPPLIES", entered_value: "ABC Supplies", is_match: true, confidence: 92 },
      { field_name: "Registration Date", extracted_value: "01/07/2017", entered_value: null, is_match: false, confidence: 88 },
      { field_name: "State", extracted_value: "Maharashtra", entered_value: null, is_match: false, confidence: 96 },
    ],
    confidence_score: 94,
    tampering_score: 12,
    tampering_indicators: [],
    classification_result: "GST Certificate",
    classification_confidence: 99,
    analyzed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    ai_model_version: "gemini-2.5-pro-v1",
  },
  {
    id: "analysis-2",
    document_id: "doc-002",
    document_type: "PAN Card",
    analysis_status: "completed",
    extracted_data: [
      { field_name: "PAN Number", extracted_value: "AADCA1234B", entered_value: "AADCA1234B", is_match: true, confidence: 99 },
      { field_name: "Name", extracted_value: "ABC SUPPLIES PRIVATE LIMITED", entered_value: "ABC Supplies Pvt Ltd", is_match: false, confidence: 97 },
      { field_name: "Date of Incorporation", extracted_value: "15/03/2010", entered_value: null, is_match: false, confidence: 85 },
    ],
    confidence_score: 94,
    tampering_score: 8,
    tampering_indicators: [],
    classification_result: "PAN Card",
    classification_confidence: 98,
    analyzed_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    ai_model_version: "gemini-2.5-pro-v1",
  },
  {
    id: "analysis-3",
    document_id: "doc-003",
    document_type: "Cancelled Cheque",
    analysis_status: "completed",
    extracted_data: [
      { field_name: "Bank Name", extracted_value: "HDFC BANK", entered_value: "HDFC Bank", is_match: true, confidence: 97 },
      { field_name: "Account Number", extracted_value: "50100123456789", entered_value: "50100123456789", is_match: true, confidence: 95 },
      { field_name: "IFSC Code", extracted_value: "HDFC0001234", entered_value: "HDFC0001234", is_match: true, confidence: 98 },
      { field_name: "Account Holder", extracted_value: "ABC SUPPLIES PVT LTD", entered_value: "ABC Supplies Pvt Ltd", is_match: true, confidence: 93 },
    ],
    confidence_score: 96,
    tampering_score: 5,
    tampering_indicators: [],
    classification_result: "Cancelled Cheque",
    classification_confidence: 97,
    analyzed_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    ai_model_version: "gemini-2.5-pro-v1",
  },
  {
    id: "analysis-4",
    document_id: "doc-004",
    document_type: "GST Certificate",
    analysis_status: "completed",
    extracted_data: [
      { field_name: "GSTIN", extracted_value: "29AABCM1234A1ZP", entered_value: "29AABCM1234A1ZP", is_match: true, confidence: 72 },
      { field_name: "Legal Name", extracted_value: "METRO CONTRACTORS", entered_value: "Metro Contractors", is_match: true, confidence: 68 },
    ],
    confidence_score: 65,
    tampering_score: 78,
    tampering_indicators: [
      "Inconsistent font detected in GST number field",
      "Metadata shows file was edited with image software",
      "Compression artifacts around text regions",
      "Date field appears to have been modified"
    ],
    classification_result: "GST Certificate",
    classification_confidence: 85,
    analyzed_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    ai_model_version: "gemini-2.5-pro-v1",
  },
  {
    id: "analysis-5",
    document_id: "doc-005",
    document_type: "Certificate of Incorporation",
    analysis_status: "processing",
    extracted_data: [],
    confidence_score: 0,
    tampering_score: 0,
    tampering_indicators: [],
    classification_result: "",
    classification_confidence: 0,
    analyzed_at: null,
    ai_model_version: "gemini-2.5-pro-v1",
  },
  {
    id: "analysis-6",
    document_id: "doc-006",
    document_type: "Trade License",
    analysis_status: "pending",
    extracted_data: [],
    confidence_score: 0,
    tampering_score: 0,
    tampering_indicators: [],
    classification_result: "",
    classification_confidence: 0,
    analyzed_at: null,
    ai_model_version: "gemini-2.5-pro-v1",
  },
];

export function useDocumentAnalysis(documentId: string | null) {
  const analysis = useMemo(() => {
    if (!documentId) return null;
    return MOCK_ANALYSES.find(a => a.document_id === documentId) || null;
  }, [documentId]);

  return {
    analysis,
    isLoading: false,
  };
}

export function useVendorDocumentAnalyses(vendorId: string | null) {
  // In real implementation, filter by vendor's documents
  const analyses = useMemo(() => {
    if (!vendorId) return [];
    // Return all mock analyses for demo purposes
    return MOCK_ANALYSES.filter(a => a.analysis_status === 'completed');
  }, [vendorId]);

  return {
    analyses,
    isLoading: false,
  };
}

export function useDocumentAnalysisStats() {
  const stats = useMemo(() => ({
    total_analyzed: MOCK_ANALYSES.filter(a => a.analysis_status === 'completed').length,
    pending: MOCK_ANALYSES.filter(a => a.analysis_status === 'pending').length,
    processing: MOCK_ANALYSES.filter(a => a.analysis_status === 'processing').length,
    flagged: MOCK_ANALYSES.filter(a => a.tampering_score > 50).length,
    high_confidence: MOCK_ANALYSES.filter(a => a.confidence_score > 90).length,
  }), []);

  return { stats, isLoading: false };
}
