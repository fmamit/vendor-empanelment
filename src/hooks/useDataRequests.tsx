import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useDataRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["data-requests-stats", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_requests")
        .select("id, status, due_date")
        .in("status", ["pending", "in_progress"]);

      if (error) throw error;

      const now = new Date();
      const pending = data?.length || 0;
      const overdue = data?.filter(r => new Date(r.due_date) < now).length || 0;

      return { pending, overdue };
    },
    enabled: !!user,
  });
}
