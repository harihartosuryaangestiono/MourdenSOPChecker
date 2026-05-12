"use client";

import { createClient } from "@/lib/supabase/client";
import type { DailyTaskInstance, SOPTemplate, SOPTask, TaskStats, Shift } from "@/types/task.types";

export async function getTodayTasks(shift?: Shift): Promise<DailyTaskInstance[]> {
  const supabase = createClient();
  
  let query = supabase
    .from("daily_task_instances")
    .select(`
      *,
      sop_task:sop_tasks(
        *,
        sop_template:sop_templates(
          *,
          category:sop_categories(*)
        )
      ),
      assigned_user:users!daily_task_instances_assigned_to_fkey(id, name, avatar_url),
      submission:task_submissions(*)
    `)
    .eq("date", new Date().toISOString().split("T")[0])
    .order("deadline_time", { ascending: true });
  
  if (shift && shift !== "daily") {
    query = query.eq("shift", shift);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  // Unwrap the submission array to a single object
  const formattedData = data?.map((task: any) => ({
    ...task,
    submission: task.submission && task.submission.length > 0 ? task.submission[0] : null
  }));
  
  return formattedData as unknown as DailyTaskInstance[];
}

export async function getTaskStats(): Promise<TaskStats> {
  const supabase = createClient();
  
  const today = new Date().toISOString().split("T")[0];
  
  const { data, error } = await supabase
    .from("daily_task_instances")
    .select("status")
    .eq("date", today);
  
  if (error) throw error;
  
  const total = data?.length || 0;
  const completed = data?.filter((t) => t.status === "completed").length || 0;
  const pending = data?.filter((t) => t.status === "pending").length || 0;
  const overdue = data?.filter((t) => t.status === "overdue").length || 0;
  
  return {
    total,
    completed,
    pending,
    overdue,
    completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export async function updateTaskStatus(
  taskId: string,
  status: DailyTaskInstance["status"]
): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("daily_task_instances")
    .update({ status })
    .eq("id", taskId);
  
  if (error) throw error;
}

export async function getSOPTemplates(): Promise<SOPTemplate[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("sop_templates")
    .select(`
      *,
      category:sop_categories(*),
      task_count:sop_tasks(count)
    `)
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  
  const formattedData = data?.map((template: any) => ({
    ...template,
    task_count: template.task_count?.[0]?.count || 0
  }));
  
  return formattedData as unknown as SOPTemplate[];
}

export async function getSOPTasks(templateId: string): Promise<SOPTask[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("sop_tasks")
    .select("*")
    .eq("sop_template_id", templateId)
    .order("order_index", { ascending: true });
  
  if (error) throw error;
  return data as SOPTask[];
}

export async function createSOPTemplate(
  template: Omit<SOPTemplate, "id" | "created_at" | "updated_at">
): Promise<SOPTemplate> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("sop_templates")
    .insert(template)
    .select()
    .single();
  
  if (error) throw error;
  return data as SOPTemplate;
}

export async function createSOPTask(
  task: Omit<SOPTask, "id" | "created_at">
): Promise<SOPTask> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("sop_tasks")
    .insert(task)
    .select()
    .single();
  
  if (error) throw error;
  return data as SOPTask;
}

export async function updateSOPTemplate(
  id: string,
  updates: Partial<SOPTemplate>
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("sop_templates").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteSOPTemplate(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("sop_templates").delete().eq("id", id);
  if (error) throw error;
}

export async function generateDailyTasks(): Promise<{ created: number; skipped: number }> {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  // deadline_time lives on sop_templates, NOT on sop_tasks
  const { data: templates, error: tErr } = await supabase
    .from("sop_templates")
    .select("id, shift, deadline_time, sop_tasks(id, order_index)")
    .eq("is_active", true);

  if (tErr) throw tErr;
  if (!templates || templates.length === 0) return { created: 0, skipped: 0 };

  const { data: existing } = await supabase
    .from("daily_task_instances")
    .select("sop_task_id")
    .eq("date", today);

  const existingIds = new Set((existing ?? []).map((e: any) => e.sop_task_id));

  const toInsert: any[] = [];
  for (const template of templates as any[]) {
    const deadlineTime: string = template.deadline_time ?? "23:59:00";
    for (const task of template.sop_tasks ?? []) {
      if (!existingIds.has(task.id)) {
        toInsert.push({
          date: today,
          shift: template.shift,
          sop_task_id: task.id,
          status: "pending",
          deadline_time: deadlineTime,
        });
      }
    }
  }

  if (toInsert.length === 0) return { created: 0, skipped: existingIds.size };

  const { error } = await supabase.from("daily_task_instances").insert(toInsert);
  if (error) throw error;

  return { created: toInsert.length, skipped: existingIds.size };
}

export async function getSOPCategories() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sop_categories")
    .select("id, name, color, icon")
    .order("name");
  if (error) throw error;
  return data ?? [];
}
