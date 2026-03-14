import { useTenant } from "@/contexts/TenantContext";
import capitalIndiaLogo from "@/assets/capital-india-logo.webp";

/**
 * Returns the tenant's logo URL.
 * Falls back to the bundled Capital India logo if no custom logo is set.
 */
export function useTenantLogo(): string {
  const { tenant } = useTenant();
  return tenant?.logo_url || capitalIndiaLogo;
}
