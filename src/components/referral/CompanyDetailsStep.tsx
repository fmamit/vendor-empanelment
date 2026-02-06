import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, Lock } from "lucide-react";

interface CompanyDetailsStepProps {
  formData: {
    company_name: string;
    trade_name: string;
    gst_number: string;
    pan_number: string;
  };
  categoryName: string;
  onChange: (field: string, value: string) => void;
}

export function CompanyDetailsStep({ formData, categoryName, onChange }: CompanyDetailsStepProps) {
  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Company Details</h2>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="company_name">Company Name *</Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e) => onChange("company_name", e.target.value)}
            placeholder="Registered company name"
            className="h-12 mt-1"
          />
        </div>

        <div>
          <Label htmlFor="trade_name">Trade / Brand Name</Label>
          <Input
            id="trade_name"
            value={formData.trade_name}
            onChange={(e) => onChange("trade_name", e.target.value)}
            placeholder="If different from company name"
            className="h-12 mt-1"
          />
        </div>

        <div>
          <Label>Vendor Category</Label>
          <div className="flex items-center gap-2 mt-1 h-12 px-3 rounded-md border border-input bg-muted/50">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary" className="text-sm">{categoryName}</Badge>
          </div>
        </div>

        <div>
          <Label htmlFor="gst_number">GST Number</Label>
          <Input
            id="gst_number"
            value={formData.gst_number}
            onChange={(e) => onChange("gst_number", e.target.value.toUpperCase())}
            placeholder="e.g., 22AAAAA0000A1Z5"
            className="h-12 mt-1 uppercase"
            maxLength={15}
          />
        </div>

        <div>
          <Label htmlFor="pan_number">PAN Number</Label>
          <Input
            id="pan_number"
            value={formData.pan_number}
            onChange={(e) => onChange("pan_number", e.target.value.toUpperCase())}
            placeholder="e.g., ABCDE1234F"
            className="h-12 mt-1 uppercase"
            maxLength={10}
          />
        </div>
      </div>
    </div>
  );
}
