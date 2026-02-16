import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";

interface CompanyDetailsStepProps {
  formData: {
    company_name: string;
    trade_name: string;
    gst_number: string;
    pan_number: string;
    category_id: string;
    constitution_type: string;
  };
  categoryName: string;
  categories?: { id: string; name: string }[];
  onChange: (field: string, value: string) => void;
}

export function CompanyDetailsStep({ formData, categoryName, categories, onChange }: CompanyDetailsStepProps) {
  const hasCategories = categories && categories.length > 0;

  return (
    <div className="space-y-6 px-4 py-5">
      <div className="flex items-center gap-2.5">
        <Building2 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Company Details</h2>
      </div>

      <div className="space-y-5">
        <div>
          <Label htmlFor="company_name" className="text-sm font-semibold">Company Name *</Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e) => onChange("company_name", e.target.value)}
            placeholder="Registered company name"
            className="h-12 mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="trade_name" className="text-sm font-semibold">Trade / Brand Name</Label>
          <Input
            id="trade_name"
            value={formData.trade_name}
            onChange={(e) => onChange("trade_name", e.target.value)}
            placeholder="If different from company name"
            className="h-12 mt-1.5"
          />
        </div>

        <div>
          <Label className="text-sm font-semibold">Constitution Type *</Label>
          <Select value={formData.constitution_type} onValueChange={(val) => onChange("constitution_type", val)}>
            <SelectTrigger className="h-12 mt-1.5">
              <SelectValue placeholder="Select constitution type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Proprietorship">Proprietorship</SelectItem>
              <SelectItem value="Partnership">Partnership</SelectItem>
              <SelectItem value="LLP">LLP</SelectItem>
              <SelectItem value="Private Limited">Private Limited</SelectItem>
              <SelectItem value="Public Limited">Public Limited</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-semibold">Vendor Category *</Label>
          {hasCategories ? (
            <Select value={formData.category_id} onValueChange={(val) => onChange("category_id", val)}>
              <SelectTrigger className="h-12 mt-1.5">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center gap-2 mt-1.5 h-12 px-3 rounded-md border border-input bg-muted/50">
              <span className="text-sm text-muted-foreground">{categoryName || "Loading..."}</span>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="gst_number" className="text-sm font-semibold">GST Number</Label>
          <Input
            id="gst_number"
            value={formData.gst_number}
            onChange={(e) => onChange("gst_number", e.target.value.toUpperCase())}
            placeholder="e.g., 22AAAAA0000A1Z5"
            className="h-12 mt-1.5 uppercase"
            maxLength={15}
          />
        </div>

        <div>
          <Label htmlFor="pan_number" className="text-sm font-semibold">PAN Number</Label>
          <Input
            id="pan_number"
            value={formData.pan_number}
            onChange={(e) => onChange("pan_number", e.target.value.toUpperCase())}
            placeholder="e.g., ABCDE1234F"
            className="h-12 mt-1.5 uppercase"
            maxLength={10}
          />
        </div>
      </div>
    </div>
  );
}
