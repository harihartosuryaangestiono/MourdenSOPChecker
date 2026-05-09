"use client";

import { createClient } from "@/lib/supabase/client";
import type { User, UserRole } from "@/types/auth.types";
import type { StaffPerformance } from "@/types";

export async function getStaffMembers(): Promise<User[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .in("role", ["staff", "admin"])
    .order("name");
  
  if (error) throw error;
  return data as User[];
}

export async function getStaffPerformance(): Promise<StaffPerformance[]> {
  const supabase = createClient();
  
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  
  const { data: staff, error: staffError } = await supabase
    .from("users")
    .select("id, name, avatar_url, role")
    .eq("role", "staff");
  
  if (staffError) throw staffError;
  
  const performanceData: StaffPerformance[] = [];
  
  for (const member of staff || []) {
    const { data: tasks, error: tasksError } = await supabase
      .from("daily_task_instances")
      .select("status, created_at")
      .eq("assigned_to", member.id)
      .gte("date", weekAgo)
      .lte("date", today);
    
    if (tasksError) continue;
    
    const total = tasks?.length || 0;
    const completed = tasks?.filter((t) => t.status === "completed").length || 0;
    const overdue = tasks?.filter((t) => t.status === "overdue").length || 0;
    
    // Get last activity
    const { data: lastSubmission } = await supabase
      .from("task_submissions")
      .select("submitted_at")
      .eq("submitted_by", member.id)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .single();
    
    performanceData.push({
      user_id: member.id,
      user_name: member.name,
      avatar_url: member.avatar_url,
      total_tasks: total,
      completed_tasks: completed,
      completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      on_time_count: completed,
      overdue_count: overdue,
      last_activity_at: lastSubmission?.submitted_at,
    });
  }
  
  return performanceData.sort((a, b) => b.completion_rate - a.completion_rate);
}

export async function createUser(
  email: string,
  name: string,
  role: UserRole,
  shiftPreference: string = "all"
): Promise<void> {
  const supabase = createClient();
  
  // Create auth user with service role (this would typically be done server-side)
  // For now, we'll just insert into the users table (assuming auth user exists)
  const { error } = await supabase.from("users").insert({
    email,
    name,
    role,
    shift_preference: shiftPreference,
    is_active: true,
  });
  
  if (error) throw error;
}

export async function updateUserStatus(
  userId: string,
  isActive: boolean
): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("users")
    .update({ is_active: isActive })
    .eq("id", userId);
  
  if (error) throw error;
}
