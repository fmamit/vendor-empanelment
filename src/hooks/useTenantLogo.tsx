import { useTenant } from "@/contexts/TenantContext";
import insyncLogo from "@/assets/insync-logo-color.png";

/**
 * Returns the tenant's logo URL.
 * Falls back to the bundled In-Sync logo if no custom logo is set.
 */
export function useTenantLogo(): string {
  const { tenant } = useTenant();
  return tenant?.logo_url || insyncLogo;
}
