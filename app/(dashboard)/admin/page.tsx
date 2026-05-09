"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PremiumLayout } from "@/components/layout/PremiumLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { 
  CheckCircle, Clock, AlertCircle, Camera, Eye, 
  Users, Activity, Calendar, Filter, Search, X, MessageSquare, Target,
  ArrowUpRight, ArrowDownRight, Upload
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/lib/utils";

import { PremiumLoading } from "@/components/common/PremiumLoading";

interface TaskInstance {
  id: string;
  date: string;
  shift: string;
  status: string;
  deadline_time: string;
  submission?: {
    id: string;
    photo_url: string;
    submitted_at: string;
    notes: string;
    admin_note: string;
    reviewed_at: string;
    reviewed_by: string;
  };
  sop_task?: {
    title: string;
    description: string;
    instruction: string;
    photo_required: boolean;
    order_index: number;
    sop_template?: {
      title: string;
      category?: {
        name: string;
        color: string;
        icon: string;
      };
    };
  };
  assigned_user?: {
    id: string;
    name: string;
    avatar_url: string;
    role: string;
  };
}

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  staffCount: number;
  activeStaff: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function AdminDashboard() {
  const [tasks, setTasks] = useState<TaskInstance[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0, completedTasks: 0, pendingTasks: 0, overdueTasks: 0,
    completionRate: 0, staffCount: 0, activeStaff: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskInstance | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterShift, setFilterShift] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [adminNote, setAdminNote] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDate, filterShift, filterStatus]);

  const fetchDashboardData = async () => {
    try {
      const supabase = createClient();
      setLoading(true);
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
          assigned_user:users!assigned_to(id, name, avatar_url, role),
          submission:task_submissions(
            *,
            reviewer:users!reviewed_by(id, name)
          )
        `)
        .eq("date", selectedDate)
        .order("deadline_time", { ascending: true });

      if (filterShift !== "all") query = query.eq("shift", filterShift);
      if (filterStatus !== "all") query = query.eq("status", filterStatus);

      const { data: tasksData, error: tasksError } = await query;
      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      const total = tasksData?.length || 0;
      const completed = tasksData?.filter(t => t.status === "completed").length || 0;
      const pending = tasksData?.filter(t => t.status === "pending").length || 0;
      const overdue = tasksData?.filter(t => t.status === "overdue").length || 0;
      
      const { data: staffData } = await supabase.from("users").select("id, role, is_active").eq("role", "staff");
      const staffCount = staffData?.length || 0;
      const activeStaff = staffData?.filter(s => s.is_active).length || 0;

      setStats({
        totalTasks: total,
        completedTasks: completed,
        pendingTasks: pending,
        overdueTasks: overdue,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
        staffCount: staffCount,
        activeStaff: activeStaff,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAdminNote = async (taskId: string, note: string) => {
    setUpdating(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("task_submissions")
        .update({
          admin_note: note,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq("task_instance_id", taskId);

      if (error) throw error;
      toast.success("Catatan admin berhasil ditambahkan");
      fetchDashboardData();
      setAdminNote("");
    } catch (error) {
      console.error("Error updating admin note:", error);
      toast.error("Gagal menambahkan catatan");
    } finally {
      setUpdating(false);
    }
  };

  const filteredTasks = tasks.filter(task => 
    task.sop_task?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assigned_user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <PremiumLayout 
      title="Admin Dashboard"
      subtitle="Monitor SOP and review task submissions"
    >
      <motion.div 
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header & Date Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold font-display">Daily Operations</h2>
          <div className="bg-card rounded-xl shadow-sm border border-border p-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-0 focus:ring-0 bg-transparent"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div variants={itemVariants}>
            <Card className="card-premium overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                  <div className="p-2 bg-primary/10 rounded-xl"><Target className="w-4 h-4 text-primary" /></div>
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold">{stats.totalTasks}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">Scheduled for today</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="card-premium overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-success/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <div className="p-2 bg-success/10 rounded-xl"><CheckCircle className="w-4 h-4 text-success" /></div>
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold text-success">{stats.completedTasks}</div>
                  <span className="text-xs font-medium text-success flex items-center"><ArrowUpRight className="w-3 h-3 mr-1" />{stats.completionRate.toFixed(1)}%</span>
                </div>
                <Progress value={stats.completionRate} className="h-2 mt-4" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="card-premium overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-warning/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <div className="p-2 bg-warning/10 rounded-xl"><Clock className="w-4 h-4 text-warning" /></div>
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold text-warning">{stats.pendingTasks}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">Awaiting submission</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="card-premium overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Active Staff</p>
                  <div className="p-2 bg-purple-500/10 rounded-xl"><Users className="w-4 h-4 text-purple-500" /></div>
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold">{stats.activeStaff}</div>
                  <span className="text-xs text-muted-foreground">/ {stats.staffCount} total</span>
                </div>
                <p className="text-xs text-muted-foreground mt-4">Staff on shift today</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Card className="card-premium">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks or staff..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-border bg-background focus-visible:ring-primary/20"
                  />
                </div>
                <Select value={filterShift} onValueChange={setFilterShift}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-background border-border">
                    <SelectValue placeholder="Filter Shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Shifts</SelectItem>
                    <SelectItem value="opening">Opening</SelectItem>
                    <SelectItem value="middle">Middle</SelectItem>
                    <SelectItem value="closing">Closing</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-background border-border">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tasks List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredTasks.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="card-premium border-dashed border-2">
                  <CardContent className="text-center py-16">
                    <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-xl font-bold text-foreground mb-2">No tasks found</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Try adjusting your filters or date selection to see tasks.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              filteredTasks.map((task, idx) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  layout
                >
                  <Card className={cn(
                    "card-premium transition-all duration-300 border hover:border-primary/30 group",
                    task.status === "completed" ? "bg-success/5" : "",
                    task.status === "overdue" ? "border-destructive/30 bg-destructive/5" : ""
                  )}>
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        <div className="flex-1 w-full">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge variant="secondary" className={cn(
                              "px-3 py-1 shadow-sm font-medium",
                              task.status === 'completed' && 'bg-success text-white',
                              task.status === 'in_progress' && 'bg-warning text-white',
                              task.status === 'overdue' && 'bg-destructive text-white',
                              task.status === 'pending' && 'bg-secondary text-foreground'
                            )}>
                              <span className="capitalize">{task.status.replace("_", " ")}</span>
                            </Badge>
                            {task.sop_task?.sop_template?.category && (
                              <Badge variant="outline" className="text-xs bg-background/50">
                                {task.sop_task.sop_template.category.name}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs capitalize bg-background/50">
                              {task.shift}
                            </Badge>
                          </div>
                          
                          <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
                            {task.sop_task?.title}
                          </h3>
                          <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                            {task.sop_task?.description}
                          </p>
                          
                          <div className="flex items-center gap-6 text-xs font-medium text-muted-foreground mb-4">
                            <span className="flex items-center gap-1.5 py-1 px-2 rounded-md bg-secondary/50">
                              <Users className="w-4 h-4" />
                              {task.assigned_user?.name || "Unassigned"}
                            </span>
                            <span className={cn("flex items-center gap-1.5 py-1 px-2 rounded-md", task.status === 'overdue' ? 'bg-destructive/10 text-destructive' : 'bg-secondary/50')}>
                              <Clock className="w-4 h-4" />
                              Deadline: {task.deadline_time}
                            </span>
                          </div>

                          {task.submission && (
                            <div className="bg-success/10 border border-success/20 p-4 rounded-xl">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-success flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" /> Submitted
                                </span>
                                <span className="text-success/80 text-xs font-medium">
                                  {new Date(task.submission.submitted_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              {task.submission.admin_note && (
                                <div className="mt-3 p-3 bg-background/50 rounded-lg border border-border/50 backdrop-blur-sm">
                                  <div className="flex items-center gap-2 mb-1">
                                    <MessageSquare className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-bold text-primary">Admin Note:</span>
                                  </div>
                                  <p className="text-sm text-foreground">{task.submission.admin_note}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="w-full lg:w-auto flex flex-col gap-3 shrink-0">
                          {task.submission?.photo_url ? (
                            <motion.div 
                              className="relative group/img overflow-hidden rounded-xl w-full lg:w-32 aspect-square"
                              whileHover={{ scale: 1.05 }}
                            >
                              <Image
                                src={task.submission.photo_url}
                                alt="Task submission"
                                fill
                                className="object-cover cursor-pointer"
                                onClick={() => setSelectedTask(task)}
                              />
                              <div className="absolute top-2 right-2 bg-success rounded-full p-1.5 shadow-lg backdrop-blur-md z-10">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                onClick={() => setSelectedTask(task)}>
                                <Eye className="w-8 h-8 text-white drop-shadow-md" />
                              </div>
                            </motion.div>
                          ) : (
                            <div className="w-full lg:w-32 aspect-square bg-secondary rounded-xl flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed">
                              <Camera className="w-8 h-8 mb-2 opacity-50" />
                              <span className="text-xs font-medium">No Photo</span>
                            </div>
                          )}
                          
                          {task.submission && (
                            <Button
                              size="sm"
                              className="w-full lg:w-32 shadow-sm"
                              onClick={() => setSelectedTask(task)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Review
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
      </motion.div>

      {/* Review Modal */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-3xl my-8"
            >
              <Card className="border-0 shadow-2xl overflow-hidden card-premium">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b border-border/50 sticky top-0 z-10 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Eye className="w-5 h-5 text-primary" /> Review Submission
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedTask(null)}
                      className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-2xl font-bold text-foreground mb-2">{selectedTask.sop_task?.title}</h4>
                        <p className="text-muted-foreground leading-relaxed">{selectedTask.sop_task?.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-secondary/50 p-4 rounded-xl border border-border">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Staff Member</span>
                          <p className="font-medium text-foreground flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" /> {selectedTask.assigned_user?.name}
                          </p>
                        </div>
                        <div className="bg-secondary/50 p-4 rounded-xl border border-border">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Submitted At</span>
                          <p className="font-medium text-foreground flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" /> 
                            {selectedTask.submission?.submitted_at ? 
                              new Date(selectedTask.submission.submitted_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 
                              'N/A'
                            }
                          </p>
                        </div>
                      </div>

                      {selectedTask.sop_task?.instruction && (
                        <div className="bg-primary/5 border border-primary/20 p-5 rounded-xl">
                          <h5 className="text-sm font-semibold flex items-center gap-2 mb-2 text-primary">
                            <AlertCircle className="w-4 h-4" />
                            Task Instructions
                          </h5>
                          <p className="text-sm text-foreground leading-relaxed">{selectedTask.sop_task.instruction}</p>
                        </div>
                      )}

                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" /> Admin Feedback
                        </label>
                        <textarea
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          placeholder="Provide feedback on this submission..."
                          className="w-full p-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                          rows={4}
                        />
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleUpdateAdminNote(selectedTask.id, adminNote)}
                            disabled={updating}
                            className="flex-1 shadow-md hover:shadow-lg transition-all"
                          >
                            {updating ? "Saving..." : "Save Feedback"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedTask(null)}
                            className="flex-1"
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {selectedTask.submission?.photo_url && (
                        <>
                          <h5 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Camera className="w-4 h-4" /> Photo Evidence
                          </h5>
                          <div className="relative rounded-xl overflow-hidden shadow-inner border border-border bg-black aspect-[3/4] group">
                            <Image
                              src={selectedTask.submission.photo_url}
                              alt="Task evidence"
                              fill
                              className="object-contain"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button variant="secondary" size="sm" className="gap-2 backdrop-blur-md bg-background/50">
                                <Eye className="w-4 h-4" /> View Fullscreen
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PremiumLayout>
  );
}
