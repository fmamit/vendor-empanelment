 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
 export interface VerifiedUSettings {
   id: string;
   api_token: string | null;
   company_id: string | null;
   api_base_url: string | null;
   is_active: boolean | null;
   created_at: string;
   updated_at: string;
 }
 
 export function useVerifiedUSettings() {
   return useQuery({
     queryKey: ["verifiedu-settings"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("verifiedu_settings")
         .select("*")
         .maybeSingle();
       
       if (error) throw error;
       return data as VerifiedUSettings | null;
     },
   });
 }
 
 export function useUpdateVerifiedUSettings() {
   const queryClient = useQueryClient();
 
   return useMutation({
     mutationFn: async (settings: Partial<VerifiedUSettings>) => {
       // Check if settings exist
       const { data: existing } = await supabase
         .from("verifiedu_settings")
         .select("id")
         .maybeSingle();
 
       if (existing) {
         // Update existing
         const { data, error } = await supabase
           .from("verifiedu_settings")
           .update(settings)
           .eq("id", existing.id)
           .select()
           .single();
         
         if (error) throw error;
         return data;
       } else {
         // Insert new
         const { data, error } = await supabase
           .from("verifiedu_settings")
           .insert(settings)
           .select()
           .single();
         
         if (error) throw error;
         return data;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["verifiedu-settings"] });
       toast.success("VerifiedU settings saved");
     },
     onError: (error: Error) => {
       toast.error(error.message);
     },
   });
 }