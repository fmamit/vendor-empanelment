 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 // Exotel status code mapping
 const EXOTEL_STATUS_MAP: Record<number, string> = {
   30001: 'sent',
   30002: 'delivered',
   30003: 'read',
   30004: 'failed',
   30005: 'failed', // expired
 };
 
 // Normalize phone number with + prefix
 function normalizePhoneNumber(phone: string): string {
   let cleaned = phone.replace(/[^\d+]/g, '');
   if (!cleaned.startsWith('+')) {
     if (cleaned.length === 10) cleaned = '+91' + cleaned;
     else if (cleaned.startsWith('91') && cleaned.length === 12) cleaned = '+' + cleaned;
     else cleaned = '+' + cleaned;
   }
   return cleaned;
 }
 
 // Parse Exotel nested payload format
 function parseExotelPayload(payload: any) {
   if (payload?.whatsapp?.messages?.[0]) {
     const msg = payload.whatsapp.messages[0];
 
     let type = 'unknown';
     if (msg.callback_type === 'incoming_message') type = 'inbound';
     else if (msg.callback_type === 'dlr') type = 'dlr';
 
     // Extract body from content
     let body = '';
     const contentType = msg.content?.type;
 
     if (contentType === 'text') {
       body = msg.content.text?.body || '';
     } else if (contentType === 'button') {
       body = msg.content.button?.text || '';
     } else if (['image', 'document', 'video', 'audio', 'sticker'].includes(contentType)) {
       body = msg.content[contentType]?.caption || `[${contentType}]`;
     }
 
     // Map status code for DLR
     let status = msg.exo_status_code ? (EXOTEL_STATUS_MAP[msg.exo_status_code] || 'unknown') : '';
 
     return {
       type,
       sid: msg.sid || '',
       from: msg.from || '',
       to: msg.to || '',
       body,
       status,
       profileName: msg.profile_name || '',
       timestamp: msg.timestamp,
       errorMessage: msg.description,
     };
   }
   return null;
 }
 
 Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const supabaseClient = createClient(
       Deno.env.get('SUPABASE_URL') ?? '',
       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
     );
 
     const payload = await req.json();
     console.log('Received WhatsApp webhook:', JSON.stringify(payload));
 
     const normalizedMsg = parseExotelPayload(payload);
     if (!normalizedMsg) {
       console.log('Invalid or unrecognized payload format');
       return new Response(
         JSON.stringify({ success: true, message: 'Webhook received but payload not recognized' }),
         { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     // Handle INBOUND messages
     if (normalizedMsg.type === 'inbound' && normalizedMsg.body) {
       const phoneNumber = normalizePhoneNumber(normalizedMsg.from);
 
       // Find vendor by phone number
       const { data: vendors } = await supabaseClient
         .from('vendors')
         .select('id')
         .or(`primary_mobile.eq.${phoneNumber},primary_mobile.eq.${phoneNumber.replace('+91', '')},primary_mobile.eq.${phoneNumber.replace('+', '')}`)
         .limit(1);
 
       const vendorId = vendors?.[0]?.id || null;
 
       // Store inbound message
       const { error: insertError } = await supabaseClient.from('whatsapp_messages').insert({
         vendor_id: vendorId,
         direction: 'inbound',
         message_content: normalizedMsg.body,
         phone_number: phoneNumber,
         exotel_message_id: normalizedMsg.sid,
         status: 'received',
         sent_at: normalizedMsg.timestamp ? new Date(normalizedMsg.timestamp) : new Date(),
       });
 
       if (insertError) {
         console.error('Failed to store inbound message:', insertError);
       }
 
       return new Response(
         JSON.stringify({ success: true, message: 'Inbound message stored' }),
         { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     // Handle DELIVERY REPORTS (DLR)
     if (normalizedMsg.type === 'dlr' && normalizedMsg.status && normalizedMsg.sid) {
       const timestamp = normalizedMsg.timestamp ? new Date(normalizedMsg.timestamp) : new Date();
 
       // Find message by exotel_message_id
       const { data: message } = await supabaseClient
         .from('whatsapp_messages')
         .select('id, status, delivered_at')
         .eq('exotel_message_id', normalizedMsg.sid)
         .single();
 
       if (message) {
         const updateData: any = { status: normalizedMsg.status };
 
         if (normalizedMsg.status === 'delivered' || normalizedMsg.status === 'sent') {
           updateData.delivered_at = timestamp.toISOString();
         } else if (normalizedMsg.status === 'read') {
           updateData.read_at = timestamp.toISOString();
           if (!message.delivered_at) updateData.delivered_at = timestamp.toISOString();
         } else if (normalizedMsg.status === 'failed') {
           updateData.error_message = normalizedMsg.errorMessage || 'Delivery failed';
         }
 
         const { error: updateError } = await supabaseClient
           .from('whatsapp_messages')
           .update(updateData)
           .eq('id', message.id);
 
         if (updateError) {
           console.error('Failed to update DLR:', updateError);
         }
       }
 
       return new Response(
         JSON.stringify({ success: true, message: 'DLR processed' }),
         { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     return new Response(
       JSON.stringify({ success: true, message: 'Webhook received' }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   } catch (error: any) {
     console.error('Error in whatsapp-webhook:', error);
     return new Response(
       JSON.stringify({ error: error.message }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });