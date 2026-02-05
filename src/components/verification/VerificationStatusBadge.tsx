 import { Badge } from "@/components/ui/badge";
 import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 interface VerificationStatusBadgeProps {
   status: "pending" | "in_progress" | "success" | "failed" | null | undefined;
   showLabel?: boolean;
   className?: string;
 }
 
 export function VerificationStatusBadge({ 
   status, 
   showLabel = true,
   className 
 }: VerificationStatusBadgeProps) {
   if (!status) {
     return (
       <Badge variant="outline" className={cn("text-muted-foreground", className)}>
         <Clock className="h-3 w-3 mr-1" />
         {showLabel && "Not Verified"}
       </Badge>
     );
   }
 
   switch (status) {
     case "pending":
       return (
         <Badge variant="outline" className={cn("text-muted-foreground", className)}>
           <Clock className="h-3 w-3 mr-1" />
           {showLabel && "Pending"}
         </Badge>
       );
     case "in_progress":
       return (
         <Badge variant="outline" className={cn("text-warning", className)}>
           <Loader2 className="h-3 w-3 mr-1 animate-spin" />
           {showLabel && "In Progress"}
         </Badge>
       );
     case "success":
       return (
         <Badge className={cn("bg-success/20 text-success border-success/30", className)}>
           <CheckCircle2 className="h-3 w-3 mr-1" />
           {showLabel && "Verified"}
         </Badge>
       );
     case "failed":
       return (
         <Badge variant="destructive" className={className}>
           <XCircle className="h-3 w-3 mr-1" />
           {showLabel && "Failed"}
         </Badge>
       );
     default:
       return null;
   }
 }