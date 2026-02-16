import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard } from "lucide-react";

interface BankDetailsStepProps {
  formData: {
    bank_name: string;
    bank_branch: string;
    bank_account_number: string;
    bank_ifsc: string;
  };
  onChange: (field: string, value: string) => void;
}

export function BankDetailsStep({ formData, onChange }: BankDetailsStepProps) {
  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center gap-3">
        <CreditCard className="h-8 w-8 text-primary" />
        <h2 className="text-2xl font-semibold text-foreground">Banking Details</h2>
      </div>

      <div className="space-y-5">
        <div>
          <Label htmlFor="bank_name" className="text-base font-semibold">Bank Name *</Label>
          <Input
            id="bank_name"
            value={formData.bank_name}
            onChange={(e) => onChange("bank_name", e.target.value)}
            placeholder="e.g., State Bank of India"
            className="h-14 mt-2 text-base"
          />
        </div>

        <div>
          <Label htmlFor="bank_branch" className="text-base font-semibold">Branch Name *</Label>
          <Input
            id="bank_branch"
            value={formData.bank_branch}
            onChange={(e) => onChange("bank_branch", e.target.value)}
            placeholder="e.g., Mumbai Main Branch"
            className="h-14 mt-2 text-base"
          />
        </div>

        <div>
          <Label htmlFor="bank_account_number" className="text-base font-semibold">Account Number *</Label>
          <Input
            id="bank_account_number"
            value={formData.bank_account_number}
            onChange={(e) => onChange("bank_account_number", e.target.value)}
            placeholder="Enter bank account number"
            className="h-14 mt-2 text-base"
          />
        </div>

        <div>
          <Label htmlFor="bank_ifsc" className="text-base font-semibold">IFSC Code *</Label>
          <Input
            id="bank_ifsc"
            value={formData.bank_ifsc}
            onChange={(e) => onChange("bank_ifsc", e.target.value.toUpperCase())}
            placeholder="e.g., SBIN0000123"
            className="h-14 mt-2 uppercase text-base"
            maxLength={11}
          />
        </div>
      </div>
    </div>
  );
}
