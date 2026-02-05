 import { useState, useMemo } from "react";
 import { StaffLayout } from "@/components/layout/StaffLayout";
 import { useInvitationsList } from "@/hooks/useVendorInvitations";
 import { useSendInvitationEmail } from "@/hooks/useEmailNotifications";
 import { useSendInvitationWhatsApp } from "@/hooks/useWhatsAppNotifications";
 import { CreateInvitationDialog } from "@/components/staff/CreateInvitationDialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Badge } from "@/components/ui/badge";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import {
   UserPlus,
   Search,
   Copy,
   Mail,
   MessageSquare,
   MoreHorizontal,
   Clock,
   CheckCircle2,
   XCircle,
   Loader2,
   RefreshCw,
 } from "lucide-react";
 import { format, formatDistanceToNow } from "date-fns";
 import { toast } from "sonner";
 
 type InvitationStatus = "pending" | "accepted" | "expired";
 
 interface InvitationWithStatus {
   id: string;
   token: string;
   company_name: string;
   contact_phone: string;
   contact_email: string;
   category_id: string;
   created_at: string;
   expires_at: string;
   used_at: string | null;
   vendor_id: string | null;
   vendor_categories?: {
     id: string;
     name: string;
     description: string | null;
   };
   status: InvitationStatus;
 }
 
 function getInvitationStatus(invitation: {
   used_at: string | null;
   expires_at: string;
 }): InvitationStatus {
   if (invitation.used_at) return "accepted";
   if (new Date(invitation.expires_at) < new Date()) return "expired";
   return "pending";
 }
 
 function StatusBadge({ status }: { status: InvitationStatus }) {
   switch (status) {
     case "accepted":
       return (
         <Badge variant="default" className="bg-primary hover:bg-primary/90">
           <CheckCircle2 className="h-3 w-3 mr-1" />
           Accepted
         </Badge>
       );
     case "expired":
       return (
         <Badge variant="destructive">
           <XCircle className="h-3 w-3 mr-1" />
           Expired
         </Badge>
       );
     case "pending":
       return (
         <Badge variant="secondary">
           <Clock className="h-3 w-3 mr-1" />
           Pending
         </Badge>
       );
   }
 }
 
 export default function VendorInvitations() {
   const [searchQuery, setSearchQuery] = useState("");
   const [activeTab, setActiveTab] = useState<"all" | InvitationStatus>("all");
   const [resendingEmail, setResendingEmail] = useState<string | null>(null);
   const [resendingWhatsApp, setResendingWhatsApp] = useState<string | null>(null);
 
   const { data: invitations, isLoading, refetch } = useInvitationsList();
   const sendEmail = useSendInvitationEmail();
   const sendWhatsApp = useSendInvitationWhatsApp();
 
   // Compute status for each invitation
   const invitationsWithStatus: InvitationWithStatus[] = useMemo(() => {
     if (!invitations) return [];
     return invitations.map((inv) => ({
       ...inv,
       status: getInvitationStatus(inv),
     }));
   }, [invitations]);
 
   // Filter by tab and search
   const filteredInvitations = useMemo(() => {
     let filtered = invitationsWithStatus;
 
     if (activeTab !== "all") {
       filtered = filtered.filter((inv) => inv.status === activeTab);
     }
 
     if (searchQuery) {
       const query = searchQuery.toLowerCase();
       filtered = filtered.filter(
         (inv) =>
           inv.company_name.toLowerCase().includes(query) ||
           inv.contact_email.toLowerCase().includes(query) ||
           inv.contact_phone.includes(query)
       );
     }
 
     return filtered;
   }, [invitationsWithStatus, activeTab, searchQuery]);
 
   // Count by status
   const statusCounts = useMemo(() => {
     const counts = { all: 0, pending: 0, accepted: 0, expired: 0 };
     invitationsWithStatus.forEach((inv) => {
       counts.all++;
       counts[inv.status]++;
     });
     return counts;
   }, [invitationsWithStatus]);
 
   const getRegistrationLink = (token: string) => {
     const baseUrl = import.meta.env.VITE_PUBLIC_URL || "https://onboardly-path.lovable.app";
     return `${baseUrl}/vendor/register?token=${token}`;
   };
 
   const handleCopyLink = async (token: string) => {
     try {
       await navigator.clipboard.writeText(getRegistrationLink(token));
       toast.success("Link copied to clipboard");
     } catch {
       toast.error("Failed to copy link");
     }
   };
 
   const handleResendEmail = async (invitation: InvitationWithStatus) => {
     if (invitation.status !== "pending") {
       toast.error("Can only resend to pending invitations");
       return;
     }
 
     setResendingEmail(invitation.id);
     try {
       await sendEmail.mutateAsync({
         to_email: invitation.contact_email,
         company_name: invitation.company_name,
         registration_link: getRegistrationLink(invitation.token),
       });
     } catch {
       // Error handled by hook
     } finally {
       setResendingEmail(null);
     }
   };
 
   const handleResendWhatsApp = async (invitation: InvitationWithStatus) => {
     if (invitation.status !== "pending") {
       toast.error("Can only resend to pending invitations");
       return;
     }
 
     setResendingWhatsApp(invitation.id);
     try {
       await sendWhatsApp.mutateAsync({
         phone_number: invitation.contact_phone,
         company_name: invitation.company_name,
         registration_link: getRegistrationLink(invitation.token),
       });
       toast.success("WhatsApp invitation sent");
     } catch {
       toast.error("Failed to send WhatsApp");
     } finally {
       setResendingWhatsApp(null);
     }
   };
 
   return (
     <StaffLayout>
       <div className="space-y-6">
         {/* Header */}
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
           <div>
             <h1 className="text-2xl font-bold text-foreground">Vendor Invitations</h1>
             <p className="text-muted-foreground">
               Manage and track all vendor registration invitations
             </p>
           </div>
           <div className="flex gap-2">
             <Button variant="outline" size="icon" onClick={() => refetch()}>
               <RefreshCw className="h-4 w-4" />
             </Button>
             <CreateInvitationDialog
               trigger={
                 <Button>
                   <UserPlus className="h-4 w-4 mr-2" />
                   Invite Vendor
                 </Button>
               }
             />
           </div>
         </div>
 
         {/* Filters */}
         <Card>
           <CardHeader className="pb-3">
             <div className="flex flex-col sm:flex-row sm:items-center gap-4">
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input
                   placeholder="Search by company, email, or phone..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="pl-9"
                 />
               </div>
               <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                 <TabsList>
                   <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
                   <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
                   <TabsTrigger value="accepted">Accepted ({statusCounts.accepted})</TabsTrigger>
                   <TabsTrigger value="expired">Expired ({statusCounts.expired})</TabsTrigger>
                 </TabsList>
               </Tabs>
             </div>
           </CardHeader>
           <CardContent className="p-0">
             {isLoading ? (
               <div className="flex items-center justify-center py-12">
                 <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
               </div>
             ) : filteredInvitations.length === 0 ? (
               <div className="text-center py-12 text-muted-foreground">
                 {searchQuery || activeTab !== "all"
                   ? "No invitations match your filters"
                   : "No invitations yet. Create one to get started!"}
               </div>
             ) : (
               <div className="overflow-x-auto">
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Company</TableHead>
                       <TableHead>Category</TableHead>
                       <TableHead>Contact</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead>Created</TableHead>
                       <TableHead>Expires</TableHead>
                       <TableHead className="w-[50px]"></TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {filteredInvitations.map((invitation) => (
                       <TableRow key={invitation.id}>
                         <TableCell className="font-medium">
                           {invitation.company_name}
                         </TableCell>
                         <TableCell>
                           <Badge variant="outline">
                             {invitation.vendor_categories?.name || "Unknown"}
                           </Badge>
                         </TableCell>
                         <TableCell>
                           <div className="text-sm">
                             <div className="flex items-center gap-1">
                               <Mail className="h-3 w-3 text-muted-foreground" />
                               {invitation.contact_email}
                             </div>
                             <div className="flex items-center gap-1 text-muted-foreground">
                               <MessageSquare className="h-3 w-3" />
                               {invitation.contact_phone}
                             </div>
                           </div>
                         </TableCell>
                         <TableCell>
                           <StatusBadge status={invitation.status} />
                         </TableCell>
                         <TableCell className="text-sm text-muted-foreground">
                           {format(new Date(invitation.created_at), "MMM d, yyyy")}
                         </TableCell>
                         <TableCell className="text-sm text-muted-foreground">
                           {invitation.status === "accepted" ? (
                             <span className="text-green-600">Used</span>
                           ) : invitation.status === "expired" ? (
                             <span className="text-destructive">Expired</span>
                           ) : (
                             <span className="text-muted-foreground">
                               {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                             </span>
                           )}
                         </TableCell>
                         <TableCell>
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="icon">
                                 <MoreHorizontal className="h-4 w-4" />
                               </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end">
                               <DropdownMenuItem onClick={() => handleCopyLink(invitation.token)}>
                                 <Copy className="h-4 w-4 mr-2" />
                                 Copy Link
                               </DropdownMenuItem>
                               <DropdownMenuItem
                                 onClick={() => handleResendEmail(invitation)}
                                 disabled={invitation.status !== "pending" || resendingEmail === invitation.id}
                               >
                                 {resendingEmail === invitation.id ? (
                                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                 ) : (
                                   <Mail className="h-4 w-4 mr-2" />
                                 )}
                                 Resend Email
                               </DropdownMenuItem>
                               <DropdownMenuItem
                                 onClick={() => handleResendWhatsApp(invitation)}
                                 disabled={invitation.status !== "pending" || resendingWhatsApp === invitation.id}
                               >
                                 {resendingWhatsApp === invitation.id ? (
                                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                 ) : (
                                   <MessageSquare className="h-4 w-4 mr-2" />
                                 )}
                                 Resend WhatsApp
                               </DropdownMenuItem>
                             </DropdownMenuContent>
                           </DropdownMenu>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>
             )}
           </CardContent>
         </Card>
       </div>
     </StaffLayout>
   );
 }