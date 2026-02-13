import { useState, useEffect } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { useAuth } from "@/hooks/useAuth";
import { useReferralCode } from "@/hooks/useReferralCode";
import { ReferralLinkCard } from "@/components/staff/ReferralLinkCard";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Send,
  Loader2,
  Mail,
  Building2,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { z } from "zod";

const inviteSchema = z.object({
  company_name: z.string().trim().min(1, "Company name is required").max(200),
  contact_email: z.string().trim().email("Invalid email address").max(255),
  contact_phone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(15),
  category_id: z.string().uuid("Please select a category"),
});

type InvitationStatus = "pending" | "used" | "expired";

function getInvitationStatus(invitation: { used_at: string | null; expires_at: string }): InvitationStatus {
  if (invitation.used_at) return "used";
  if (new Date(invitation.expires_at) < new Date()) return "expired";
  return "pending";
}

const STATUS_CONFIG: Record<InvitationStatus, { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: "Pending", className: "bg-warning/20 text-warning", icon: Clock },
  used: { label: "Registered", className: "bg-success/20 text-success", icon: CheckCircle2 },
  expired: { label: "Expired", className: "bg-destructive/20 text-destructive", icon: XCircle },
};

export default function StaffInviteVendor() {
  const { user } = useAuth();
  const { referralCode, isLoading: referralLoading } = useReferralCode();

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [sending, setSending] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    loadCategories();
    if (user) loadInvitations();
  }, [user]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from("vendor_categories")
      .select("id, name")
      .eq("is_active", true)
      .order("name");
    if (data) setCategories(data);
  };

  const loadInvitations = async () => {
    if (!user) return;
    setLoadingInvitations(true);
    const { data } = await supabase
      .from("vendor_invitations")
      .select("id, company_name, contact_email, contact_phone, token, created_at, expires_at, used_at, category_id, vendor_categories(name)")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });
    if (data) setInvitations(data);
    setLoadingInvitations(false);
  };

  const handleSendInvitation = async () => {
    const result = inviteSchema.safeParse({
      company_name: companyName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      category_id: categoryId,
    });

    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setSending(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await supabase.functions.invoke("send-vendor-invitation", {
        body: result.data,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.error) throw new Error(response.error.message);

      toast.success("Invitation sent successfully!");
      setCompanyName("");
      setContactEmail("");
      setContactPhone("");
      setCategoryId("");
      loadInvitations();
    } catch (err: any) {
      toast.error(err.message || "Failed to send invitation");
    } finally {
      setSending(false);
    }
  };

  return (
    <StaffLayout title="Invite a Vendor">
      <div className="p-4 md:p-6 space-y-4 max-w-2xl">
        {/* Invitation Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              Send Invitation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="company_name"
                  placeholder="Enter company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="contact_email"
                  type="email"
                  placeholder="vendor@company.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="contact_phone"
                  placeholder="+91 9876543210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Vendor Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              onClick={handleSendInvitation}
              disabled={sending}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {sending ? "Sending..." : "Send Invitation"}
            </Button>
          </CardContent>
        </Card>

        {/* Referral Link */}
        <ReferralLinkCard referralCode={referralCode || ""} isLoading={referralLoading} />

        {/* Sent Invitations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Sent Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingInvitations ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : invitations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                No invitations sent yet
              </p>
            ) : (
              <div className="space-y-3">
                {invitations.map((inv) => {
                  const status = getInvitationStatus(inv);
                  const config = STATUS_CONFIG[status];
                  const StatusIcon = config.icon;
                  return (
                    <div
                      key={inv.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                    >
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{inv.company_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{inv.contact_email}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {inv.vendor_categories?.name || "—"}
                          </Badge>
                          <Badge className={`text-xs ${config.className}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(inv.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}
