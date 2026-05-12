import { cn } from "@/lib/utils";

type Status = "pending" | "in_progress" | "completed" | "overdue" | "rejected" | "approved" | "submitted" | "revision_requested";

const STATUS_MAP: Record<Status, { label: string; class: string }> = {
  pending:            { label: "Pending",     class: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  in_progress:        { label: "In Progress", class: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  completed:          { label: "Completed",   class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  overdue:            { label: "Overdue",     class: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  rejected:           { label: "Rejected",    class: "bg-red-500/10 text-red-600 border-red-500/20" },
  approved:           { label: "Approved",    class: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  submitted:          { label: "Submitted",   class: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  revision_requested: { label: "Revision",    class: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
};

interface StatusBadgeProps {
  status: Status | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const map = STATUS_MAP[status as Status] ?? { label: status, class: "bg-secondary text-muted-foreground border-border/40" };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider",
        map.class,
        className
      )}
    >
      {map.label}
    </span>
  );
}
