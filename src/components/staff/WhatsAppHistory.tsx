 import { useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useQueryClient } from "@tanstack/react-query";
 import { useWhatsAppHistory, WhatsAppMessage } from "@/hooks/useWhatsAppNotifications";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { 
   MessageSquare, 
   Check, 
   CheckCheck, 
   Clock, 
   XCircle, 
   ArrowUpRight, 
   ArrowDownLeft,
   Loader2
 } from "lucide-react";
 import { format, formatDistanceToNow } from "date-fns";
 
 interface WhatsAppHistoryProps {
   vendorId: string;
 }
 
 const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
   pending: { icon: <Clock className="h-3 w-3" />, color: "bg-muted", label: "Pending" },
   sent: { icon: <Check className="h-3 w-3" />, color: "bg-blue-500/20 text-blue-600", label: "Sent" },
   delivered: { icon: <CheckCheck className="h-3 w-3" />, color: "bg-green-500/20 text-green-600", label: "Delivered" },
   read: { icon: <CheckCheck className="h-3 w-3" />, color: "bg-green-600/20 text-green-700", label: "Read" },
   failed: { icon: <XCircle className="h-3 w-3" />, color: "bg-destructive/20 text-destructive", label: "Failed" },
   received: { icon: <ArrowDownLeft className="h-3 w-3" />, color: "bg-primary/20 text-primary", label: "Received" },
 };
 
 export function WhatsAppHistory({ vendorId }: WhatsAppHistoryProps) {
   const queryClient = useQueryClient();
   const { data: messages, isLoading } = useWhatsAppHistory(vendorId);
 
   // Subscribe to realtime updates
   useEffect(() => {
     const channel = supabase
       .channel(`whatsapp-${vendorId}`)
       .on(
         "postgres_changes",
         {
           event: "*",
           schema: "public",
           table: "whatsapp_messages",
           filter: `vendor_id=eq.${vendorId}`,
         },
         () => {
           queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", vendorId] });
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [vendorId, queryClient]);
 
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
       <CardHeader className="pb-3">
         <CardTitle className="text-base flex items-center gap-2">
           <MessageSquare className="h-4 w-4 text-green-600" />
           WhatsApp Messages
         </CardTitle>
       </CardHeader>
       <CardContent>
         <ScrollArea className="h-[300px] pr-4">
           {messages && messages.length > 0 ? (
             <div className="space-y-3">
               {messages.map((msg) => (
                 <MessageBubble key={msg.id} message={msg} />
               ))}
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
               <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
               <p className="text-sm">No messages yet</p>
             </div>
           )}
         </ScrollArea>
       </CardContent>
     </Card>
   );
 }
 
 function MessageBubble({ message }: { message: WhatsAppMessage }) {
   const isOutbound = message.direction === "outbound";
   const statusConfig = STATUS_CONFIG[message.status] || STATUS_CONFIG.pending;
 
   return (
     <div className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
       <div
         className={`max-w-[80%] rounded-lg p-3 ${
           isOutbound
             ? "bg-green-600 text-white rounded-br-none"
             : "bg-muted rounded-bl-none"
         }`}
       >
         {/* Direction indicator */}
         <div className="flex items-center gap-1 mb-1">
           {isOutbound ? (
             <ArrowUpRight className="h-3 w-3 opacity-70" />
           ) : (
             <ArrowDownLeft className="h-3 w-3 opacity-70" />
           )}
           <span className="text-xs opacity-70">
             {isOutbound ? "Sent" : "Received"}
           </span>
         </div>
 
         {/* Message content */}
         <p className="text-sm whitespace-pre-wrap">
           {message.message_content || `[Template: ${message.template_name}]`}
         </p>
 
         {/* Template name if used */}
         {message.template_name && (
           <span className={`text-xs ${isOutbound ? "opacity-70" : "text-muted-foreground"} mt-1 block`}>
             Template: {message.template_name}
           </span>
         )}
 
         {/* Error message if failed */}
         {message.error_message && (
           <p className="text-xs text-red-300 mt-1">{message.error_message}</p>
         )}
 
         {/* Footer with timestamp and status */}
         <div className="flex items-center justify-between gap-2 mt-2">
           <span className={`text-xs ${isOutbound ? "opacity-70" : "text-muted-foreground"}`}>
             {message.sent_at
               ? formatDistanceToNow(new Date(message.sent_at), { addSuffix: true })
               : format(new Date(message.created_at), "PPp")}
           </span>
 
           {isOutbound && (
             <Badge
               variant="outline"
               className={`text-xs py-0 h-5 ${
                 isOutbound ? "border-white/30 text-white" : statusConfig.color
               }`}
             >
               {statusConfig.icon}
               <span className="ml-1">{statusConfig.label}</span>
             </Badge>
           )}
         </div>
       </div>
     </div>
   );
 }