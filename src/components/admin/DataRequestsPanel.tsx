import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format, isPast } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/20 text-warning",
  in_progress: "bg-primary/20 text-primary",
  completed: "bg-success/20 text-success",
  rejected: "bg-destructive/20 text-destructive",
};

const TYPE_LABELS: Record<string, string> = {
  access: "Data Access",
  erasure: "Data Erasure",
  correction: "Data Correction",
  nomination: "Nomination",
};

export function DataRequestsPanel() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["data-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_requests")
        .select("*, vendors(company_name, vendor_code)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "completed") updates.completed_at = new Date().toISOString();
      const { error } = await supabase.from("data_requests").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-requests"] });
      toast.success("Request updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!requests?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No data requests yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 max-w-2xl">
      {requests.map((req: any) => {
        const overdue = req.status === "pending" && isPast(new Date(req.due_date));
        return (
          <Card key={req.id} className={overdue ? "border-destructive" : ""}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{TYPE_LABELS[req.request_type] || req.request_type}</p>
                  <p className="text-xs text-muted-foreground">
                    {(req as any).vendors?.company_name} ({(req as any).vendors?.vendor_code})
                  </p>
                </div>
                <Badge className={STATUS_COLORS[req.status] || ""}>{req.status}</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Filed: {format(new Date(req.created_at), "dd MMM yyyy")}</span>
                <span className={overdue ? "text-destructive font-semibold" : ""}>
                  {overdue && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                  Due: {format(new Date(req.due_date), "dd MMM yyyy")}
                </span>
              </div>
              {req.status === "pending" && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: req.id, status: "in_progress" })}>
                    Mark In Progress
                  </Button>
                  <Button size="sm" onClick={() => updateStatus.mutate({ id: req.id, status: "completed" })}>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                  </Button>
                </div>
              )}
              {req.status === "in_progress" && (
                <Button size="sm" onClick={() => updateStatus.mutate({ id: req.id, status: "completed" })}>
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Completed
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
