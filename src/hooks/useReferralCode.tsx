import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useReferralCode() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadOrCreateCode();
  }, [user]);

  const loadOrCreateCode = async () => {
    if (!user) return;
    setIsLoading(true);

    // Try to fetch existing code
    const { data, error } = await supabase
      .from("staff_referral_codes")
      .select("referral_code")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data?.referral_code) {
      setReferralCode(data.referral_code);
      setIsLoading(false);
      return;
    }

    // Generate a new code via the DB function and insert
    const { data: codeData } = await supabase.rpc("generate_referral_code");
    if (codeData) {
      const { data: inserted, error: insertErr } = await supabase
        .from("staff_referral_codes")
        .insert({ user_id: user.id, referral_code: codeData })
        .select("referral_code")
        .single();

      if (inserted) {
        setReferralCode(inserted.referral_code);
      }
    }

    setIsLoading(false);
  };

  return { referralCode, isLoading };
}
