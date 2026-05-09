"use client";

import { createClient } from "@/lib/supabase/client";
import type { TaskSubmission, CreateSubmissionInput, ReviewSubmissionInput } from "@/types/submission.types";

export async function createSubmission(
  input: CreateSubmissionInput
): Promise<TaskSubmission> {
  const supabase = createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Not authenticated");
  
  const { data, error } = await supabase
    .from("task_submissions")
    .insert({
      ...input,
      submitted_by: user.id,
      status: "submitted",
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Update task instance status
  await supabase
    .from("daily_task_instances")
    .update({ status: "completed" })
    .eq("id", input.task_instance_id);
  
  return data as TaskSubmission;
}

export async function getSubmissionsForTask(
  taskInstanceId: string
): Promise<TaskSubmission[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("task_submissions")
    .select(`
      *,
      submitted_user:users!submitted_by(id, name, avatar_url),
      reviewed_user:users!reviewed_by(id, name)
    `)
    .eq("task_instance_id", taskInstanceId)
    .order("submitted_at", { ascending: false });
  
  if (error) throw error;
  return data as unknown as TaskSubmission[];
}

export async function reviewSubmission(
  input: ReviewSubmissionInput
): Promise<void> {
  const supabase = createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Not authenticated");
  
  const { error } = await supabase
    .from("task_submissions")
    .update({
      status: input.status,
      admin_note: input.admin_note,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.submission_id);
  
  if (error) throw error;
  
  // Update task instance status based on review
  const { data: submission } = await supabase
    .from("task_submissions")
    .select("task_instance_id")
    .eq("id", input.submission_id)
    .single();
  
  if (submission) {
    const taskStatus = input.status === "approved" 
      ? "completed" 
      : input.status === "rejected" 
        ? "rejected" 
        : "pending";
    
    await supabase
      .from("daily_task_instances")
      .update({ status: taskStatus })
      .eq("id", submission.task_instance_id);
  }
}

export async function getPendingSubmissions(): Promise<TaskSubmission[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("task_submissions")
    .select(`
      *,
      task_instance:daily_task_instances(
        *,
        sop_task:sop_tasks(title)
      ),
      submitted_user:users!submitted_by(id, name, avatar_url)
    `)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: true });
  
  if (error) throw error;
  return data as unknown as TaskSubmission[];
}
