export * from "./auth.types";
export * from "./task.types";
export * from "./submission.types";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message?: string;
  type: "task_due" | "task_overdue" | "submission_review" | "approved" | "rejected" | "revision_requested" | "system";
  is_read: boolean;
  related_task_id?: string;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  action: string;
  task_title: string;
  created_at: string;
}

export interface StaffPerformance {
  user_id: string;
  user_name: string;
  avatar_url?: string;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  on_time_count: number;
  overdue_count: number;
  last_activity_at?: string;
}

export interface ReportMetrics {
  period: string;
  overall_completion_rate: number;
  total_tasks_generated: number;
  total_tasks_completed: number;
  avg_completion_time_minutes: number;
  top_performing_staff: StaffPerformance[];
  most_overdue_tasks: Array<{
    task_title: string;
    overdue_count: number;
  }>;
}
