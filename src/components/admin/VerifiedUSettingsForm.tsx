 import { useState, useEffect } from "react";
 import { useVerifiedUSettings, useUpdateVerifiedUSettings } from "@/hooks/useVerifiedUSettings";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Switch } from "@/components/ui/switch";
 import { Loader2, Shield, ExternalLink } from "lucide-react";
 
 export function VerifiedUSettingsForm() {
   const { data: settings, isLoading } = useVerifiedUSettings();
   const updateSettings = useUpdateVerifiedUSettings();
 
   const [formData, setFormData] = useState({
     api_token: "",
     company_id: "",
     api_base_url: "https://api.verifiedu.in",
     is_active: false,
   });
 
   useEffect(() => {
     if (settings) {
       setFormData({
         api_token: settings.api_token || "",
         company_id: settings.company_id || "",
         api_base_url: settings.api_base_url || "https://api.verifiedu.in",
         is_active: settings.is_active || false,
       });
     }
   }, [settings]);
 
   const handleSave = () => {
     updateSettings.mutate(formData);
   };
 
   if (isLoading) {
     return (
       <div className="flex justify-center py-8">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   return (
     <div className="space-y-6 max-w-2xl">
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Shield className="h-5 w-5" />
             VerifiedU API Settings
           </CardTitle>
           <CardDescription>
             Configure API credentials for PAN, Bank Account, and Aadhaar verification via VerifiedU.
             <a 
               href="https://verifiedu.in" 
               target="_blank" 
               rel="noopener noreferrer"
               className="ml-2 text-primary hover:underline inline-flex items-center gap-1"
             >
               Learn more <ExternalLink className="h-3 w-3" />
             </a>
           </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="space-y-2">
             <Label htmlFor="api-token">API Token</Label>
             <Input
               id="api-token"
               type="password"
               value={formData.api_token}
               onChange={(e) => setFormData(prev => ({ ...prev, api_token: e.target.value }))}
               placeholder="Enter your VerifiedU API token"
             />
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="company-id">Company ID</Label>
             <Input
               id="company-id"
               value={formData.company_id}
               onChange={(e) => setFormData(prev => ({ ...prev, company_id: e.target.value }))}
               placeholder="Enter your VerifiedU Company ID"
             />
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="base-url">API Base URL</Label>
             <Input
               id="base-url"
               value={formData.api_base_url}
               onChange={(e) => setFormData(prev => ({ ...prev, api_base_url: e.target.value }))}
               placeholder="https://api.verifiedu.in"
             />
             <p className="text-xs text-muted-foreground">
               Default: https://api.verifiedu.in
             </p>
           </div>
 
           <div className="flex items-center justify-between pt-4 border-t">
             <div>
               <Label htmlFor="is-active">Enable VerifiedU Integration</Label>
               <p className="text-sm text-muted-foreground">
                 When disabled, verification functions will use mock data
               </p>
             </div>
             <Switch
               id="is-active"
               checked={formData.is_active}
               onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
             />
           </div>
 
           <div className="pt-4">
             <Button 
               onClick={handleSave} 
               disabled={updateSettings.isPending}
               className="w-full sm:w-auto"
             >
               {updateSettings.isPending ? (
                 <Loader2 className="h-4 w-4 animate-spin mr-2" />
               ) : null}
               Save Settings
             </Button>
           </div>
         </CardContent>
       </Card>
 
       <Card>
         <CardHeader>
           <CardTitle className="text-base">Verification Types Supported</CardTitle>
         </CardHeader>
         <CardContent>
           <ul className="space-y-2 text-sm text-muted-foreground">
             <li className="flex items-center gap-2">
               <span className="h-2 w-2 rounded-full bg-primary" />
               <strong>PAN Verification:</strong> Validates PAN and returns name, DOB
             </li>
             <li className="flex items-center gap-2">
               <span className="h-2 w-2 rounded-full bg-primary" />
               <strong>Bank Account:</strong> Pennyless verification with account holder name
             </li>
             <li className="flex items-center gap-2">
               <span className="h-2 w-2 rounded-full bg-primary" />
               <strong>Aadhaar via DigiLocker:</strong> Secure consent-based verification
             </li>
           </ul>
         </CardContent>
       </Card>
     </div>
   );
 }