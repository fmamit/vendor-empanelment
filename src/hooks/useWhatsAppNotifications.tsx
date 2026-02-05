 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
 export interface WhatsAppMessage {
   id: string;
   vendor_id: string | null;
   phone_number: string;
   message_content: string | null;
   template_name: string | null;
   template_variables: Record<string, string> | null;
   direction: "inbound" | "outbound";
   status: "pending" | "sent" | "delivered" | "read" | "failed" | "received";
   exotel_message_id: string | null;
   sent_by: string | null;
   sent_at: string | null;
   delivered_at: string | null;
   read_at: string | null;
   error_message: string | null;
   created_at: string;
 }
 
 export interface WhatsAppTemplate {
   id: string;
   template_name: string;
   category: string;
   content: string;
   variables: any[];
   status: "approved" | "pending" | "rejected";
   is_active: boolean;
 }
 
 export interface WhatsAppSettings {
   id: string;
   exotel_sid: string | null;
   exotel_api_key: string | null;
   exotel_api_token: string | null;
   exotel_subdomain: string;
   whatsapp_source_number: string | null;
   waba_id: string | null;
   is_active: boolean;
 }
 
 // Hook to send WhatsApp messages
 export function useSendWhatsApp() {
   const queryClient = useQueryClient();
 
   return useMutation({
     mutationFn: async ({
       vendor_id,
       phone_number,
       template_name,
       template_variables,
       message,
     }: {
       vendor_id?: string;
       phone_number: string;
       template_name?: string;
       template_variables?: Record<string, string>;
       message?: string;
     }) => {
       const { data, error } = await supabase.functions.invoke("send-whatsapp-message", {
         body: {
           vendor_id,
           phone_number,
           template_name,
           template_variables,
           message,
         },
       });
 
       if (error) throw error;
       if (!data.success) throw new Error(data.error || "Failed to send WhatsApp");
       
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["whatsapp-messages"] });
       toast.success("WhatsApp message sent");
     },
     onError: (error: Error) => {
       toast.error(error.message || "Failed to send WhatsApp");
     },
   });
 }
 
 // Hook to get WhatsApp message history for a vendor
 export function useWhatsAppHistory(vendorId: string | null) {
   return useQuery({
     queryKey: ["whatsapp-messages", vendorId],
     queryFn: async () => {
       if (!vendorId) return [];
 
       const { data, error } = await supabase
         .from("whatsapp_messages")
         .select("*")
         .eq("vendor_id", vendorId)
         .order("created_at", { ascending: false });
 
       if (error) throw error;
       return data as WhatsAppMessage[];
     },
     enabled: !!vendorId,
   });
 }
 
 // Hook to get available WhatsApp templates
 export function useWhatsAppTemplates() {
   return useQuery({
     queryKey: ["whatsapp-templates"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("whatsapp_templates")
         .select("*")
         .eq("is_active", true)
         .eq("status", "approved")
         .order("template_name");
 
       if (error) throw error;
       return data as WhatsAppTemplate[];
     },
   });
 }
 
 // Hook to get WhatsApp settings
 export function useWhatsAppSettings() {
   return useQuery({
     queryKey: ["whatsapp-settings"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("whatsapp_settings")
         .select("*")
         .limit(1)
         .maybeSingle();
 
       if (error) throw error;
       return data as WhatsAppSettings | null;
     },
   });
 }
 
 // Hook to update WhatsApp settings
 export function useUpdateWhatsAppSettings() {
   const queryClient = useQueryClient();
 
   return useMutation({
     mutationFn: async (settings: Partial<WhatsAppSettings>) => {
       // Check if settings exist
       const { data: existing } = await supabase
         .from("whatsapp_settings")
         .select("id")
         .limit(1)
         .maybeSingle();
 
       if (existing) {
         const { error } = await supabase
           .from("whatsapp_settings")
           .update(settings)
           .eq("id", existing.id);
         if (error) throw error;
       } else {
         const { error } = await supabase
           .from("whatsapp_settings")
           .insert(settings);
         if (error) throw error;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["whatsapp-settings"] });
       toast.success("WhatsApp settings saved");
     },
     onError: (error: Error) => {
       toast.error(error.message || "Failed to save settings");
     },
   });
 }
 
 // Hook to sync templates from Exotel
 export function useSyncWhatsAppTemplates() {
   const queryClient = useQueryClient();
 
   return useMutation({
     mutationFn: async () => {
       const { data, error } = await supabase.functions.invoke("sync-whatsapp-templates");
       if (error) throw error;
       if (!data.success) throw new Error(data.error || "Failed to sync templates");
       return data;
     },
     onSuccess: (data) => {
       queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
       toast.success(`Synced ${data.count} templates`);
     },
     onError: (error: Error) => {
       toast.error(error.message || "Failed to sync templates");
     },
   });
 }
 
 // Hook to send invitation WhatsApp
 export function useSendInvitationWhatsApp() {
   return useMutation({
     mutationFn: async ({
       phone_number,
       company_name,
       registration_link,
     }: {
       phone_number: string;
       company_name: string;
       registration_link: string;
     }) => {
       const { data, error } = await supabase.functions.invoke("send-whatsapp-message", {
         body: {
           phone_number,
           template_name: "vendor_invitation",
           template_variables: {
             "1": company_name,
             "2": registration_link,
           },
         },
       });
 
       if (error) throw error;
       if (!data.success) throw new Error(data.error || "Failed to send WhatsApp");
       
       return data;
     },
     onError: (error: Error) => {
       console.error("Failed to send invitation WhatsApp:", error);
     },
   });
 }
 
 // Hook to send status update WhatsApp
 export function useSendStatusWhatsApp() {
   return useMutation({
     mutationFn: async ({
       vendor_id,
       phone_number,
       template_name,
       template_variables,
     }: {
       vendor_id: string;
       phone_number: string;
       template_name: string;
       template_variables: Record<string, string>;
     }) => {
       const { data, error } = await supabase.functions.invoke("send-whatsapp-message", {
         body: {
           vendor_id,
           phone_number,
           template_name,
           template_variables,
         },
       });
 
       if (error) throw error;
       if (!data.success) throw new Error(data.error || "Failed to send WhatsApp");
       
       return data;
     },
     onError: (error: Error) => {
       console.error("Failed to send status WhatsApp:", error);
     },
   });
 }