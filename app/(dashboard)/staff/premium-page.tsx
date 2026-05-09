"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PremiumHeader } from "@/components/layout/PremiumHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Camera, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Upload, 
  X, 
  Coffee, 
  Sunrise, 
  Moon, 
  Sun, 
  Target, 
  TrendingUp,
  Eye,
  Calendar,
  Filter,
  Search
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
  shift_preference?: string;
}

interface SOPTask {
  id: string;
  title: string;
  description: string;
  instruction: string;
  photo_required: boolean;
  order_index: number;
  category?: {
    name: string;
    color: string;
  };
}

interface TaskInstance {
  id: string;
  date: string;
  shift: string;
  status: string;
  deadline_time: string;
  sop_task: SOPTask;
  submission?: {
    id: string;
    photo_url: string;
    submitted_at: string;
    admin_note?: string;
  };
}

export default function PremiumStaffDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<TaskInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskInstance | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterShift, setFilterShift] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const supabase = createClient();

  useEffect(() => {
    loadUserData();
    loadTasks();
  }, []);

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

  const loadTasks = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data, error } = await supabase
        .from("daily_task_instances")
        .select(`
          *,
          sop_task: sop_tasks (
            *,
            category: sop_categories (name, color)
          )
        `)
        .eq("assigned_to", authUser.id)
        .eq("date", new Date().toISOString().split('T')[0])
        .order("sop_task(order_index)");

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPhoto = async (taskId: string, file: File) => {
    if (!file) return;

    try {
      setUploading(true);
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${taskId}-${Date.now()}.${fileExt}`;
      const filePath = `task-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('task-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('task-photos')
        .getPublicUrl(filePath);

      // Create submission record
      const { error: submissionError } = await supabase
        .from('task_submissions')
        .insert({
          task_instance_id: taskId,
          photo_url: publicUrl,
          submitted_at: new Date().toISOString(),
        });

      if (submissionError) throw submissionError;

      // Update task status
      const { error: updateError } = await supabase
        .from('daily_task_instances')
        .update({ status: 'completed' })
        .eq('id', taskId);

      if (updateError) throw updateError;

      toast.success("Task completed successfully!");
      setSelectedTask(null);
      loadTasks();
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
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

  const getShiftIcon = (shift: string) => {
    switch (shift) {
      case "opening": return <Sunrise className="w-4 h-4" />;
      case "middle": return <Sun className="w-4 h-4" />;
      case "closing": return <Moon className="w-4 h-4" />;
      default: return <Coffee className="w-4 h-4" />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.sop_task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.sop_task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesShift = filterShift === "all" || task.shift === filterShift;
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    
    return matchesSearch && matchesShift && matchesStatus;
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === "completed").length,
    pending: tasks.filter(t => t.status === "pending").length,
    overdue: tasks.filter(t => t.status === "overdue").length,
    completionRate: tasks.length > 0 ? (tasks.filter(t => t.status === "completed").length / tasks.length) * 100 : 0
  };

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
        title="Staff Dashboard"
        subtitle="Complete your daily SOP tasks"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="kpi-card-gradient">
            <CardContent className="p-4 text-center">
              <Target className="w-6 h-6 mx-auto mb-2 opacity-80" />
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm opacity-80">Total Tasks</p>
            </CardContent>
          </Card>

          <Card className="kpi-card">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-6 h-6 mx-auto mb-2 text-success" />
              <div className="text-2xl font-bold text-success">{stats.completed}</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>

          <Card className="kpi-card">
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-warning" />
              <div className="text-2xl font-bold text-warning">{stats.pending}</div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>

          <Card className="kpi-card">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold text-primary">{stats.completionRate.toFixed(0)}%</div>
              <p className="text-sm text-muted-foreground">Progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview */}
        <Card className="card-premium mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Today's Progress</h3>
              <span className="text-sm text-muted-foreground">
                {stats.completed} of {stats.total} tasks
              </span>
            </div>
            <Progress value={stats.completionRate} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>Completion Rate</span>
              <span className="font-medium">{stats.completionRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="card-premium mb-8">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tasks..."
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
                  <Coffee className="w-16 h-16" />
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
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <Badge className={cn("gap-2", getStatusColor(task.status))}>
                          {getStatusIcon(task.status)}
                          <span className="capitalize font-medium">{task.status}</span>
                        </Badge>
                        
                        <Badge variant="outline" className="gap-2">
                          {getShiftIcon(task.shift)}
                          <span className="capitalize">{task.shift}</span>
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
                      
                      {task.sop_task.instruction && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
                          <p className="text-sm text-primary">
                            <strong>Instructions:</strong> {task.sop_task.instruction}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Deadline: {task.deadline_time}
                        </span>
                        {task.sop_task.photo_required && (
                          <span className="flex items-center gap-2">
                            <Camera className="w-4 h-4" />
                            Photo Required
                          </span>
                        )}
                      </div>

                      {task.submission && (
                        <div className="mt-4 p-4 bg-success/5 border border-success/20 rounded-xl">
                          <div className="flex items-center justify-between">
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
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-4 sm:w-32">
                      {task.submission?.photo_url ? (
                        <div className="relative group">
                          <Image
                            src={task.submission.photo_url}
                            alt="Task completion"
                            width={120}
                            height={120}
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
                        <Button
                          onClick={() => setSelectedTask(task)}
                          className="btn-premium w-full"
                          disabled={task.status === "completed"}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Upload Photo
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

      {/* Upload Modal */}
      {selectedTask && (
        <div className="modal-overlay">
          <Card className="w-full max-w-md mx-auto card-premium border-0 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <h3 className="text-lg font-semibold">Upload Task Photo</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTask(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  {selectedTask.sop_task.title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {selectedTask.sop_task.description}
                </p>
              </div>

              {selectedTask.sop_task.instruction && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-sm text-primary">
                    <strong>Instructions:</strong> {selectedTask.sop_task.instruction}
                  </p>
                </div>
              )}

              <div className="upload-area">
                <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-foreground font-medium mb-2">
                  Upload photo evidence
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Take a clear photo of the completed task
                </p>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleUploadPhoto(selectedTask.id, file);
                    }
                  }}
                  className="hidden"
                  id="photo-upload"
                />
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                  disabled={uploading}
                >
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    {uploading ? "Uploading..." : "Choose Photo"}
                  </label>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
