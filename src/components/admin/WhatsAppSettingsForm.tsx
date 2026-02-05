 import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Switch } from "@/components/ui/switch";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
 import { 
   useWhatsAppSettings, 
   useUpdateWhatsAppSettings, 
   useSyncWhatsAppTemplates 
 } from "@/hooks/useWhatsAppNotifications";
import { Loader2, MessageSquare, RefreshCw, Save, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
 
 export function WhatsAppSettingsForm() {
   const { data: settings, isLoading } = useWhatsAppSettings();
   const updateSettings = useUpdateWhatsAppSettings();
   const syncTemplates = useSyncWhatsAppTemplates();

  // Fetch templates
  const { data: templates, isLoading: templatesLoading, refetch: refetchTemplates } = useQuery({
    queryKey: ["whatsapp-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_templates")
        .select("*")
        .order("template_name");
      if (error) throw error;
      return data;
    },
  });
 
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
    refetchTemplates();
   };

  const getStatusIcon = (status: string | null) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string | null): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return "default";
      case "REJECTED":
        return "destructive";
      default:
        return "secondary";
    }
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
    <>
      <Card>
       <CardHeader>
         <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
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
    {/* Templates Section */}
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          WhatsApp Templates
        </CardTitle>
        <CardDescription>
          Templates synced from your Exotel/WhatsApp Business account. Click "Sync Templates" above to fetch the latest.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {templatesLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : templates && templates.length > 0 ? (
          <div className="space-y-4">
            {templates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{template.template_name}</p>
                      <Badge variant={getStatusVariant(template.status)} className="flex items-center gap-1">
                        {getStatusIcon(template.status)}
                        {template.status || "Unknown"}
                      </Badge>
                      {template.category && (
                        <Badge variant="outline">{template.category}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                      {template.content}
                    </p>
                    {template.variables && Array.isArray(template.variables) && template.variables.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="text-xs text-muted-foreground">Variables:</span>
                        {(template.variables as string[]).map((v, i) => (
                          <code key={i} className="text-xs bg-muted px-1 py-0.5 rounded">{`{{${i + 1}}}`}</code>
                        ))}
                      </div>
                    )}
                  </div>
                  <Switch
                    checked={template.is_active ?? true}
                    disabled
                    aria-label="Template active status"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No templates found.</p>
            <p className="text-sm mt-1">
              {formData.is_active 
                ? "Click 'Sync Templates' to fetch templates from Exotel." 
                : "Enable WhatsApp integration and save settings first."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
    </>
   );
 }