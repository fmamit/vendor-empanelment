 import { useMutation } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
 export type EmailType = 'invitation' | 'status_update' | 'approved' | 'rejected';
 
 export interface SendVendorEmailParams {
   email_type: EmailType;
   to_email: string;
   to_name: string;
   merge_data: {
     company_name?: string;
     registration_link?: string;
     vendor_code?: string;
     rejection_reason?: string;
     new_status?: string;
     contact_name?: string;
   };
 }
 
 export function useSendVendorEmail() {
   return useMutation({
     mutationFn: async (params: SendVendorEmailParams) => {
       const { data, error } = await supabase.functions.invoke('send-vendor-email', {
         body: params,
       });
 
       if (error) {
         throw new Error(error.message || 'Failed to send email');
       }
 
       if (data?.error) {
         throw new Error(data.error);
       }
 
       return data;
     },
     onError: (error: Error) => {
       console.error('Email sending failed:', error);
       // Don't show toast here - let the caller decide
     },
   });
 }
 
 // Helper to send invitation email
 export function useSendInvitationEmail() {
   const sendEmail = useSendVendorEmail();
 
   return useMutation({
     mutationFn: async ({
       to_email,
       company_name,
       contact_name,
       registration_link,
     }: {
       to_email: string;
       company_name: string;
       contact_name?: string;
       registration_link: string;
     }) => {
       return sendEmail.mutateAsync({
         email_type: 'invitation',
         to_email,
         to_name: company_name,
         merge_data: {
           company_name,
           contact_name,
           registration_link,
         },
       });
     },
     onSuccess: () => {
       toast.success("Invitation email sent successfully");
     },
     onError: (error: Error) => {
       toast.error(`Failed to send invitation email: ${error.message}`);
     },
   });
 }
 
 // Helper to send status update emails
 export function useSendStatusEmail() {
   const sendEmail = useSendVendorEmail();
 
   return useMutation({
     mutationFn: async ({
       email_type,
       to_email,
       company_name,
       contact_name,
       vendor_code,
       rejection_reason,
       new_status,
     }: {
       email_type: 'status_update' | 'approved' | 'rejected';
       to_email: string;
       company_name: string;
       contact_name?: string;
       vendor_code?: string;
       rejection_reason?: string;
       new_status?: string;
     }) => {
       return sendEmail.mutateAsync({
         email_type,
         to_email,
         to_name: company_name,
         merge_data: {
           company_name,
           contact_name,
           vendor_code,
           rejection_reason,
           new_status,
         },
       });
     },
   });
 }