"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/stores/useAppStore";

export function useRealtimeUpdates() {
  const supabase = createClient();
  const { refreshTasks, addActivity } = useAppStore();

  useEffect(() => {
    const channel = supabase
      .channel("mourdenops-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "daily_task_instances",
        },
        () => {
          refreshTasks();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "task_submissions",
        },
        (payload) => {
          addActivity(payload.new as Record<string, unknown>);
          refreshTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, refreshTasks, addActivity]);
}
