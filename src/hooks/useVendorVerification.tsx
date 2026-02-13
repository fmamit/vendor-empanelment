import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useVendorVerifications(vendorId: string) {
  return useQuery({
    queryKey: ["vendor-verifications", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_verifications")
        .select("*")
        .eq("vendor_id", vendorId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!vendorId,
  });
}

export function useVerifyPan() {
  return useMutation({
    mutationFn: async ({ panNumber, vendorId }: { panNumber: string; vendorId: string }) => {
      const response = await fetch(`${window.location.origin}/functions/v1/verify-pan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pan_number: panNumber.toUpperCase(),
          vendor_id: vendorId,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
  });
}

export function useVerifyBankAccount() {
  return useMutation({
    mutationFn: async ({
      accountNumber,
      ifscCode,
      vendorId,
    }: {
      accountNumber: string;
      ifscCode: string;
      vendorId: string;
    }) => {
      const response = await fetch(`${window.location.origin}/functions/v1/verify-bank-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_number: accountNumber,
          ifsc_code: ifscCode,
          vendor_id: vendorId,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
  });
}

export function useInitiateAadhaar() {
  return useMutation({
    mutationFn: async ({ vendorId }: { vendorId: string }) => {
      const response = await fetch(`${window.location.origin}/functions/v1/verify-aadhaar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendor_id: vendorId,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
  });
}

export function useFetchAadhaarDetails() {
  return useMutation({
    mutationFn: async ({
      uniqueRequestNumber,
      vendorId,
    }: {
      uniqueRequestNumber: string;
      vendorId: string;
    }) => {
      const response = await fetch(`${window.location.origin}/functions/v1/get-aadhaar-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unique_request_number: uniqueRequestNumber,
          vendor_id: vendorId,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
  });
}
