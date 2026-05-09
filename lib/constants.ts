export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "MourdenOps";
export const CAFE_NAME = process.env.NEXT_PUBLIC_CAFE_NAME || "Mourden";

export const SHIFTS = {
  opening: { label: "Opening", time: "06:00 - 11:59", startHour: 6, endHour: 12 },
  middle: { label: "Middle", time: "12:00 - 17:59", startHour: 12, endHour: 18 },
  closing: { label: "Closing", time: "18:00 - 23:59", startHour: 18, endHour: 24 },
  daily: { label: "Daily", time: "All Day", startHour: 0, endHour: 24 },
} as const;

export const ROLES = {
  owner: { label: "Owner", color: "bg-brand-navy", canManage: ["admin", "staff"] },
  admin: { label: "Admin", color: "bg-brand-gold", canManage: ["staff"] },
  staff: { label: "Staff", color: "bg-info", canManage: [] },
} as const;

export const PRIORITIES = {
  low: { label: "Rendah", color: "bg-muted" },
  normal: { label: "Normal", color: "bg-info" },
  high: { label: "Tinggi", color: "bg-warning" },
  critical: { label: "Kritis", color: "bg-danger" },
} as const;

export const NOTIFICATION_TYPES = {
  task_due: { label: "Task Jatuh Tempo", icon: "Clock" },
  task_overdue: { label: "Task Terlambat", icon: "AlertTriangle" },
  submission_review: { label: "Perlu Review", icon: "Eye" },
  approved: { label: "Disetujui", icon: "CheckCircle" },
  rejected: { label: "Ditolak", icon: "XCircle" },
  revision_requested: { label: "Perlu Revisi", icon: "RefreshCw" },
  system: { label: "Sistem", icon: "Bell" },
} as const;
