import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Generate a secure random token
export const generateInvitationToken = (): string => {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

interface CreateInvitationData {
  category_id: string;
  company_name: string;
  contact_phone: string;
  contact_email: string;
}

interface VendorInvitation {
  id: string;
  token: string;
  category_id: string;
  company_name: string;
  contact_phone: string;
  contact_email: string;
  created_by: string;
  expires_at: string;
  used_at: string | null;
  vendor_id: string | null;
  created_at: string;
  vendor_categories?: {
    id: string;
    name: string;
    description: string | null;
  };
}

// Hook to create a new invitation (staff only)
export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInvitationData) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("Not authenticated");
      }

      const token = generateInvitationToken();

      const { data: invitation, error } = await supabase
        .from("vendor_invitations")
        .insert({
          token,
          category_id: data.category_id,
          company_name: data.company_name,
          contact_phone: data.contact_phone,
          contact_email: data.contact_email,
          created_by: userData.user.id,
        })
        .select("*, vendor_categories(id, name, description)")
        .single();

      if (error) throw error;
      return invitation as VendorInvitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-invitations"] });
      toast.success("Invitation created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create invitation: " + error.message);
    },
  });
}

// Hook to validate an invitation by token
export function useValidateInvitation(token: string | null) {
  return useQuery({
    queryKey: ["vendor-invitation", token],
    queryFn: async () => {
      if (!token) return null;

      const { data, error } = await supabase
        .from("vendor_invitations")
        .select("*, vendor_categories(id, name, description)")
        .eq("token", token)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned - invalid or expired token
          return null;
        }
        throw error;
      }

      return data as VendorInvitation;
    },
    enabled: !!token,
    staleTime: 1000 * 60, // 1 minute
  });
}

// Hook to mark an invitation as used
export function useConsumeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ token, vendorId }: { token: string; vendorId: string }) => {
      const { data, error } = await supabase
        .from("vendor_invitations")
        .update({
          used_at: new Date().toISOString(),
          vendor_id: vendorId,
        })
        .eq("token", token)
        .is("used_at", null)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-invitations"] });
    },
    onError: (error: Error) => {
      console.error("Failed to consume invitation:", error);
    },
  });
}

// Hook to list all invitations (staff dashboard)
export function useInvitationsList() {
  return useQuery({
    queryKey: ["vendor-invitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_invitations")
        .select("*, vendor_categories(id, name, description)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as VendorInvitation[];
    },
  });
}
