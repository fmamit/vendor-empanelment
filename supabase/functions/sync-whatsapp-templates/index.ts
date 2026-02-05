 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const authHeader = req.headers.get('Authorization');
     if (!authHeader) {
       throw new Error('No Authorization header');
     }
 
     const token = authHeader.replace('Bearer ', '');
 
     const supabaseClient = createClient(
       Deno.env.get('SUPABASE_URL') ?? '',
       Deno.env.get('SUPABASE_ANON_KEY') ?? '',
       {
         global: { headers: { Authorization: authHeader } },
         auth: { persistSession: false },
       }
     );
 
     // Authenticate user
     const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
     if (userError || !user) {
       throw new Error('Authentication failed');
     }
 
     // Get WhatsApp settings
     const { data: settings, error: settingsError } = await supabaseClient
       .from('whatsapp_settings')
       .select('exotel_api_key, exotel_api_token, exotel_subdomain, exotel_sid, waba_id')
       .eq('is_active', true)
       .single();
 
     if (settingsError || !settings) {
       throw new Error('WhatsApp not configured');
     }
 
     // Fetch templates from Exotel
     const exotelSubdomain = settings.exotel_subdomain || 'api.exotel.com';
     const exotelUrl = `https://${exotelSubdomain}/v2/accounts/${settings.exotel_sid}/templates?waba_id=${settings.waba_id}`;
 
     console.log('Fetching templates from Exotel:', exotelUrl);
 
     const response = await fetch(exotelUrl, {
       method: 'GET',
       headers: {
         'Authorization': `Basic ${btoa(`${settings.exotel_api_key}:${settings.exotel_api_token}`)}`,
       },
     });
 
     const responseText = await response.text();
     console.log('Exotel templates response:', responseText);
 
     let exotelData: any;
     try {
       exotelData = JSON.parse(responseText);
     } catch {
       throw new Error('Failed to parse Exotel response');
     }
 
     const templates = exotelData?.response?.whatsapp?.templates || [];
     let syncedCount = 0;
 
     // Upsert each template
     for (const template of templates) {
       const templateData = template.data || template;
       
       // Extract body content from components
       let content = '';
       const components = templateData.components || [];
       const bodyComponent = components.find((c: any) => c.type === 'BODY');
       if (bodyComponent) {
         content = bodyComponent.text || '';
       }
 
       // Map status
       let status = 'pending';
       if (templateData.status === 'APPROVED') status = 'approved';
       else if (templateData.status === 'REJECTED') status = 'rejected';
 
       const { error: upsertError } = await supabaseClient
         .from('whatsapp_templates')
         .upsert({
           template_name: templateData.name,
           category: templateData.category || 'UTILITY',
           content: content,
           status: status,
           is_active: status === 'approved',
           updated_at: new Date().toISOString(),
         }, { 
           onConflict: 'template_name' 
         });
 
       if (!upsertError) {
         syncedCount++;
       } else {
         console.error('Failed to upsert template:', templateData.name, upsertError);
       }
     }
 
     return new Response(
       JSON.stringify({ 
         success: true, 
         message: `Synced ${syncedCount} templates`,
         count: syncedCount 
       }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   } catch (error: any) {
     console.error('Error in sync-whatsapp-templates:', error);
     return new Response(
       JSON.stringify({ success: false, error: error.message }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });