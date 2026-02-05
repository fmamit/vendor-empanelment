import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVendorCategories } from "@/hooks/useVendorData";
import { useCreateInvitation } from "@/hooks/useVendorInvitations";
 import { useSendInvitationEmail } from "@/hooks/useEmailNotifications";
import { toast } from "sonner";
import { Copy, Loader2, UserPlus, Check } from "lucide-react";

interface CreateInvitationDialogProps {
  trigger?: React.ReactNode;
}

export function CreateInvitationDialog({ trigger }: CreateInvitationDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    category_id: "",
    company_name: "",
    contact_phone: "",
    contact_email: "",
  });

  const { data: categories, isLoading: categoriesLoading } = useVendorCategories();
  const createInvitation = useCreateInvitation();
   const sendInvitationEmail = useSendInvitationEmail();

  const resetForm = () => {
    setFormData({
      category_id: "",
      company_name: "",
      contact_phone: "",
      contact_email: "",
    });
    setGeneratedLink(null);
    setCopied(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category_id || !formData.company_name || !formData.contact_phone || !formData.contact_email) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const invitation = await createInvitation.mutateAsync(formData);
      // Use published URL for vendors (they don't have Lovable access)
      const publishedUrl = import.meta.env.VITE_PUBLIC_URL || "https://onboardly-path.lovable.app";
      const link = `${publishedUrl}/vendor/register?token=${invitation.token}`;
      setGeneratedLink(link);
       
       // Send invitation email
       try {
         await sendInvitationEmail.mutateAsync({
           to_email: formData.contact_email,
           company_name: formData.company_name,
           registration_link: link,
         });
       } catch (emailError) {
         // Email failure shouldn't block the invitation creation
         console.error("Failed to send invitation email:", emailError);
       }
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Vendor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Vendor Invitation</DialogTitle>
          <DialogDescription>
            Generate a unique registration link for a new vendor. The link will expire in 7 days.
          </DialogDescription>
        </DialogHeader>

        {!generatedLink ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Vendor Category *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : (
                    categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Enter company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone *</Label>
              <Input
                id="contact_phone"
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email *</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder="vendor@company.com"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createInvitation.isPending}>
                {createInvitation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Generate Link
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
              <p className="text-sm font-medium text-success mb-2">Invitation Created!</p>
              <p className="text-xs text-muted-foreground mb-3">
                Share this link with the vendor. It will expire in 7 days.
              </p>
              <div className="flex gap-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="text-xs font-mono"
                />
                <Button size="icon" variant="outline" onClick={handleCopyLink}>
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Company:</strong> {formData.company_name}</p>
              <p><strong>Phone:</strong> {formData.contact_phone}</p>
              <p><strong>Email:</strong> {formData.contact_email}</p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => resetForm()}>
                Create Another
              </Button>
              <Button onClick={() => setOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
