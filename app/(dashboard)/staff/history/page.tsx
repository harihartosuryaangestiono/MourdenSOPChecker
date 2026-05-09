"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate, formatTime } from "@/lib/utils";
import { PremiumLayout } from "@/components/layout/PremiumLayout";
import { PremiumLoading } from "@/components/common/PremiumLoading";
import { EmptyState } from "@/components/common/EmptyState";
import { History, Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function HistoryPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("daily_task_instances")
        .select(`
          *,
          sop_task:sop_tasks(
            title,
            description,
            sop_template:sop_templates(shift, category_id)
          )
        `)
        .eq("assigned_to", user.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) setTasks(data);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <PremiumLoading />
      </div>
    );
  }

  return (
    <PremiumLayout title="Task History" subtitle="Your past SOP completions">
      <div className="space-y-6">
        <AnimatePresence>
          {tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <EmptyState 
                icon={History}
                title="No history yet"
                description="Your completed and past tasks will appear here."
              />
            </motion.div>
          ) : (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="card-premium overflow-hidden group">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-secondary text-secondary-foreground font-medium flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(task.date)}
                            </Badge>
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 capitalize font-medium">
                              {task.shift}
                            </Badge>
                          </div>
                          <div>
                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                              {task.sop_task?.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {task.sop_task?.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:items-end gap-2">
                          <StatusBadge status={task.status} />
                          {task.completed_at && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-success" />
                              Done at {formatTime(task.completed_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PremiumLayout>
  );
}
