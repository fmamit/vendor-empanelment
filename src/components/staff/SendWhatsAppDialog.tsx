 import { useState, useEffect } from "react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { useSendWhatsApp, useWhatsAppTemplates } from "@/hooks/useWhatsAppNotifications";
 import { Loader2, MessageSquare } from "lucide-react";
 
 interface SendWhatsAppDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   vendorId: string;
   vendorName: string;
   phoneNumber: string;
   onMessageSent?: () => void;
 }
 
 export function SendWhatsAppDialog({
   open,
   onOpenChange,
   vendorId,
   vendorName,
   phoneNumber,
   onMessageSent,
 }: SendWhatsAppDialogProps) {
   const [messageType, setMessageType] = useState<"template" | "custom">("template");
   const [selectedTemplate, setSelectedTemplate] = useState("");
   const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
   const [customMessage, setCustomMessage] = useState("");
 
   const { data: templates, isLoading: templatesLoading } = useWhatsAppTemplates();
   const sendWhatsApp = useSendWhatsApp();
 
   // Reset form when dialog opens
   useEffect(() => {
     if (open) {
       setMessageType("template");
       setSelectedTemplate("");
       setTemplateVariables({});
       setCustomMessage("");
     }
   }, [open]);
 
   // Extract variables from selected template
   const selectedTemplateData = templates?.find((t) => t.template_name === selectedTemplate);
   const templateContent = selectedTemplateData?.content || "";
 
   // Find placeholders in template content ({{1}}, {{2}}, etc.)
   const placeholders = templateContent.match(/\{\{(\d+)\}\}/g) || [];
   const uniquePlaceholders = [...new Set(placeholders)].map((p) => p.replace(/[{}]/g, ""));
 
   const handleSend = async () => {
     try {
       if (messageType === "template") {
         if (!selectedTemplate) return;
         await sendWhatsApp.mutateAsync({
           vendor_id: vendorId,
           phone_number: phoneNumber,
           template_name: selectedTemplate,
           template_variables: templateVariables,
         });
       } else {
         if (!customMessage.trim()) return;
         await sendWhatsApp.mutateAsync({
           vendor_id: vendorId,
           phone_number: phoneNumber,
           message: customMessage,
         });
       }
 
       onOpenChange(false);
       onMessageSent?.();
     } catch (error) {
       // Error handled in hook
     }
   };
 
   // Generate preview of message with variables replaced
   const getMessagePreview = () => {
     if (messageType === "custom") return customMessage;
     if (!templateContent) return "";
 
     let preview = templateContent;
     Object.entries(templateVariables).forEach(([key, value]) => {
       preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value || `[${key}]`);
     });
     return preview;
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-[500px]">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <MessageSquare className="h-5 w-5 text-green-600" />
             Send WhatsApp to {vendorName}
           </DialogTitle>
           <DialogDescription>
             Send a WhatsApp message to {phoneNumber}
           </DialogDescription>
         </DialogHeader>
 
         <div className="space-y-4">
           {/* Message Type Selection */}
           <div className="space-y-2">
             <Label>Message Type</Label>
             <Select
               value={messageType}
               onValueChange={(value: "template" | "custom") => setMessageType(value)}
             >
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="template">Use Template</SelectItem>
                 <SelectItem value="custom">Custom Message</SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           {messageType === "template" ? (
             <>
               {/* Template Selection */}
               <div className="space-y-2">
                 <Label>Select Template</Label>
                 <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                   <SelectTrigger>
                     <SelectValue placeholder="Choose a template..." />
                   </SelectTrigger>
                   <SelectContent>
                     {templatesLoading ? (
                       <SelectItem value="loading" disabled>
                         Loading...
                       </SelectItem>
                     ) : templates?.length === 0 ? (
                       <SelectItem value="none" disabled>
                         No templates available
                       </SelectItem>
                     ) : (
                       templates?.map((t) => (
                         <SelectItem key={t.id} value={t.template_name}>
                           {t.template_name} ({t.category})
                         </SelectItem>
                       ))
                     )}
                   </SelectContent>
                 </Select>
               </div>
 
               {/* Template Variables */}
               {uniquePlaceholders.length > 0 && (
                 <div className="space-y-2">
                   <Label>Template Variables</Label>
                   {uniquePlaceholders.map((placeholder) => (
                     <div key={placeholder} className="flex items-center gap-2">
                       <span className="text-sm text-muted-foreground w-16">
                         {`{{${placeholder}}}`}
                       </span>
                       <Input
                         placeholder={`Value for ${placeholder}`}
                         value={templateVariables[placeholder] || ""}
                         onChange={(e) =>
                           setTemplateVariables((prev) => ({
                             ...prev,
                             [placeholder]: e.target.value,
                           }))
                         }
                       />
                     </div>
                   ))}
                 </div>
               )}
             </>
           ) : (
             /* Custom Message Input */
             <div className="space-y-2">
               <Label>Message</Label>
               <Textarea
                 placeholder="Type your message..."
                 value={customMessage}
                 onChange={(e) => setCustomMessage(e.target.value)}
                 rows={4}
               />
               <p className="text-xs text-muted-foreground">
                 Note: Custom messages may require an active conversation window (24-hour rule).
               </p>
             </div>
           )}
 
           {/* Message Preview */}
           {getMessagePreview() && (
             <div className="space-y-2">
               <Label>Preview</Label>
               <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                 {getMessagePreview()}
               </div>
             </div>
           )}
         </div>
 
         <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)}>
             Cancel
           </Button>
           <Button
             onClick={handleSend}
             disabled={
               sendWhatsApp.isPending ||
               (messageType === "template" && !selectedTemplate) ||
               (messageType === "custom" && !customMessage.trim())
             }
             className="bg-green-600 hover:bg-green-700"
           >
             {sendWhatsApp.isPending ? (
               <>
                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                 Sending...
               </>
             ) : (
               <>
                 <MessageSquare className="h-4 w-4 mr-2" />
                 Send WhatsApp
               </>
             )}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }