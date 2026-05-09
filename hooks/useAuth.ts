"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, UserRole } from "@/types/auth.types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();

        setUser(userData as User);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  const role = user?.role ?? null;
  const isOwner = role === "owner";
  const isAdmin = role === "admin" || role === "owner";
  const isStaff = role === "staff";

  return { user, role, isOwner, isAdmin, isStaff, isLoading, error };
}

export function useRequireRole(requiredRole: UserRole) {
  const { role, isLoading } = useAuth();
  
  if (isLoading) return { allowed: false, isLoading: true };
  
  if (!role) return { allowed: false, isLoading: false };
  
  if (requiredRole === "owner") {
    return { allowed: role === "owner", isLoading: false };
  }
  
  if (requiredRole === "admin") {
    return { allowed: role === "admin" || role === "owner", isLoading: false };
  }
  
  return { allowed: true, isLoading: false };
}
