 import { useState, useEffect } from "react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Switch } from "@/components/ui/switch";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { 
   useWhatsAppSettings, 
   useUpdateWhatsAppSettings, 
   useSyncWhatsAppTemplates 
 } from "@/hooks/useWhatsAppNotifications";
 import { Loader2, MessageSquare, RefreshCw, Save } from "lucide-react";
 
 export function WhatsAppSettingsForm() {
   const { data: settings, isLoading } = useWhatsAppSettings();
   const updateSettings = useUpdateWhatsAppSettings();
   const syncTemplates = useSyncWhatsAppTemplates();
 
   const [formData, setFormData] = useState({
     exotel_sid: "",
     exotel_api_key: "",
     exotel_api_token: "",
     exotel_subdomain: "api.exotel.com",
     whatsapp_source_number: "",
     waba_id: "",
     is_active: false,
   });
 
   // Load existing settings into form
   useEffect(() => {
     if (settings) {
       setFormData({
         exotel_sid: settings.exotel_sid || "",
         exotel_api_key: settings.exotel_api_key || "",
         exotel_api_token: settings.exotel_api_token || "",
         exotel_subdomain: settings.exotel_subdomain || "api.exotel.com",
         whatsapp_source_number: settings.whatsapp_source_number || "",
         waba_id: settings.waba_id || "",
         is_active: settings.is_active || false,
       });
     }
   }, [settings]);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     await updateSettings.mutateAsync(formData);
   };
 
   const handleSyncTemplates = async () => {
     await syncTemplates.mutateAsync();
   };
 
   if (isLoading) {
     return (
       <Card>
         <CardContent className="flex items-center justify-center py-8">
           <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card>
       <CardHeader>
         <CardTitle className="flex items-center gap-2">
           <MessageSquare className="h-5 w-5 text-green-600" />
           WhatsApp Integration (Exotel)
         </CardTitle>
         <CardDescription>
           Configure your Exotel WhatsApp Business API credentials to enable WhatsApp messaging.
         </CardDescription>
       </CardHeader>
       <CardContent>
         <form onSubmit={handleSubmit} className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor="exotel_sid">Exotel Account SID</Label>
               <Input
                 id="exotel_sid"
                 value={formData.exotel_sid}
                 onChange={(e) => setFormData((prev) => ({ ...prev, exotel_sid: e.target.value }))}
                 placeholder="Your Exotel SID"
               />
             </div>
 
             <div className="space-y-2">
               <Label htmlFor="exotel_subdomain">API Subdomain</Label>
               <Input
                 id="exotel_subdomain"
                 value={formData.exotel_subdomain}
                 onChange={(e) => setFormData((prev) => ({ ...prev, exotel_subdomain: e.target.value }))}
                 placeholder="api.exotel.com"
               />
             </div>
 
             <div className="space-y-2">
               <Label htmlFor="exotel_api_key">API Key</Label>
               <Input
                 id="exotel_api_key"
                 value={formData.exotel_api_key}
                 onChange={(e) => setFormData((prev) => ({ ...prev, exotel_api_key: e.target.value }))}
                 placeholder="API Key"
               />
             </div>
 
             <div className="space-y-2">
               <Label htmlFor="exotel_api_token">API Token</Label>
               <Input
                 id="exotel_api_token"
                 type="password"
                 value={formData.exotel_api_token}
                 onChange={(e) => setFormData((prev) => ({ ...prev, exotel_api_token: e.target.value }))}
                 placeholder="API Token (Secret)"
               />
             </div>
 
             <div className="space-y-2">
               <Label htmlFor="whatsapp_source_number">WhatsApp Source Number</Label>
               <Input
                 id="whatsapp_source_number"
                 value={formData.whatsapp_source_number}
                 onChange={(e) => setFormData((prev) => ({ ...prev, whatsapp_source_number: e.target.value }))}
                 placeholder="+919876543210"
               />
             </div>
 
             <div className="space-y-2">
               <Label htmlFor="waba_id">WABA ID</Label>
               <Input
                 id="waba_id"
                 value={formData.waba_id}
                 onChange={(e) => setFormData((prev) => ({ ...prev, waba_id: e.target.value }))}
                 placeholder="WhatsApp Business Account ID"
               />
             </div>
           </div>
 
           <div className="flex items-center gap-2 pt-2">
             <Switch
               id="is_active"
               checked={formData.is_active}
               onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
             />
             <Label htmlFor="is_active">Enable WhatsApp Integration</Label>
           </div>
 
           <div className="flex gap-3 pt-4">
             <Button type="submit" disabled={updateSettings.isPending}>
               {updateSettings.isPending ? (
                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
               ) : (
                 <Save className="h-4 w-4 mr-2" />
               )}
               Save Settings
             </Button>
 
             <Button
               type="button"
               variant="outline"
               onClick={handleSyncTemplates}
               disabled={syncTemplates.isPending || !formData.is_active}
             >
               {syncTemplates.isPending ? (
                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
               ) : (
                 <RefreshCw className="h-4 w-4 mr-2" />
               )}
               Sync Templates
             </Button>
           </div>
 
           <p className="text-xs text-muted-foreground mt-2">
             Webhook URL (configure in Exotel):{" "}
             <code className="bg-muted px-1 py-0.5 rounded">
               {window.location.origin.replace("localhost:8080", "knsdcrnslpaprfilwvda.supabase.co")}/functions/v1/whatsapp-webhook
             </code>
           </p>
         </form>
       </CardContent>
     </Card>
   );
 }