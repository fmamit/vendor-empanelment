 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
 import { Resend } from "https://esm.sh/resend@2.0.0";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
 };
 
 type EmailType = 'invitation' | 'status_update' | 'approved' | 'rejected';
 
 interface SendEmailRequest {
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
 
 function getEmailSubject(type: EmailType, data: SendEmailRequest['merge_data']): string {
   switch (type) {
     case 'invitation':
       return "You're invited to register as a vendor with Capital India";
     case 'status_update':
       return "Your vendor application status has been updated";
     case 'approved':
       return "Congratulations! Your vendor application has been approved";
     case 'rejected':
       return "Update on your vendor application";
     default:
       return "Notification from Capital India";
   }
 }
 
 function getEmailHtml(type: EmailType, data: SendEmailRequest['merge_data']): string {
   const headerStyle = `
     background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8a 100%);
     color: white;
     padding: 30px;
     text-align: center;
   `;
   
   const buttonStyle = `
     display: inline-block;
     background-color: #2563eb;
     color: white;
     padding: 14px 28px;
     text-decoration: none;
     border-radius: 6px;
     font-weight: 600;
     margin: 20px 0;
   `;
 
   const footerStyle = `
     background-color: #f8fafc;
     padding: 20px;
     text-align: center;
     color: #64748b;
     font-size: 12px;
     border-top: 1px solid #e2e8f0;
   `;
 
   let content = '';
 
   switch (type) {
     case 'invitation':
       content = `
         <h2 style="color: #1e3a5f; margin-bottom: 20px;">Welcome to Capital India Vendor Portal</h2>
         <p>Dear ${data.contact_name || 'Partner'},</p>
         <p>You have been invited to register <strong>${data.company_name}</strong> as a vendor with Capital India.</p>
         <p>Please click the button below to complete your registration:</p>
         <a href="${data.registration_link}" style="${buttonStyle}">Complete Registration</a>
         <p style="color: #ef4444; font-size: 14px; margin-top: 20px;">
           <strong>Note:</strong> This link will expire in 7 days.
         </p>
         <p style="margin-top: 20px;">If you have any questions, please contact our vendor support team.</p>
       `;
       break;
 
     case 'status_update':
       content = `
         <h2 style="color: #1e3a5f; margin-bottom: 20px;">Application Status Update</h2>
         <p>Dear ${data.contact_name || 'Partner'},</p>
         <p>Your vendor application for <strong>${data.company_name}</strong> has been updated.</p>
         <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
           <p style="margin: 0; color: #1e40af;"><strong>New Status:</strong> ${data.new_status}</p>
         </div>
         <p>Our team is reviewing your application. You will receive another notification once the review is complete.</p>
       `;
       break;
 
     case 'approved':
       content = `
         <h2 style="color: #16a34a; margin-bottom: 20px;">🎉 Congratulations!</h2>
         <p>Dear ${data.contact_name || 'Partner'},</p>
         <p>We are pleased to inform you that your vendor application for <strong>${data.company_name}</strong> has been <strong style="color: #16a34a;">approved</strong>!</p>
         <div style="background-color: #f0fdf4; border: 1px solid #86efac; padding: 20px; margin: 20px 0; border-radius: 8px;">
           <p style="margin: 0; font-size: 18px; color: #166534;"><strong>Your Vendor Code:</strong></p>
           <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #15803d; font-family: monospace;">${data.vendor_code}</p>
         </div>
         <p>Please save this code for your records. You can now log in to the vendor portal to manage your account.</p>
         <p style="margin-top: 20px;">Welcome aboard! We look forward to a successful partnership.</p>
       `;
       break;
 
     case 'rejected':
       content = `
         <h2 style="color: #dc2626; margin-bottom: 20px;">Application Update</h2>
         <p>Dear ${data.contact_name || 'Partner'},</p>
         <p>We regret to inform you that your vendor application for <strong>${data.company_name}</strong> could not be approved at this time.</p>
         ${data.rejection_reason ? `
           <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
             <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong> ${data.rejection_reason}</p>
           </div>
         ` : ''}
         <p>If you believe this decision was made in error or would like to provide additional documentation, please contact our vendor support team.</p>
         <p style="margin-top: 20px;">Thank you for your interest in partnering with Capital India.</p>
       `;
       break;
   }
 
   return `
     <!DOCTYPE html>
     <html>
     <head>
       <meta charset="utf-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
     </head>
     <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
       <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: white;">
         <tr>
           <td style="${headerStyle}">
             <h1 style="margin: 0; font-size: 24px;">Capital India</h1>
             <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Vendor Management Portal</p>
           </td>
         </tr>
         <tr>
           <td style="padding: 30px;">
             ${content}
           </td>
         </tr>
         <tr>
           <td style="${footerStyle}">
             <p style="margin: 0;">This is an automated message from Capital India Vendor Portal.</p>
             <p style="margin: 10px 0 0 0;">Please do not reply to this email.</p>
           </td>
         </tr>
       </table>
     </body>
     </html>
   `;
 }
 
 serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const resendApiKey = Deno.env.get('RESEND_API_KEY');
     if (!resendApiKey) {
       throw new Error('RESEND_API_KEY not configured');
     }
 
     const { email_type, to_email, to_name, merge_data }: SendEmailRequest = await req.json();
 
     // Validation
     if (!email_type || !to_email) {
       return new Response(
         JSON.stringify({ error: 'Missing required fields: email_type and to_email' }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     const resend = new Resend(resendApiKey);
     
     const subject = getEmailSubject(email_type, merge_data);
     const html = getEmailHtml(email_type, merge_data);
 
     console.log(`Sending ${email_type} email to ${to_email}`);
 
     const emailResponse = await resend.emails.send({
        from: 'Capital India <noreply@in-sync.co.in>',
       to: [to_email],
       subject: subject,
       html: html,
     });
 
     if (emailResponse.error) {
       console.error('Resend error:', emailResponse.error);
       throw new Error(emailResponse.error.message);
     }
 
     console.log('Email sent successfully:', emailResponse.data?.id);
 
     return new Response(
       JSON.stringify({ success: true, email_id: emailResponse.data?.id }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   } catch (error: any) {
     console.error('Error sending email:', error);
     return new Response(
       JSON.stringify({ error: error.message }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });