"use client";

import { useEffect, useState } from "react";
import { TaskCard } from "@/components/tasks/TaskCard";
import { getTodayTasks } from "@/services/task.service";
import type { DailyTaskInstance } from "@/types/task.types";
import { PremiumLayout } from "@/components/layout/PremiumLayout";
import { PremiumLoading } from "@/components/common/PremiumLoading";
import { EmptyState } from "@/components/common/EmptyState";
import { CheckSquare, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function AllTasksPage() {
  const [tasks, setTasks] = useState<DailyTaskInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const data = await getTodayTasks();
      setTasks(data);
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
    <PremiumLayout title="All Tasks Today" subtitle="Complete list of today's SOP tasks">
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">Tasks ({tasks.length})</h2>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" /> Filter
          </Button>
        </div>

        <AnimatePresence>
          {tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <EmptyState 
                icon={CheckSquare}
                title="No tasks scheduled"
                description="There are no tasks scheduled for today. Take a break!"
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
                  <TaskCard task={task} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PremiumLayout>
  );
}
