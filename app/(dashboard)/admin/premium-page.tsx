"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PremiumHeader } from "@/components/layout/PremiumHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Camera, 
  Eye, 
  Users, 
  TrendingUp, 
  Target, 
  Activity,
  Calendar,
  Filter,
  Search,
  Download,
  MessageSquare,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface TaskInstance {
  id: string;
  date: string;
  shift: string;
  status: string;
  deadline_time: string;
  sop_task: {
    id: string;
    title: string;
    description: string;
    instruction: string;
    photo_required: boolean;
    category?: {
      name: string;
      color: string;
    };
  };
  assigned_user?: {
    id: string;
    name: string;
    email: string;
  };
  submission?: {
    id: string;
    photo_url: string;
    submitted_at: string;
    admin_note?: string;
  };
}

interface Stats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  activeStaff: number;
  totalStaff: number;
  completionRate: number;
  avgCompletionTime: number;
  todaySubmissions: number;
}

interface StaffPerformance {
  id: string;
  name: string;
  completed: number;
  pending: number;
  completionRate: number;
  avatar_url?: string;
}

export default function PremiumAdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<TaskInstance[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    activeStaff: 0,
    totalStaff: 0,
    completionRate: 0,
    avgCompletionTime: 0,
    todaySubmissions: 0
  });
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskInstance | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterShift, setFilterShift] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const supabase = createClient();

  useEffect(() => {
    loadUserData();
    loadData();
  }, [selectedDate]);

  const loadUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();
        
        setUser(userData);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [tasksData, staffData] = await Promise.all([
        loadTasks(),
        loadStaffPerformance()
      ]);
      
      calculateStats(tasksData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    const { data, error } = await supabase
      .from("daily_task_instances")
      .select(`
        *,
        sop_task: sop_tasks (
          *,
          category: sop_categories (name, color)
        ),
        assigned_user: users (id, name, email)
      `)
      .eq("date", selectedDate)
      .order("sop_task(order_index)");

    if (error) throw error;
    setTasks(data || []);
    return data || [];
  };

  const loadStaffPerformance = async () => {
    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        name,
        email,
        avatar_url,
        daily_task_instances!inner (
          status,
          date
        )
      `)
      .eq("role", "staff")
      .eq("daily_task_instances.date", selectedDate);

    if (error) throw error;
    
    const performance = data?.map(staff => {
      const staffTasks = staff.daily_task_instances || [];
      const completed = staffTasks.filter((t: any) => t.status === "completed").length;
      const pending = staffTasks.filter((t: any) => t.status === "pending").length;
      const completionRate = staffTasks.length > 0 ? (completed / staffTasks.length) * 100 : 0;
      
      return {
        id: staff.id,
        name: staff.name,
        completed,
        pending,
        completionRate,
        avatar_url: staff.avatar_url
      };
    }) || [];
    
    setStaffPerformance(performance);
    return performance;
  };

  const calculateStats = (tasksData: TaskInstance[]) => {
    const completed = tasksData.filter(t => t.status === "completed").length;
    const pending = tasksData.filter(t => t.status === "pending").length;
    const overdue = tasksData.filter(t => t.status === "overdue").length;
    const total = tasksData.length;
    
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const todaySubmissions = tasksData.filter(t => t.submission).length;
    
    const uniqueStaff = new Set(tasksData.map(t => t.assigned_user?.id).filter(Boolean)).size;
    
    setStats({
      totalTasks: total,
      completedTasks: completed,
      pendingTasks: pending,
      overdueTasks: overdue,
      activeStaff: uniqueStaff,
      totalStaff: staffPerformance.length,
      completionRate,
      avgCompletionTime: 0, // Calculate based on submission times
      todaySubmissions
    });
  };

  const handleUpdateAdminNote = async (taskId: string, note: string) => {
    try {
      setUpdating(true);
      
      const { error } = await supabase
        .from("task_submissions")
        .update({ admin_note: note })
        .eq("task_instance_id", taskId);

      if (error) throw error;
      
      toast.success("Admin note updated successfully");
      setSelectedTask(null);
      setAdminNote("");
      loadTasks();
    } catch (error) {
      console.error("Error updating admin note:", error);
      toast.error("Failed to update admin note");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success text-success-foreground";
      case "pending": return "bg-warning text-warning-foreground";
      case "overdue": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "pending": return <Clock className="w-4 h-4" />;
      case "overdue": return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.sop_task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.sop_task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assigned_user?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesShift = filterShift === "all" || task.shift === filterShift;
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    
    return matchesSearch && matchesShift && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PremiumHeader user={user} />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PremiumHeader 
        user={user} 
        title="Admin Dashboard"
        subtitle="Monitor operations and review submissions"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Date Selector */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gradient-primary">
              Operations Overview
            </h2>
            <Badge variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Badge>
          </div>
          
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="kpi-card-gradient">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Target className="w-8 h-8 opacity-80" />
                <div className="flex items-center text-green-300">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">12%</span>
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{stats.totalTasks}</div>
              <p className="text-sm opacity-80">Total Tasks</p>
            </CardContent>
          </Card>

          <Card className="kpi-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
                <div className="flex items-center text-success">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">8%</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-success mb-1">{stats.completedTasks}</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>

          <Card className="kpi-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-primary" />
                <div className="flex items-center text-primary">
                  <span className="text-sm">{stats.activeStaff}/{stats.totalStaff}</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-primary mb-1">{stats.activeStaff}</div>
              <p className="text-sm text-muted-foreground">Active Staff</p>
            </CardContent>
          </Card>

          <Card className="kpi-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Camera className="w-8 h-8 text-warning" />
                <div className="flex items-center text-warning">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">15%</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-warning mb-1">{stats.todaySubmissions}</div>
              <p className="text-sm text-muted-foreground">Today's Submissions</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 card-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Completion Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Completion</span>
                    <span className="font-medium">{stats.completionRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.completionRate} className="h-3" />
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-success/5 rounded-xl">
                    <div className="text-2xl font-bold text-success">{stats.completedTasks}</div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div className="p-3 bg-warning/5 rounded-xl">
                    <div className="text-2xl font-bold text-warning">{stats.pendingTasks}</div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div className="p-3 bg-destructive/5 rounded-xl">
                    <div className="text-2xl font-bold text-destructive">{stats.overdueTasks}</div>
                    <p className="text-xs text-muted-foreground">Overdue</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Staff Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staffPerformance.slice(0, 5).map((staff) => (
                  <div key={staff.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{staff.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {staff.completed} completed
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{staff.completionRate.toFixed(0)}%</div>
                      <Progress value={staff.completionRate} className="h-1 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="card-premium mb-8">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tasks, staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <select
                value={filterShift}
                onChange={(e) => setFilterShift(e.target.value)}
                className="px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Shifts</option>
                <option value="opening">Opening</option>
                <option value="middle">Middle</option>
                <option value="closing">Closing</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <Card className="card-premium">
              <CardContent className="text-center py-12">
                <div className="empty-state-icon">
                  <Activity className="w-16 h-16" />
                </div>
                <h3 className="empty-state-title">No tasks found</h3>
                <p className="empty-state-description">
                  Try adjusting your filters or search terms
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task) => (
              <Card 
                key={task.id} 
                className={cn(
                  "task-card",
                  task.status === "completed" && "ring-2 ring-success/20",
                  task.status === "overdue" && "ring-2 ring-destructive/20"
                )}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <Badge className={cn("gap-2", getStatusColor(task.status))}>
                          {getStatusIcon(task.status)}
                          <span className="capitalize font-medium">{task.status}</span>
                        </Badge>
                        
                        <Badge variant="outline" className="capitalize">
                          {task.shift}
                        </Badge>
                        
                        {task.sop_task.category && (
                          <Badge variant="outline">
                            {task.sop_task.category.name}
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {task.sop_task.title}
                      </h3>
                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        {task.sop_task.description}
                      </p>
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {task.assigned_user?.name || "Unassigned"}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Deadline: {task.deadline_time}
                        </span>
                      </div>

                      {task.submission && (
                        <div className="bg-success/5 border border-success/20 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="flex items-center gap-2 text-success font-medium">
                              <CheckCircle className="w-4 h-4" />
                              Completed
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(task.submission.submitted_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          
                          {task.submission.admin_note && (
                            <div className="bg-background rounded-lg p-3 border border-border/50">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium text-primary">Admin Note:</span>
                              </div>
                              <p className="text-sm text-foreground">{task.submission.admin_note}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-4 lg:w-40">
                      {task.submission?.photo_url ? (
                        <div className="relative group">
                          <Image
                            src={task.submission.photo_url}
                            alt="Task submission"
                            width={140}
                            height={140}
                            className="rounded-xl object-cover shadow-md transition-transform group-hover:scale-105 cursor-pointer"
                            onClick={() => setSelectedTask(task)}
                          />
                          <div className="absolute -top-2 -right-2 bg-success rounded-full p-2 shadow-lg">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-all flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-[140px] h-[140px] bg-muted/30 rounded-xl flex items-center justify-center">
                          <Camera className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      {task.submission && (
                        <Button
                          variant="outline"
                          onClick={() => setSelectedTask(task)}
                          className="w-full"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedTask && (
        <div className="modal-overlay">
          <Card className="w-full max-w-3xl mx-auto card-premium border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-primary to-primary-600 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Review Task Submission</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTask(null)}
                  className="text-white hover:bg-white/20"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    {selectedTask.sop_task.title}
                  </h4>
                  <p className="text-muted-foreground text-sm mb-4">
                    {selectedTask.sop_task.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Staff:</strong> {selectedTask.assigned_user?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Submitted:</strong> {selectedTask.submission?.submitted_at ? 
                          new Date(selectedTask.submission.submitted_at).toLocaleString('en-US') : 
                          'Not submitted'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {selectedTask.submission?.photo_url && (
                  <div>
                    <h5 className="font-medium text-foreground mb-3">Photo Evidence</h5>
                    <div className="relative rounded-xl overflow-hidden shadow-lg">
                      <Image
                        src={selectedTask.submission.photo_url}
                        alt="Task evidence"
                        width={400}
                        height={300}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              {selectedTask.sop_task.instruction && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-sm text-primary">
                    <strong>Instructions:</strong> {selectedTask.sop_task.instruction}
                  </p>
                </div>
              )}

              <div>
                <label className="font-medium text-foreground text-sm block mb-2">
                  Admin Note
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add your review or feedback..."
                  className="w-full p-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleUpdateAdminNote(selectedTask.id, adminNote)}
                  disabled={updating}
                  className="btn-premium flex-1"
                >
                  {updating ? "Saving..." : "Save Note"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedTask(null)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
