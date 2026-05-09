"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import { getTodayTasks } from "@/services/task.service";
import { getStaffMembers } from "@/services/user.service";
import type { DailyTaskInstance, Shift, TaskStatus } from "@/types/task.types";
import type { User } from "@/types/auth.types";
import { formatTime } from "@/lib/utils";
import { Eye, Search, Filter, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { PremiumLayout } from "@/components/layout/PremiumLayout";
import { PremiumLoading } from "@/components/common/PremiumLoading";
import { EmptyState } from "@/components/common/EmptyState";
import { ImageViewerModal } from "@/components/common/ImageViewerModal";
import { motion, AnimatePresence } from "framer-motion";

export default function MonitorPage() {
  const [tasks, setTasks] = useState<DailyTaskInstance[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [shiftFilter, setShiftFilter] = useState<Shift | "all">("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedPhotoTask, setSelectedPhotoTask] = useState<DailyTaskInstance | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [tasksData, staffData] = await Promise.all([
        getTodayTasks(),
        getStaffMembers(),
      ]);
      setTasks(tasksData);
      setStaff(staffData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (shiftFilter !== "all" && task.shift !== shiftFilter) return false;
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    if (staffFilter !== "all" && task.assigned_to !== staffFilter) return false;
    if (searchQuery && !task.sop_task?.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <PremiumLoading />
      </div>
    );
  }

  return (
    <PremiumLayout title="Live Monitor" subtitle="Real-time SOP execution tracking">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="card-premium">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <h3 className="text-2xl font-bold">{tasks.filter(t => t.status === "completed").length}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-premium">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-amber-500/10 rounded-xl">
                  <Clock className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <h3 className="text-2xl font-bold">{tasks.filter(t => t.status === "pending").length}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-premium">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <h3 className="text-2xl font-bold">{tasks.filter(t => t.status === "in_progress").length}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-premium">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-rose-500/10 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-rose-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                  <h3 className="text-2xl font-bold">{tasks.filter(t => t.status === "overdue").length}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="card-premium">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  className="pl-9 bg-secondary/50 border-transparent focus:border-primary focus:bg-background transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={shiftFilter} onValueChange={(v: any) => setShiftFilter(v)}>
                <SelectTrigger className="w-[150px] bg-secondary/50 border-transparent focus:border-primary">
                  <SelectValue placeholder="All Shifts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shifts</SelectItem>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="closing">Closing</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[150px] bg-secondary/50 border-transparent focus:border-primary">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={staffFilter} onValueChange={setStaffFilter}>
                <SelectTrigger className="w-[180px] bg-secondary/50 border-transparent focus:border-primary">
                  <SelectValue placeholder="All Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Task List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <EmptyState 
                  icon={AlertCircle}
                  title="No tasks found"
                  description="No tasks match the current filters. Try adjusting your search criteria."
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setSearchQuery("");
                    setShiftFilter("all");
                    setStatusFilter("all");
                    setStaffFilter("all");
                  }}
                />
              </motion.div>
            ) : (
              filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Card className="card-premium overflow-hidden group hover:border-primary/30 transition-all duration-300">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 capitalize font-medium">
                              {task.shift}
                            </Badge>
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-md">
                              <Clock className="w-3.5 h-3.5" />
                              Due: {formatTime(task.deadline_time || "")}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{task.sop_task?.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">{task.sop_task?.description}</p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:items-end gap-3 min-w-[200px]">
                          <div className="flex items-center justify-between sm:justify-end w-full gap-4">
                            <StatusBadge status={task.status} />
                            {task.submission && task.submission.submitted_at && (
                              <div className="flex flex-col items-end">
                                <span className="text-xs text-muted-foreground mb-1">Completed by</span>
                                <div className="flex items-center gap-2 bg-secondary/50 px-2 py-1 rounded-full">
                                  <UserAvatar name={task.assigned_user?.name || ""} avatarUrl={task.assigned_user?.avatar_url} className="w-6 h-6" />
                                  <span className="text-sm font-medium">{task.assigned_user?.name}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {task.submission && task.submission.photo_url ? (
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="w-full sm:w-auto shadow-sm hover:shadow-md hover:bg-primary hover:text-primary-foreground transition-all group/btn"
                              onClick={() => setSelectedPhotoTask(task)}
                            >
                              <Eye className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                              View Photo Proof
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full sm:w-auto shadow-sm opacity-50 cursor-not-allowed"
                            >
                              No Proof Yet
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <ImageViewerModal 
        isOpen={!!selectedPhotoTask}
        onClose={() => setSelectedPhotoTask(null)}
        imageUrl={selectedPhotoTask?.submission?.photo_url || ""}
        title={selectedPhotoTask?.sop_task?.title}
        timestamp={selectedPhotoTask?.submission?.submitted_at ? formatTime(selectedPhotoTask.submission.submitted_at) : undefined}
        uploaderName={selectedPhotoTask?.assigned_user?.name}
      />
    </PremiumLayout>
  );
}
