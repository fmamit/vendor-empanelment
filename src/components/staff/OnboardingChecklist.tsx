import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, Circle, X, UserPlus, ClipboardList, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const CHECKLIST_DISMISSED_KEY = "onboarding-checklist-dismissed";

type ChecklistItem = {
  id: string;
  label: string;
  description: string;
  icon: typeof UserPlus;
  action: string;
  checkFn: (ctx: { vendorCount: number; hasInvitations: boolean }) => boolean;
};

const CHECKLIST: ChecklistItem[] = [
  {
    id: "invite",
    label: "Invite your first vendor",
    description: "Go to Vendor List and send an invitation link",
    icon: UserPlus,
    action: "/staff/vendors",
    checkFn: (ctx) => ctx.hasInvitations,
  },
  {
    id: "review",
    label: "Review a vendor application",
    description: "Once a vendor submits, review their documents in the Approval Queue",
    icon: ClipboardList,
    action: "/staff/queue",
    checkFn: (ctx) => ctx.vendorCount > 0,
  },
  {
    id: "settings",
    label: "Configure your team",
    description: "Add team members and assign reviewer/approver roles",
    icon: Settings,
    action: "/admin/users",
    checkFn: () => false, // Always shows until dismissed
  },
];

interface OnboardingChecklistProps {
  vendorCount: number;
  hasInvitations: boolean;
}

export function OnboardingChecklist({ vendorCount, hasInvitations }: OnboardingChecklistProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (user) {
      const key = `${CHECKLIST_DISMISSED_KEY}-${user.id}`;
      const isDismissed = localStorage.getItem(key) === "true";
      setDismissed(isDismissed);
    }
  }, [user]);

  const handleDismiss = () => {
    if (user) {
      localStorage.setItem(`${CHECKLIST_DISMISSED_KEY}-${user.id}`, "true");
    }
    setDismissed(true);
  };

  if (dismissed) return null;

  const ctx = { vendorCount, hasInvitations };
  const completedCount = CHECKLIST.filter((item) => item.checkFn(ctx)).length;
  const allDone = completedCount === CHECKLIST.length;

  if (allDone) {
    handleDismiss();
    return null;
  }

  return (
    <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-foreground">Getting Started</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completedCount} of {CHECKLIST.length} completed
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / CHECKLIST.length) * 100}%` }}
        />
      </div>

      <div className="space-y-2">
        {CHECKLIST.map((item) => {
          const Icon = item.icon;
          const done = item.checkFn(ctx);
          return (
            <button
              key={item.id}
              onClick={() => !done && navigate(item.action)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                done
                  ? "bg-white/50 opacity-60"
                  : "bg-white border border-border/50 hover:shadow-sm hover:border-primary/20"
              }`}
              disabled={done}
            >
              {done ? (
                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))] shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
