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
    <div className="space-y-5 p-4">
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Banking Details</h2>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="bank_name">Bank Name *</Label>
          <Input
            id="bank_name"
            value={formData.bank_name}
            onChange={(e) => onChange("bank_name", e.target.value)}
            placeholder="e.g., State Bank of India"
            className="h-12 mt-1"
          />
        </div>

        <div>
          <Label htmlFor="bank_branch">Branch Name *</Label>
          <Input
            id="bank_branch"
            value={formData.bank_branch}
            onChange={(e) => onChange("bank_branch", e.target.value)}
            placeholder="e.g., Mumbai Main Branch"
            className="h-12 mt-1"
          />
        </div>

        <div>
          <Label htmlFor="bank_account_number">Account Number *</Label>
          <Input
            id="bank_account_number"
            value={formData.bank_account_number}
            onChange={(e) => onChange("bank_account_number", e.target.value)}
            placeholder="Enter bank account number"
            className="h-12 mt-1"
          />
        </div>

        <div>
          <Label htmlFor="bank_ifsc">IFSC Code *</Label>
          <Input
            id="bank_ifsc"
            value={formData.bank_ifsc}
            onChange={(e) => onChange("bank_ifsc", e.target.value.toUpperCase())}
            placeholder="e.g., SBIN0000123"
            className="h-12 mt-1 uppercase"
            maxLength={11}
          />
        </div>
      </div>
    </div>
  );
}
