import type { TaskSubmission } from "./submission.types";

export type Shift = "opening" | "middle" | "closing" | "daily";
export type TaskStatus = "pending" | "in_progress" | "completed" | "overdue" | "rejected";
export type TaskPriority = "low" | "normal" | "high" | "critical";

export interface SOPCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  created_at: string;
}

export interface SOPTemplate {
  id: string;
  title: string;
  description?: string;
  shift: Shift;
  category_id?: string;
  category?: SOPCategory;
  deadline_time: string;
  priority: TaskPriority;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  task_count?: number;
}

export interface SOPTask {
  id: string;
  sop_template_id: string;
  title: string;
  description?: string;
  instruction?: string;
  photo_required: boolean;
  order_index: number;
  role_required: "owner" | "admin" | "staff";
  created_at: string;
  sop_template?: SOPTemplate;
}

export interface DailyTaskInstance {
  id: string;
  sop_task_id: string;
  sop_task?: SOPTask;
  assigned_to?: string;
  assigned_user?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  date: string;
  shift: Shift;
  status: TaskStatus;
  deadline_time: string;
  created_at: string;
  submission?: TaskSubmission;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  completion_rate: number;
}

export interface ShiftProgress {
  shift: Shift;
  total: number;
  completed: number;
  percentage: number;
}
