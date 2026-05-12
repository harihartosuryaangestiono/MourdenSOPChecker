"use client";

import { createClient } from "@/lib/supabase/client";
import type { User, UserRole } from "@/types/auth.types";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser) return null;
  
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();
  
  return userData as User | null;
}

export async function getUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  return user?.role ?? null;
}

export async function requireRole(requiredRole: UserRole): Promise<boolean> {
  const role = await getUserRole();
  
  if (!role) return false;
  
  if (requiredRole === "owner") {
    return role === "owner";
  }
  
  if (requiredRole === "admin") {
    return role === "admin" || role === "owner";
  }
  
  return true;
}

export async function login(email: string, password: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function logout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function getDashboardRoute(role: UserRole): string {
  switch (role) {
    case "owner":
      return "/owner";
    case "admin":
      return "/admin";
    case "staff":
    default:
      return "/staff";
  }
}
