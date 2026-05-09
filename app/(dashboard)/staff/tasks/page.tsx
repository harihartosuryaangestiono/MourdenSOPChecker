"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { PremiumLayout } from "@/components/layout/PremiumLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Camera, CheckCircle, Clock, AlertCircle, Upload, X, 
  Coffee, Sunrise, Moon, Sun, Eye, ImageIcon,
  Calendar, Activity, CheckSquare, ShieldCheck, FileText, Loader2, ArrowRight, Target,
  Search, Filter, ListTodo, AlertOctagon, CheckCircle2, CircleDashed, ChevronRight, MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { cn, formatTime, STATUS_COLORS, type TaskStatus, formatDateTime } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { PremiumLoading } from "@/components/common/PremiumLoading";
import { UserAvatar } from "@/components/common/UserAvatar";

function ModernEmptyState({ icon: Icon, title, description, actionLabel, onAction }: any) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-secondary/10 border border-border/40 min-h-[300px] w-full">
      <div className="w-20 h-20 bg-secondary/30 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <Icon className="w-10 h-10 text-primary/70" />
      </div>
      <h3 className="text-2xl font-bold font-display mb-3">{title}</h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
        {description}
      </p>
      {actionLabel && (
        <Button variant="outline" className="rounded-xl px-6 py-5 gap-2 border-border/50 hover:bg-secondary/50 shadow-sm transition-all hover:shadow-md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

interface SOPTask {
  id: string;
  title: string;
  description: string;
  instruction: string;
  photo_required: boolean;
  order_index: number;
  deadline_time: string;
  status: TaskStatus;
  shift: "opening" | "closing";
  submission?: {
    id: string;
    photo_url: string;
    submitted_at: string;
    notes: string;
  };
  sop_task?: {
    id: string;
    title: string;
    description: string;
    instruction: string;
    photo_required: boolean;
    order_index: number;
    role_required: string;
    sop_template?: {
      title: string;
      priority?: "low" | "normal" | "high" | "critical";
      category?: {
        name: string;
        color: string;
        icon: string;
      };
    };
  };
}

export default function StaffDashboard() {
  const [tasks, setTasks] = useState<SOPTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<SOPTask | null>(null);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const [activeShift, setActiveShift] = useState<"opening" | "closing">("opening");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "completed" | "need_proof">("all");
  
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [checklist, setChecklist] = useState<boolean[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const supabase = createClient();
    fetchUserAndTasks();

    const channel = supabase
      .channel('tasks_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_task_instances' }, () => {
        fetchUserAndTasks(false);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (selectedTask) {
      const instructions = selectedTask.sop_task?.instruction || selectedTask.instruction || "";
      const steps = instructions.split('\n').filter(s => s.trim().length > 0);
      setChecklist(new Array(steps.length).fill(selectedTask.status === "completed"));
      setNotes(selectedTask.submission?.notes || "");
    }
  }, [selectedTask]);

  const fetchUserAndTasks = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const { data: profile } = await supabase
        .from("users")
        .select("role, shift_preference, name, avatar_url")
        .eq("id", user.id)
        .single();
      setUserProfile(profile);

      const today = new Date().toISOString().split('T')[0];
      const currentHour = new Date().getHours();
      let currentShift: "opening" | "closing" = 'opening';
      if (currentHour >= 16) currentShift = 'closing';
      
      if (showLoader) {
        setActiveShift(profile?.shift_preference === 'all' ? currentShift : (profile?.shift_preference || currentShift));
      }

      const { data: rawTasks, error } = await supabase
        .from("daily_task_instances")
        .select(`
          id, date, shift, status, deadline_time, assigned_to,
          sop_task:sop_tasks(
            id, title, description, instruction, photo_required, order_index, role_required,
            sop_template:sop_templates(
              title, category_id, priority,
              category:sop_categories(name, color, icon)
            )
          ),
          submission:task_submissions(id, photo_url, submitted_at, notes)
        `)
        .eq("date", today)
        .order("deadline_time", { ascending: true });

      if (error) throw error;

      if (rawTasks) {
        const transformedTasks = rawTasks.map((t: any) => ({
          ...t,
          submission: t.submission?.[0] || null,
        }));
        setTasks(transformedTasks);
      }
    } catch (error: any) {
      if (showLoader) toast.error("Failed to load tasks");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string, file?: File) => {
    setUploading(true);
    try {
      const supabase = createClient();
      let publicUrl = null;
      let photoPath = null;
      
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${taskId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("task-photos")
          .upload(fileName, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("task-photos").getPublicUrl(fileName);
        publicUrl = data.publicUrl;
        photoPath = fileName;
      }

      const needsPhoto = selectedTask?.sop_task?.photo_required || selectedTask?.photo_required;

      if (publicUrl || notes || !needsPhoto) {
        await supabase
          .from("task_submissions")
          .insert({
            task_instance_id: taskId,
            submitted_by: user.id,
            photo_url: publicUrl || "",
            photo_path: photoPath || "",
            notes: notes || "Completed via App",
          });
      }

      await supabase
        .from("daily_task_instances")
        .update({ 
          status: "completed",
          completed_at: new Date().toISOString(),
          completed_by: user.id,
          assigned_to: user.id 
        })
        .eq("id", taskId);

      toast.success("Task completed! 🎉");
      setSelectedTask(null);
      fetchUserAndTasks(false);
    } catch (error: any) {
      toast.error("Failed to complete task.");
    } finally {
      setUploading(false);
    }
  };

  const shiftTasks = useMemo(() => tasks.filter(t => t.shift === activeShift), [tasks, activeShift]);
  
  const filteredTasks = useMemo(() => {
    return shiftTasks.filter(t => {
      const matchesSearch = (t.sop_task?.title || t.title).toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      
      if (activeFilter === "completed") return t.status === "completed";
      if (activeFilter === "pending") return t.status === "pending" || t.status === "in_progress";
      if (activeFilter === "need_proof") return t.status !== "completed" && (t.sop_task?.photo_required || t.photo_required);
      return true;
    }).sort((a, b) => {
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;
      return (a.deadline_time || "23:59") > (b.deadline_time || "23:59") ? 1 : -1;
    });
  }, [shiftTasks, searchQuery, activeFilter]);

  const stats = {
    total: shiftTasks.length,
    completed: shiftTasks.filter(t => t.status === "completed").length,
    pending: shiftTasks.filter(t => t.status === "pending" || t.status === "in_progress").length,
    overdue: shiftTasks.filter(t => t.status === "overdue").length,
  };
  const progressPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  if (loading) return <div className="flex h-screen items-center justify-center bg-background"><PremiumLoading /></div>;

  const instructions = selectedTask?.sop_task?.instruction || selectedTask?.instruction || "";
  const steps = instructions.split('\n').filter(s => s.trim().length > 0);
  const allStepsChecked = steps.length === 0 || checklist.every(Boolean);
  const needsPhoto = selectedTask?.sop_task?.photo_required || selectedTask?.photo_required;

  return (
    <PremiumLayout showSidebar={false} title="SOP Execution" subtitle="Your daily operational tasks">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-8">
        
        {/* HEADER SECTION */}
        <section className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-2 md:-mt-6">
            <div className="flex items-center gap-4">
              <UserAvatar name={userProfile?.name || user?.email || ""} avatarUrl={userProfile?.avatar_url} className="w-14 h-14 ring-2 ring-primary/20 shadow-lg" />
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
                  Ready for action, {userProfile?.name?.split(' ')[0] || 'Team'}?
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-secondary/30 p-2 rounded-2xl border border-border/40 shadow-sm backdrop-blur-sm">
              {(['opening', 'closing'] as const).map((shift) => (
                <button
                  key={shift}
                  onClick={() => setActiveShift(shift)}
                  className={cn(
                    "relative px-6 py-2.5 rounded-xl text-sm font-bold transition-all capitalize flex items-center gap-2",
                    activeShift === shift ? "text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  {activeShift === shift && (
                    <motion.div
                      layoutId="activeShift"
                      className="absolute inset-0 bg-primary rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {shift === 'opening' ? <Sunrise className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    {shift}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* STATS & PROGRESS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Tasks", value: stats.total, icon: ListTodo, color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { label: "Pending", value: stats.pending, icon: CircleDashed, color: "text-amber-500", bg: "bg-amber-500/10" },
              { label: "Overdue", value: stats.overdue, icon: AlertOctagon, color: "text-rose-500", bg: "bg-rose-500/10" }
            ].map((stat, i) => (
              <Card key={i} className="border-border/40 bg-card/40 backdrop-blur-md shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn("p-3 rounded-2xl", stat.bg)}>
                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-black">{stat.value}</p>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-card/40 backdrop-blur-md border border-border/40 p-5 rounded-3xl shadow-sm">
            <div className="flex justify-between items-end mb-3">
              <div>
                <h3 className="font-bold text-foreground">Shift Progress</h3>
                <p className="text-sm text-muted-foreground">You've completed {stats.completed} out of {stats.total} tasks.</p>
              </div>
              <span className="text-3xl font-black text-primary font-display">{progressPercent}%</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden border border-border/50">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
              />
            </div>
          </div>
        </section>

        {/* FILTERS */}
        <section className="flex flex-col md:flex-row gap-4 justify-between items-center sticky top-4 z-30 bg-background/95 backdrop-blur-xl p-3 rounded-2xl border border-border/40 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 hide-scrollbar">
            {[
              { id: "all", label: "All Tasks" },
              { id: "pending", label: "Pending" },
              { id: "completed", label: "Completed" },
              { id: "need_proof", label: "Needs Proof" }
            ].map((f) => (
              <Button
                key={f.id}
                variant={activeFilter === f.id ? "default" : "secondary"}
                size="sm"
                className={cn("rounded-full px-4 text-xs font-bold transition-all shrink-0", activeFilter === f.id ? "shadow-md" : "hover:bg-secondary/80")}
                onClick={() => setActiveFilter(f.id as any)}
              >
                {f.label}
              </Button>
            ))}
          </div>
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary/40 border-transparent focus:bg-background focus:border-primary rounded-xl h-9 text-sm transition-all"
            />
          </div>
        </section>

        {/* TASK GRID */}
        <section>
          <AnimatePresence mode="popLayout">
            {filteredTasks.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ModernEmptyState 
                  icon={CheckCircle2}
                  title={searchQuery ? "No matching tasks found" : "You're All Caught Up!"}
                  description={searchQuery ? "Try adjusting your search or filters." : "There are no tasks remaining in this view. Great job maintaining operational excellence."}
                />
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
                {filteredTasks.map((task, i) => {
                  const isCompleted = task.status === "completed";
                  const priority = task.sop_task?.sop_template?.priority || "normal";
                  const priorityColors = {
                    critical: "text-rose-600 bg-rose-600/10 border-rose-600/20",
                    high: "text-orange-500 bg-orange-500/10 border-orange-500/20",
                    normal: "text-amber-500 bg-amber-500/10 border-amber-500/20",
                    low: "text-blue-500 bg-blue-500/10 border-blue-500/20"
                  };
                  
                  return (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      onClick={() => setSelectedTask(task)}
                      className="h-full"
                    >
                      <Card className={cn(
                        "group h-full flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-border/40 overflow-hidden relative",
                        isCompleted ? "bg-secondary/10 opacity-75" : "bg-card/60 backdrop-blur-sm hover:border-primary/50"
                      )}>
                        {/* Status accent bar */}
                        <div className={cn(
                          "absolute top-0 left-0 w-full h-1 transition-colors",
                          isCompleted ? "bg-emerald-500" : task.status === "overdue" ? "bg-rose-500" : "bg-primary/50 group-hover:bg-primary"
                        )} />
                        
                        <CardContent className="p-5 flex flex-col h-full pt-6">
                          <div className="flex justify-between items-start mb-3 gap-2">
                            <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold border", priorityColors[priority as keyof typeof priorityColors])}>
                              {priority}
                            </Badge>
                            
                            <div className="flex items-center text-[11px] font-bold text-muted-foreground bg-secondary px-2 py-1 rounded-md border border-border/50">
                              <Clock className="w-3 h-3 mr-1" />
                              {task.deadline_time ? formatTime(task.deadline_time) : "No Deadline"}
                            </div>
                          </div>

                          <h3 className={cn(
                            "font-bold text-base mb-1.5 leading-tight transition-colors group-hover:text-primary",
                            isCompleted && "line-through decoration-emerald-500/40 text-muted-foreground"
                          )}>
                            {task.sop_task?.title || task.title}
                          </h3>
                          
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-grow leading-relaxed">
                            {task.sop_task?.description || task.description}
                          </p>

                          <div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between">
                            {isCompleted ? (
                              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                                <ShieldCheck className="w-4 h-4" /> Completed
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
                                {(task.sop_task?.photo_required || task.photo_required) ? (
                                  <><Camera className="w-4 h-4" /> Proof Required</>
                                ) : (
                                  <><CheckSquare className="w-4 h-4" /> Checklist</>
                                )}
                              </div>
                            )}
                            
                            <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all group-hover:shadow-md">
                              {isCompleted ? <Eye className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* TASK DETAIL MODAL */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 md:p-8"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl h-[95vh] sm:h-auto sm:max-h-[90vh] bg-background sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden border border-border/50 relative"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between bg-card/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-xl shadow-inner", selectedTask.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary')}>
                    {selectedTask.status === 'completed' ? <ShieldCheck className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="font-bold text-lg leading-none tracking-tight">Task Execution</h2>
                    <p className="text-xs text-muted-foreground mt-1">SOP Guidelines & Proof</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedTask(null)} className="rounded-full bg-secondary/50 hover:bg-secondary transition-transform hover:rotate-90">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gradient-to-b from-background to-secondary/10 hide-scrollbar pb-32 sm:pb-6">
                
                {/* Title & Desc */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Badge variant="secondary" className="font-bold text-xs uppercase tracking-wider border-border/50 shadow-sm">
                      {selectedTask.sop_task?.sop_template?.category?.name || "General"}
                    </Badge>
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-md border border-border/40">
                      <Clock className="w-3.5 h-3.5" /> 
                      {selectedTask.deadline_time ? `Due ${formatTime(selectedTask.deadline_time)}` : "No Deadline"}
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-foreground mb-3 font-display tracking-tight leading-tight">
                    {selectedTask.sop_task?.title || selectedTask.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base bg-secondary/20 p-4 rounded-2xl border border-border/30">
                    {selectedTask.sop_task?.description || selectedTask.description}
                  </p>
                </div>

                {/* Checklist */}
                {steps.length > 0 && (
                  <div className="bg-card border border-border/40 rounded-3xl p-5 shadow-sm">
                    <h4 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                      <CheckSquare className="w-4 h-4 text-primary" /> Action Checklist
                    </h4>
                    <div className="space-y-2.5">
                      {steps.map((step, idx) => (
                        <label key={idx} className={cn(
                          "flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer group",
                          checklist[idx] ? "bg-emerald-500/5 border-emerald-500/20" : "bg-secondary/30 border-border/40 hover:border-primary/40 hover:bg-secondary/50"
                        )}>
                          <div className="mt-0.5 flex-shrink-0 relative">
                            <input 
                              type="checkbox" 
                              className="peer sr-only"
                              checked={checklist[idx] || false}
                              onChange={(e) => {
                                const newChecklist = [...checklist];
                                newChecklist[idx] = e.target.checked;
                                setChecklist(newChecklist);
                              }}
                              disabled={selectedTask.status === "completed"}
                            />
                            <div className="w-5 h-5 rounded border-2 border-muted-foreground/40 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center">
                              <CheckCircle2 className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
                            </div>
                          </div>
                          <span className={cn(
                            "text-sm font-medium leading-relaxed transition-all",
                            checklist[idx] ? "text-emerald-500/80 line-through" : "text-foreground group-hover:text-primary"
                          )}>
                            {step}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verification Section */}
                <div className="space-y-4">
                  <h4 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-primary" /> Task Verification
                  </h4>
                  
                  {selectedTask.status === "completed" ? (
                    <div className="bg-card border border-border/40 rounded-3xl p-5 shadow-sm space-y-5">
                      {selectedTask.submission?.photo_url && (
                        <div 
                          className="relative aspect-video rounded-2xl overflow-hidden border border-border/50 shadow-inner group cursor-pointer"
                          onClick={() => setIsPhotoModalOpen(true)}
                        >
                          <Image src={selectedTask.submission.photo_url} alt="Proof" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                            <div className="bg-background/90 backdrop-blur-md p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 shadow-xl">
                              <Eye className="w-5 h-5 text-foreground" />
                            </div>
                          </div>
                          <div className="absolute top-3 left-3 bg-emerald-500/90 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 shadow-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified Proof
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-secondary/40 p-4 rounded-2xl border border-border/40 flex gap-4">
                        <MessageSquare className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Completion Notes</p>
                          <p className="text-sm font-medium leading-relaxed">{selectedTask.submission?.notes || "No notes provided."}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-card border border-border/40 rounded-3xl p-5 shadow-sm space-y-5">
                      {!allStepsChecked && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-bold rounded-xl flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          Complete all checklist items above first.
                        </div>
                      )}
                      
                      {needsPhoto ? (
                        <div className={cn(
                          "relative border-2 border-dashed rounded-2xl overflow-hidden transition-all duration-300 group",
                          allStepsChecked ? "border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary cursor-pointer" : "border-border/30 bg-secondary/20 opacity-50 cursor-not-allowed"
                        )}>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            disabled={uploading || !allStepsChecked}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleCompleteTask(selectedTask.id, file);
                            }}
                          />
                          <div className="p-8 flex flex-col items-center justify-center text-center">
                            {uploading ? (
                              <div className="space-y-4 animate-in fade-in duration-300">
                                <div className="w-14 h-14 bg-background shadow-md rounded-2xl flex items-center justify-center mx-auto border border-border/50">
                                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                </div>
                                <div>
                                  <p className="font-bold text-foreground">Uploading Proof...</p>
                                  <p className="text-xs text-muted-foreground mt-1">Please keep this open</p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="w-14 h-14 bg-background shadow-sm rounded-2xl flex items-center justify-center mx-auto border border-border/50 group-hover:scale-110 transition-transform duration-300">
                                  <Camera className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                  <p className="font-bold text-foreground">Tap to Upload Photo</p>
                                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto leading-relaxed">
                                    Take a clear photo showing the completed task area
                                  </p>
                                </div>
                                <Button size="sm" className="pointer-events-none rounded-full px-6 shadow-md mt-2">
                                  Open Camera
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-bold text-muted-foreground mb-2 block uppercase tracking-wider">Completion Notes (Optional)</label>
                            <textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              disabled={!allStepsChecked || uploading}
                              placeholder="Any issues or notes during execution?"
                              className="w-full bg-secondary/30 border border-border/40 rounded-2xl p-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all min-h-[100px] resize-none"
                            />
                          </div>
                          <Button 
                            className="w-full rounded-2xl py-6 text-base font-bold shadow-lg hover:shadow-xl transition-all gap-2"
                            disabled={!allStepsChecked || uploading}
                            onClick={() => handleCompleteTask(selectedTask.id)}
                          >
                            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                            Mark as Completed
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Photo Modal */}
      <AnimatePresence>
        {isPhotoModalOpen && selectedTask?.submission && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-xl"
            onClick={() => setIsPhotoModalOpen(false)}
          >
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full z-10"
              onClick={(e) => { e.stopPropagation(); setIsPhotoModalOpen(false); }}
            >
              <X className="w-6 h-6" />
            </Button>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="relative w-full max-w-4xl aspect-[4/3] sm:aspect-video rounded-xl overflow-hidden m-4 border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={selectedTask.submission.photo_url}
                alt="Fullscreen proof"
                fill
                className="object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </PremiumLayout>
  );
}
