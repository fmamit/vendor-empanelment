 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
 export interface VendorVerification {
   id: string;
   vendor_id: string;
   verification_type: "pan" | "aadhaar" | "bank_account";
   verification_source: string;
   status: "pending" | "in_progress" | "success" | "failed";
   request_data: any;
   response_data: any;
   verified_at: string | null;
   verified_by: string | null;
   remarks: string | null;
   created_at: string;
 }
 
 export function useVendorVerifications(vendorId: string | null) {
   return useQuery({
     queryKey: ["vendor-verifications", vendorId],
     queryFn: async () => {
       if (!vendorId) return [];
       
       const { data, error } = await supabase
         .from("vendor_verifications")
         .select("*")
         .eq("vendor_id", vendorId)
         .order("created_at", { ascending: false });
       
       if (error) throw error;
       return data as VendorVerification[];
     },
     enabled: !!vendorId,
   });
 }
 
 export function useLatestVerification(vendorId: string | null, type: "pan" | "aadhaar" | "bank_account") {
   const { data: verifications } = useVendorVerifications(vendorId);
   return verifications?.find(v => v.verification_type === type);
 }
 
 export function useVerifyPAN() {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: async ({ panNumber, vendorId }: { panNumber: string; vendorId?: string }) => {
       const { data, error } = await supabase.functions.invoke("verify-pan", {
         body: { panNumber, vendorId },
       });
       
       if (error) throw error;
       if (!data.success) throw new Error(data.error || "PAN verification failed");
       return data;
     },
     onSuccess: (data, variables) => {
       if (data.is_mock) {
         toast.success("PAN verified (Mock Mode)", { 
           description: "API credentials not configured" 
         });
       } else {
         toast.success("PAN verified successfully");
       }
       if (variables.vendorId) {
         queryClient.invalidateQueries({ queryKey: ["vendor-verifications", variables.vendorId] });
       }
     },
     onError: (error: any) => {
       toast.error("PAN verification failed", { description: error.message });
     },
   });
 }
 
 export function useVerifyBankAccount() {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: async ({ 
       accountNumber, 
       ifscCode, 
       vendorId 
     }: { 
       accountNumber: string; 
       ifscCode: string; 
       vendorId?: string;
     }) => {
       const { data, error } = await supabase.functions.invoke("verify-bank-account", {
         body: { accountNumber, ifscCode, vendorId },
       });
       
       if (error) throw error;
       if (!data.success) throw new Error(data.error || "Bank account verification failed");
       return data;
     },
     onSuccess: (data, variables) => {
       if (data.is_mock) {
         toast.success("Bank account verified (Mock Mode)", { 
           description: "API credentials not configured" 
         });
       } else {
         toast.success("Bank account verified successfully");
       }
       if (variables.vendorId) {
         queryClient.invalidateQueries({ queryKey: ["vendor-verifications", variables.vendorId] });
       }
     },
     onError: (error: any) => {
       toast.error("Bank verification failed", { description: error.message });
     },
   });
 }
 
 export function useInitiateAadhaarVerification() {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: async ({ vendorId, returnUrl }: { vendorId: string; returnUrl?: string }) => {
       const { data, error } = await supabase.functions.invoke("verify-aadhaar-initiate", {
         body: { vendorId, returnUrl: returnUrl || window.location.origin },
       });
       
       if (error) throw error;
       if (!data.success) throw new Error(data.error || "Failed to initiate Aadhaar verification");
       return data;
     },
     onSuccess: (data, variables) => {
       queryClient.invalidateQueries({ queryKey: ["vendor-verifications", variables.vendorId] });
       // Redirect to DigiLocker
       if (data.data?.url) {
         window.location.href = data.data.url;
       }
     },
     onError: (error: any) => {
       toast.error("Aadhaar verification failed", { description: error.message });
     },
   });
 }
 
 export function useFetchAadhaarDetails() {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: async ({ uniqueRequestNumber, vendorId }: { uniqueRequestNumber: string; vendorId?: string }) => {
       const { data, error } = await supabase.functions.invoke("verify-aadhaar-details", {
         body: { uniqueRequestNumber, vendorId },
       });
       
       if (error) throw error;
       if (!data.success) throw new Error(data.error || "Failed to fetch Aadhaar details");
       return data;
     },
     onSuccess: (data) => {
       if (data.is_mock) {
         toast.success("Aadhaar verified (Mock Mode)", { 
           description: "API credentials not configured" 
         });
       } else {
         toast.success("Aadhaar verified successfully");
       }
       if (data.vendorId) {
         queryClient.invalidateQueries({ queryKey: ["vendor-verifications", data.vendorId] });
       }
     },
     onError: (error: any) => {
       toast.error("Aadhaar verification failed", { description: error.message });
     },
   });
 }