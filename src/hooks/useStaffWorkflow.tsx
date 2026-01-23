import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserRoles } from "./useUserRoles";
import { toast } from "sonner";
import { Vendor, VendorDocument } from "./useVendor";

export interface VendorWithCategory extends Vendor {
  vendor_categories: {
    name: string;
  };
}

export function useStaffVendorQueue() {
  const { user } = useAuth();
  const { isAdmin, isMaker, isChecker, isApprover } = useUserRoles();

  return useQuery({
    queryKey: ["staff-vendor-queue", user?.id, isAdmin, isMaker, isChecker, isApprover],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("vendors")
        .select(`
          *,
          vendor_categories (name)
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as VendorWithCategory[];
    },
    enabled: !!user,
  });
}

export function useVendorDetails(vendorId: string | null) {
  return useQuery({
    queryKey: ["vendor-details", vendorId],
    queryFn: async () => {
      if (!vendorId) return null;

      const { data, error } = await supabase
        .from("vendors")
        .select(`
          *,
          vendor_categories (name)
        `)
        .eq("id", vendorId)
        .single();

      if (error) throw error;
      return data as VendorWithCategory;
    },
    enabled: !!vendorId,
  });
}

export function useVendorDocumentsForReview(vendorId: string | null) {
  return useQuery({
    queryKey: ["vendor-documents-review", vendorId],
    queryFn: async () => {
      if (!vendorId) return [];

      const { data, error } = await supabase
        .from("vendor_documents")
        .select(`
          *,
          document_types (name, has_expiry)
        `)
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (VendorDocument & { document_types: { name: string; has_expiry: boolean } })[];
    },
    enabled: !!vendorId,
  });
}

export function useUpdateVendorStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      vendorId,
      newStatus,
      comments,
    }: {
      vendorId: string;
      newStatus: Vendor["current_status"];
      comments?: string;
    }) => {
      // Get current status
      const { data: vendor, error: fetchError } = await supabase
        .from("vendors")
        .select("current_status")
        .eq("id", vendorId)
        .single();

      if (fetchError) throw fetchError;

      // Update vendor status
      const updateData: Partial<Vendor> = { current_status: newStatus };
      if (newStatus === "approved") {
        updateData.approved_at = new Date().toISOString();
      } else if (newStatus === "rejected") {
        updateData.rejected_at = new Date().toISOString();
        updateData.rejection_reason = comments || null;
      }

      const { error: updateError } = await supabase
        .from("vendors")
        .update(updateData)
        .eq("id", vendorId);

      if (updateError) throw updateError;

      // Add workflow history
      const { error: historyError } = await supabase
        .from("workflow_history")
        .insert({
          vendor_id: vendorId,
          from_status: vendor.current_status,
          to_status: newStatus,
          action: newStatus === "rejected" ? "rejected" : "forwarded",
          action_by: user!.id,
          comments: comments || null,
        });

      if (historyError) throw historyError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-vendor-queue"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-details"] });
      toast.success("Vendor status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update status");
    },
  });
}

export function useUpdateDocumentStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      documentId,
      status,
      comments,
    }: {
      documentId: string;
      status: VendorDocument["status"];
      comments?: string;
    }) => {
      const { error } = await supabase
        .from("vendor_documents")
        .update({
          status,
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
          review_comments: comments || null,
        })
        .eq("id", documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-documents-review"] });
      toast.success("Document status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update document");
    },
  });
}
