"use client";

import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS, type TaskStatus } from "@/lib/utils";

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Selesai",
  overdue: "Terlambat",
  rejected: "Ditolak",
  approved: "Disetujui",
  submitted: "Menunggu Review",
  revision_requested: "Perlu Revisi",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = status as keyof typeof STATUS_COLORS;
  
  return (
    <Badge 
      variant={variant} 
      className={className}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
