import { useState, useMemo } from "react";

export interface FraudAlert {
  id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_code: string | null;
  alert_type: 'duplicate_gst' | 'duplicate_pan' | 'duplicate_bank' | 'similar_name' | 'tampering' | 'verification_failed';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  details: {
    matching_vendor_id?: string;
    matching_vendor_name?: string;
    matching_value?: string;
    similarity_score?: number;
    tampering_indicators?: string[];
    confidence_score?: number;
    verification_type?: string;
    verification_error?: string;
  };
  status: 'pending' | 'reviewed' | 'dismissed' | 'confirmed';
  created_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  dismiss_reason?: string;
}

// Mock data for UI development
const MOCK_ALERTS: FraudAlert[] = [
  {
    id: "alert-1",
    vendor_id: "vendor-001",
    vendor_name: "ABC Supplies Pvt Ltd",
    vendor_code: "VND-2024-001",
    alert_type: "duplicate_gst",
    severity: "critical",
    title: "Duplicate GST Number Detected",
    description: "The GST number 27AABCU9603R1ZM is already registered with another vendor.",
    details: {
      matching_vendor_id: "vendor-002",
      matching_vendor_name: "XYZ Trading Co",
      matching_value: "27AABCU9603R1ZM",
    },
    status: "pending",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "alert-2",
    vendor_id: "vendor-003",
    vendor_name: "Metro Contractors",
    vendor_code: "VND-2024-003",
    alert_type: "tampering",
    severity: "high",
    title: "Possible Document Tampering",
    description: "AI analysis detected potential tampering in the uploaded GST certificate.",
    details: {
      tampering_indicators: [
        "Inconsistent font detected in GST number field",
        "Metadata shows file was edited with image software",
        "Compression artifacts around text regions"
      ],
      confidence_score: 78,
    },
    status: "pending",
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "alert-3",
    vendor_id: "vendor-004",
    vendor_name: "Global Services India",
    vendor_code: "VND-2024-004",
    alert_type: "duplicate_bank",
    severity: "high",
    title: "Duplicate Bank Account",
    description: "Bank account ending in 5678 is already linked to another vendor.",
    details: {
      matching_vendor_id: "vendor-005",
      matching_vendor_name: "Prime Solutions Ltd",
      matching_value: "HDFC0001234 - ****5678",
    },
    status: "reviewed",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    reviewed_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "alert-4",
    vendor_id: "vendor-006",
    vendor_name: "Bharat Industries Pvt Ltd",
    vendor_code: "VND-2024-006",
    alert_type: "similar_name",
    severity: "medium",
    title: "Similar Company Name Found",
    description: "Company name is 92% similar to an existing vendor.",
    details: {
      matching_vendor_id: "vendor-007",
      matching_vendor_name: "Bharat Industries Private Limited",
      similarity_score: 92,
    },
    status: "pending",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "alert-5",
    vendor_id: "vendor-008",
    vendor_name: "Tech Solutions Hub",
    vendor_code: null,
    alert_type: "verification_failed",
    severity: "medium",
    title: "GST Verification Failed",
    description: "Unable to verify GST number with government portal.",
    details: {
      verification_type: "GST",
      verification_error: "GSTIN not found in GSTN database or status is cancelled",
    },
    status: "pending",
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "alert-6",
    vendor_id: "vendor-009",
    vendor_name: "Quick Logistics",
    vendor_code: "VND-2024-009",
    alert_type: "duplicate_pan",
    severity: "critical",
    title: "Duplicate PAN Number",
    description: "PAN number AADCQ1234E is registered with another vendor.",
    details: {
      matching_vendor_id: "vendor-010",
      matching_vendor_name: "Fast Movers Pvt Ltd",
      matching_value: "AADCQ1234E",
    },
    status: "dismissed",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    reviewed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    dismiss_reason: "Same parent company, verified through documentation",
  },
  {
    id: "alert-7",
    vendor_id: "vendor-011",
    vendor_name: "Sharma Enterprises",
    vendor_code: "VND-2024-011",
    alert_type: "tampering",
    severity: "low",
    title: "Minor Document Anomaly",
    description: "AI detected minor inconsistencies in uploaded document.",
    details: {
      tampering_indicators: [
        "Slight color variation in signature area"
      ],
      confidence_score: 35,
    },
    status: "confirmed",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    reviewed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export type AlertFilter = {
  severity?: FraudAlert['severity'][];
  type?: FraudAlert['alert_type'][];
  status?: FraudAlert['status'][];
};

export function useFraudAlerts(filters?: AlertFilter) {
  const [isLoading] = useState(false);

  const alerts = useMemo(() => {
    let filtered = [...MOCK_ALERTS];

    if (filters?.severity?.length) {
      filtered = filtered.filter(a => filters.severity!.includes(a.severity));
    }
    if (filters?.type?.length) {
      filtered = filtered.filter(a => filters.type!.includes(a.alert_type));
    }
    if (filters?.status?.length) {
      filtered = filtered.filter(a => filters.status!.includes(a.status));
    }

    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [filters]);

  const stats = useMemo(() => ({
    critical: MOCK_ALERTS.filter(a => a.severity === 'critical' && a.status === 'pending').length,
    high: MOCK_ALERTS.filter(a => a.severity === 'high' && a.status === 'pending').length,
    pending: MOCK_ALERTS.filter(a => a.status === 'pending').length,
    dismissed: MOCK_ALERTS.filter(a => a.status === 'dismissed').length,
    total: MOCK_ALERTS.length,
  }), []);

  return {
    alerts,
    stats,
    isLoading,
  };
}

export function useFraudAlertById(alertId: string | null) {
  const alert = useMemo(() => {
    if (!alertId) return null;
    return MOCK_ALERTS.find(a => a.id === alertId) || null;
  }, [alertId]);

  return { alert, isLoading: false };
}

export function useVendorFraudAlerts(vendorId: string | null) {
  const alerts = useMemo(() => {
    if (!vendorId) return [];
    return MOCK_ALERTS.filter(a => a.vendor_id === vendorId);
  }, [vendorId]);

  return { alerts, isLoading: false };
}
