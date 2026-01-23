import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface VendorComparisonData {
  id: string;
  name: string;
  code: string | null;
  status: string;
  gst_number?: string;
  pan_number?: string;
  bank_account?: string;
  bank_ifsc?: string;
  company_name?: string;
}

interface DuplicateComparisonCardProps {
  currentVendor: VendorComparisonData;
  matchingVendor: VendorComparisonData;
  matchType: 'gst' | 'pan' | 'bank' | 'name';
  matchValue: string;
  similarityScore?: number; // For name matches
  onViewVendor?: (vendorId: string) => void;
}

const MATCH_TYPE_CONFIG = {
  gst: { label: "GST Number", field: "gst_number" },
  pan: { label: "PAN Number", field: "pan_number" },
  bank: { label: "Bank Account", field: "bank_account" },
  name: { label: "Company Name", field: "company_name" },
};

export function DuplicateComparisonCard({
  currentVendor,
  matchingVendor,
  matchType,
  matchValue,
  similarityScore,
  onViewVendor,
}: DuplicateComparisonCardProps) {
  const config = MATCH_TYPE_CONFIG[matchType];

  return (
    <Card className="border-warning/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Duplicate {config.label} Found
          </CardTitle>
          {similarityScore !== undefined && (
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
              {similarityScore}% Match
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Match Value Highlight */}
        <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
          <p className="text-xs text-muted-foreground mb-1">{config.label}</p>
          <p className="font-mono font-medium text-warning">{matchValue}</p>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-stretch">
          {/* Current Vendor */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Current Vendor</p>
            <p className="font-medium text-sm truncate">{currentVendor.name}</p>
            {currentVendor.code && (
              <p className="text-xs text-muted-foreground">{currentVendor.code}</p>
            )}
            <Badge variant="outline" className="mt-2 text-xs">
              {currentVendor.status.replace("_", " ")}
            </Badge>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-warning" />
            </div>
          </div>

          {/* Matching Vendor */}
          <div className="p-3 bg-warning/5 rounded-lg border border-warning/20">
            <p className="text-xs text-muted-foreground mb-1">Matching Vendor</p>
            <p className="font-medium text-sm truncate">{matchingVendor.name}</p>
            {matchingVendor.code && (
              <p className="text-xs text-muted-foreground">{matchingVendor.code}</p>
            )}
            <Badge variant="outline" className="mt-2 text-xs">
              {matchingVendor.status.replace("_", " ")}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        {onViewVendor && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onViewVendor(currentVendor.id)}
            >
              <ExternalLink className="h-3 w-3 mr-1.5" />
              View Current
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onViewVendor(matchingVendor.id)}
            >
              <ExternalLink className="h-3 w-3 mr-1.5" />
              View Matching
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
