const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

function w(rel, code) {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, code, 'utf8');
  console.log('✓', rel);
}

// ─── Admin Dashboard ───────────────────────────────────────────────────────────
w('app/(dashboard)/admin/page.tsx', `"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PremiumLayout } from "@/components/layout/PremiumLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Clock, AlertCircle, Camera, Eye, Users, Activity,
  Search, X, MessageSquare, ArrowUpRight, CheckSquare, CircleDashed,
  ListTodo, AlertOctagon, RefreshCw, Loader2, ChevronRight, Star
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { cn, formatTime, formatDateTime } from "@/lib/utils";
import { PremiumLoading } from "@/components/common/PremiumLoading";
import { StatusBadge } from "@/components/common/StatusBadge";

interface TaskInstance {
  id: string;
  date: string;
  shift: string;
  status: string;
  deadline_time: string;
  submission?: {
    id: string; photo_url: string; submitted_at: string;
    notes: string; admin_note: string;
  };
  sop_task?: {
    title: string; description: string; photo_required: boolean;
    sop_template?: { title: string; category?: { name: string; color: string } };
  };
  assigned_user?: { id: string; name: string; avatar_url: string; role: string };
}

interface Staff {
  id: string; name: string; role: string; avatar_url?: string;
  completed: number; total: number; rate: number;
}

export default function AdminDashboard() {
  const [tasks, setTasks] = useState<TaskInstance[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewTask, setReviewTask] = useState<TaskInstance | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState("");
  const [shiftFilter, setShiftFilter] = useState<"all" | "opening" | "closing" | "daily">("all");

  const load = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const sb = createClient();
      const today = new Date().toISOString().split("T")[0];

      const { data: tasksData } = await sb
        .from("daily_task_instances")
        .select(\`
          id, date, shift, status, deadline_time,
          sop_task:sop_tasks(
            title, description, photo_required,
            sop_template:sop_templates(title, category:sop_categories(name, color))
          ),
          assigned_user:users!assigned_to(id, name, avatar_url, role),
          submission:task_submissions(id, photo_url, submitted_at, notes, admin_note)
        \`)
        .eq("date", today)
        .order("deadline_time", { ascending: true });

      const { data: staffData } = await sb
        .from("users")
        .select("id, name, role, avatar_url")
        .in("role", ["staff", "admin"])
        .eq("is_active", true);

      if (tasksData) {
        setTasks(tasksData.map((t: any) => ({ ...t, submission: t.submission?.[0] ?? null })));
      }

      if (staffData && tasksData) {
        const enriched: Staff[] = staffData.map((s: any) => {
          const userTasks = (tasksData as any[]).filter((t) => t.assigned_user?.id === s.id);
          const completed = userTasks.filter((t) => t.status === "completed").length;
          const total = userTasks.length;
          return { ...s, completed, total, rate: total > 0 ? Math.round((completed / total) * 100) : 0 };
        });
        setStaff(enriched.sort((a, b) => b.rate - a.rate));
      }
    } catch {
      toast.error("Gagal memuat data.");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const sb = createClient();
    const channel = sb
      .channel("admin_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_task_instances" }, () => load(false))
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [load]);

  const handleReview = async (action: "approved" | "rejected") => {
    if (!reviewTask) return;
    setProcessing(true);
    try {
      const sb = createClient();
      await sb
        .from("daily_task_instances")
        .update({ status: action, updated_at: new Date().toISOString() })
        .eq("id", reviewTask.id);
      if (reviewTask.submission?.id && adminNote) {
        await sb
          .from("task_submissions")
          .update({ admin_note: adminNote, reviewed_at: new Date().toISOString() })
          .eq("id", reviewTask.submission.id);
      }
      toast.success(action === "approved" ? "Task disetujui!" : "Task ditolak.");
      setReviewTask(null);
      setAdminNote("");
      load(false);
    } catch {
      toast.error("Gagal memproses review.");
    } finally {
      setProcessing(false);
    }
  };

  const filtered = tasks.filter((t) => {
    const matchSearch = (t.sop_task?.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.assigned_user?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchShift = shiftFilter === "all" || t.shift === shiftFilter;
    return matchSearch && matchShift;
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    pending: tasks.filter((t) => t.status === "pending").length,
    overdue: tasks.filter((t) => t.status === "overdue").length,
    submitted: tasks.filter((t) => t.status === "submitted").length,
    rate: tasks.length > 0 ? Math.round((tasks.filter((t) => t.status === "completed" || t.status === "approved").length / tasks.length) * 100) : 0,
  };

  const pendingReview = tasks.filter((t) => t.status === "submitted" && t.submission);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <PremiumLoading />
    </div>
  );

  return (
    <PremiumLayout title="Operations Center" subtitle="Monitor & review daily SOP execution">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6 space-y-6">

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Completion Rate", value: stats.rate + "%", icon: Activity, color: "text-primary", bg: "bg-primary/10" },
            { label: "Pending Review", value: String(stats.submitted), icon: Eye, color: "text-amber-500", bg: "bg-amber-500/10", highlight: stats.submitted > 0 },
            { label: "Tasks Today", value: String(stats.total), icon: ListTodo, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Overdue", value: String(stats.overdue), icon: AlertOctagon, color: "text-rose-500", bg: "bg-rose-500/10", highlight: stats.overdue > 0 },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className={cn("border-border/40 transition-all", s.highlight && "ring-1 ring-amber-500/30")}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-xl flex-shrink-0", s.bg)}>
                    <s.icon className={cn("w-5 h-5", s.color)} />
                  </div>
                  <div>
                    <p className="text-xl font-black text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                  </div>
                  {s.highlight && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Task List */}
          <div className="xl:col-span-2 space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari task atau staff..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 rounded-xl bg-secondary/50 border-transparent focus:border-primary text-sm"
                />
              </div>
              <div className="flex gap-1.5">
                {(["all", "opening", "closing", "daily"] as const).map((s) => (
                  <Button
                    key={s}
                    variant={shiftFilter === s ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setShiftFilter(s)}
                    className="rounded-full capitalize text-xs h-9"
                  >
                    {s === "all" ? "All Shifts" : s}
                  </Button>
                ))}
              </div>
              <Button variant="ghost" size="icon" onClick={() => load(false)} className="h-9 w-9 rounded-xl">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-center py-12 text-muted-foreground text-sm"
                  >
                    No tasks found
                  </motion.div>
                ) : (
                  filtered.map((task, i) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <Card className={cn(
                        "border-border/40 hover:border-border/70 transition-all",
                        task.status === "submitted" && "ring-1 ring-amber-500/20 bg-amber-500/[0.02]"
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Photo thumbnail */}
                            {task.submission?.photo_url ? (
                              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-border/50">
                                <img
                                  src={task.submission.photo_url}
                                  alt="proof"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center flex-shrink-0">
                                <Camera className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="text-sm font-semibold text-foreground truncate leading-tight">
                                  {task.sop_task?.title ?? "Unnamed Task"}
                                </p>
                                <StatusBadge status={task.status} className="flex-shrink-0" />
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {task.assigned_user?.name ?? "Unassigned"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {task.deadline_time ? formatTime(task.deadline_time) : "—"}
                                </span>
                                <span className="capitalize px-1.5 py-0.5 bg-secondary rounded-md font-medium">
                                  {task.shift}
                                </span>
                              </div>
                            </div>

                            {task.status === "submitted" && task.submission && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setReviewTask(task); setAdminNote(""); }}
                                className="flex-shrink-0 rounded-xl h-8 text-xs gap-1.5 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                              >
                                <Eye className="w-3.5 h-3.5" /> Review
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Staff Performance */}
            <Card className="border-border/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">Staff Performance</h3>
                  <Star className="w-4 h-4 text-primary" />
                </div>
                {staff.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No staff data</p>
                ) : (
                  <div className="space-y-3">
                    {staff.slice(0, 6).map((s, i) => (
                      <div key={s.id} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground w-4 flex-shrink-0">{i + 1}</span>
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-primary">
                            {s.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-xs font-medium text-foreground truncate">{s.name}</p>
                            <span className={cn(
                              "text-[10px] font-bold",
                              s.rate >= 80 ? "text-emerald-500" : s.rate >= 60 ? "text-amber-500" : "text-rose-500"
                            )}>
                              {s.rate}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: s.rate + "%" }}
                              transition={{ duration: 0.8, delay: i * 0.05 }}
                              className={cn(
                                "h-full rounded-full",
                                s.rate >= 80 ? "bg-emerald-500" : s.rate >= 60 ? "bg-amber-500" : "bg-rose-500"
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shift Summary */}
            <Card className="border-border/40">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4">Shift Summary</h3>
                <div className="space-y-3">
                  {(["opening", "closing", "daily"] as const).map((shift) => {
                    const shiftTasks = tasks.filter((t) => t.shift === shift);
                    const done = shiftTasks.filter((t) => t.status === "completed" || t.status === "approved").length;
                    const pct = shiftTasks.length > 0 ? Math.round((done / shiftTasks.length) * 100) : 0;
                    return (
                      <div key={shift}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-foreground capitalize">{shift}</span>
                          <span className="text-xs text-muted-foreground">{done}/{shiftTasks.length}</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: pct + "%" }}
                            transition={{ duration: 0.8 }}
                            className="h-full bg-primary rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-6"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-lg bg-background rounded-t-3xl sm:rounded-3xl border border-border/50 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                <div>
                  <h3 className="font-semibold text-foreground">Review Submission</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {reviewTask.assigned_user?.name} · {reviewTask.sop_task?.title}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setReviewTask(null)} className="rounded-full h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {reviewTask.submission?.photo_url && (
                  <div className="aspect-video rounded-2xl overflow-hidden border border-border/50">
                    <img
                      src={reviewTask.submission.photo_url}
                      alt="Proof"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {reviewTask.submission?.notes && (
                  <div className="flex gap-3 bg-secondary/50 rounded-xl p-3.5">
                    <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Staff Notes</p>
                      <p className="text-sm text-foreground">{reviewTask.submission.notes}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    Admin Note (optional)
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Tambahkan catatan untuk staff..."
                    className="w-full h-24 px-3 py-2.5 text-sm bg-secondary/50 border border-border/50 rounded-xl resize-none focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="px-5 py-4 border-t border-border/40 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl border-rose-500/30 text-rose-600 hover:bg-rose-500/10"
                  onClick={() => handleReview("rejected")}
                  disabled={processing}
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  Tolak
                </Button>
                <Button
                  className="flex-1 rounded-xl"
                  onClick={() => handleReview("approved")}
                  disabled={processing}
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Setujui
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PremiumLayout>
  );
}
`);

console.log('Done! Admin dashboard generated.');
