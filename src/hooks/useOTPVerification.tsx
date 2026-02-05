 import { useMutation } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 
 interface SendOTPResponse {
   success: boolean;
   message?: string;
   phone_last_4?: string;
   error?: string;
 }
 
 interface VerifyOTPResponse {
   success: boolean;
   verified: boolean;
   message?: string;
   error?: string;
 }
 
 export function useSendOTP() {
   return useMutation({
     mutationFn: async (phone_number: string): Promise<SendOTPResponse> => {
       const { data, error } = await supabase.functions.invoke("send-otp", {
         body: { phone_number },
       });
 
       if (error) throw error;
       if (!data.success) throw new Error(data.error || "Failed to send OTP");
       
       return data;
     },
   });
 }
 
 export function useVerifyOTP() {
   return useMutation({
     mutationFn: async ({ 
       phone_number, 
       otp_code 
     }: { 
       phone_number: string; 
       otp_code: string 
     }): Promise<VerifyOTPResponse> => {
       const { data, error } = await supabase.functions.invoke("verify-otp", {
         body: { phone_number, otp_code },
       });
 
       if (error) throw error;
       return data;
     },
   });
 }