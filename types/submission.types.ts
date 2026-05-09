export type SubmissionStatus = "submitted" | "approved" | "rejected" | "revision_requested";

export interface TaskSubmission {
  id: string;
  task_instance_id: string;
  submitted_by: string;
  submitted_user?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  photo_url: string;
  photo_path: string;
  notes?: string;
  admin_note?: string;
  status: SubmissionStatus;
  reviewed_by?: string;
  reviewed_user?: {
    id: string;
    name: string;
  };
  reviewed_at?: string;
  submitted_at: string;
}

export interface CreateSubmissionInput {
  task_instance_id: string;
  photo_url: string;
  photo_path: string;
  notes?: string;
}

export interface ReviewSubmissionInput {
  submission_id: string;
  status: "approved" | "rejected" | "revision_requested";
  admin_note?: string;
}
