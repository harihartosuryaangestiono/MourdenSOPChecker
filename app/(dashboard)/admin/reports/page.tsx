"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PremiumLayout } from "@/components/layout/PremiumLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Download, FileText, TrendingUp, Calendar, Activity, Clock,
  CheckCircle, AlertCircle, Users, BarChart2, Loader2, RefreshCw,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { cn } from "@/lib/utils";
import { PremiumLoading } from "@/components/common/PremiumLoading";
import { StatusBadge } from "@/components/common/StatusBadge";
import { toast } from "sonner";

const DATE_RANGES = [
  { label: "Today", value: 0 },
  { label: "7 Days", value: 7 },
  { label: "30 Days", value: 30 },
  { label: "90 Days", value: 90 },
];

export default function ReportsPage() {
  const [range, setRange] = useState(7);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  const [summary, setSummary] = useState({ total: 0, completed: 0, overdue: 0, rate: 0, avgStaff: 0 });
  const [dailyData, setDailyData] = useState<{ day: string; completed: number; total: number }[]>([]);
  const [staffData, setStaffData] = useState<{ name: string; completed: number; rate: number }[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const from = new Date(Date.now() - range * 86400000).toISOString().split("T")[0];
      const today = new Date().toISOString().split("T")[0];

      const { data: tasks } = await sb
        .from("daily_task_instances")
        .select(`
          id, date, status, shift, assigned_to,
          sop_task:sop_tasks(title),
          assigned_user:users!assigned_to(name),
          submission:task_submissions(submitted_at)
        `)
        .gte("date", range === 0 ? today : from)
        .lte("date", today)
        .order("date", { ascending: false });

      if (!tasks) return;

      const total = tasks.length;
      const completed = tasks.filter((t: any) => t.status === "completed" || t.status === "approved").length;
      const overdue = tasks.filter((t: any) => t.status === "overdue").length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      const staffMap: Record<string, { name: string; completed: number; total: number }> = {};
      tasks.forEach((t: any) => {
        const name = t.assigned_user?.name ?? "Unassigned";
        if (!staffMap[name]) staffMap[name] = { name, completed: 0, total: 0 };
        staffMap[name].total++;
        if (t.status === "completed" || t.status === "approved") staffMap[name].completed++;
      });
      const staffArr = Object.values(staffMap)
        .map((s) => ({ ...s, rate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0 }))
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 8);

      const dayMap: Record<string, { completed: number; total: number }> = {};
      tasks.forEach((t: any) => {
        if (!dayMap[t.date]) dayMap[t.date] = { completed: 0, total: 0 };
        dayMap[t.date].total++;
        if (t.status === "completed" || t.status === "approved") dayMap[t.date].completed++;
      });
      const days = Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, d]) => ({
          day: new Date(date).toLocaleDateString("id-ID", { month: "short", day: "numeric" }),
          ...d,
        }));

      setSummary({ total, completed, overdue, rate, avgStaff: Object.keys(staffMap).length });
      setDailyData(days);
      setStaffData(staffArr);
      setRecentTasks(tasks.slice(0, 10).map((t: any) => ({
        id: t.id,
        title: t.sop_task?.title ?? "Unknown",
        name: t.assigned_user?.name ?? "Unassigned",
        status: t.status,
        date: t.date,
        submitted_at: t.submission?.[0]?.submitted_at,
      })));
    } catch { toast.error("Failed to load report data"); }
    finally { setLoading(false); }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const exportCSV = async (type: string) => {
    setGenerating(type);
    try {
      const sb = createClient();
      const from = new Date(Date.now() - range * 86400000).toISOString().split("T")[0];
      const today = new Date().toISOString().split("T")[0];

      const { data } = await sb
        .from("daily_task_instances")
        .select(`
          date, shift, status,
          sop_task:sop_tasks(title),
          assigned_user:users!assigned_to(name),
          submission:task_submissions(submitted_at, notes)
        `)
        .gte("date", range === 0 ? today : from)
        .lte("date", today)
        .order("date");

      if (!data || data.length === 0) { toast.error("No data to export"); return; }

      const header = "Date,Shift,Task,Assigned To,Status,Submitted At,Notes";
      const rows = data.map((t: any) => [
        t.date,
        t.shift,
        (t.sop_task?.title ?? "").replace(/,/g, ";"),
        (t.assigned_user?.name ?? "Unassigned").replace(/,/g, ";"),
        t.status,
        t.submission?.[0]?.submitted_at ? new Date(t.submission[0].submitted_at).toLocaleString("id-ID") : "",
        (t.submission?.[0]?.notes ?? "").replace(/,/g, ";"),
      ].join(","));

      const csv = [header, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = type.replace(/ /g, "_").toLowerCase() + "_" + today + ".csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Report exported!");
    } catch { toast.error("Export failed"); }
    finally { setGenerating(null); }
  };

  const kpis = [
    { label: "Completion Rate", value: summary.rate + "%", icon: Activity, color: "text-primary", bg: "bg-primary/10" },
    { label: "Tasks Total", value: String(summary.total), icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Completed", value: String(summary.completed), icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Overdue", value: String(summary.overdue), icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
  ];

  const reportTypes = [
    { title: "Daily Completion Report", desc: "All task completions and photo submissions", icon: CheckCircle },
    { title: "Staff Performance Matrix", desc: "Individual rates, submission times, and trends", icon: Users },
    { title: "Overdue & Incident Log", desc: "All missed or late SOP tasks", icon: AlertCircle },
    { title: "Weekly Operations Summary", desc: "7-day aggregated operational metrics", icon: BarChart2 },
  ];

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <PremiumLoading />
    </div>
  );

  return (
    <PremiumLayout title="Reports & Analytics" subtitle="Operational performance data">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6 space-y-6">

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {DATE_RANGES.map((r) => (
              <Button
                key={r.value}
                size="sm"
                variant={range === r.value ? "default" : "secondary"}
                onClick={() => setRange(r.value)}
                className="rounded-full text-xs h-9"
              >
                {r.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} className="rounded-xl h-9 gap-1.5 text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
            <Button size="sm" onClick={() => exportCSV("Full Report")} disabled={!!generating} className="rounded-xl h-9 gap-1.5 text-xs">
              {generating === "Full Report" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Export CSV
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="border-border/40">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-xl flex-shrink-0", k.bg)}>
                    <k.icon className={cn("w-5 h-5", k.color)} />
                  </div>
                  <div>
                    <p className="text-xl font-black text-foreground">{k.value}</p>
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Daily Trend */}
          <div className="xl:col-span-2">
            <Card className="border-border/40">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-foreground text-sm">Daily Completion Trend</h3>
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                {dailyData.length === 0 ? (
                  <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
                    No data for this period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={dailyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 11 }}
                      />
                      <Area type="monotone" dataKey="total" stroke="hsl(var(--border))" strokeWidth={1} fill="none" strokeDasharray="3 3" />
                      <Area type="monotone" dataKey="completed" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#grad)"
                        dot={{ fill: "hsl(var(--primary))", r: 3, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Staff Performance */}
          <Card className="border-border/40">
            <CardContent className="p-5">
              <h3 className="font-semibold text-foreground text-sm mb-4">Staff Performance</h3>
              {staffData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No data available</p>
              ) : (
                <div className="space-y-3">
                  {staffData.map((s, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-bold text-primary">
                          {s.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate leading-none">{s.name}</p>
                        <div className="mt-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: s.rate + "%" }}
                            transition={{ duration: 0.8, delay: i * 0.05 }}
                            className={cn("h-full rounded-full", s.rate >= 80 ? "bg-emerald-500" : s.rate >= 60 ? "bg-amber-500" : "bg-rose-500")}
                          />
                        </div>
                      </div>
                      <span className={cn("text-xs font-bold flex-shrink-0", s.rate >= 80 ? "text-emerald-500" : s.rate >= 60 ? "text-amber-500" : "text-rose-500")}>
                        {s.rate}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Report Types */}
        <div className="grid sm:grid-cols-2 gap-3">
          {reportTypes.map((r, i) => (
            <Card key={i} className="border-border/40 hover:shadow-md transition-all">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2.5 bg-secondary/60 rounded-xl flex-shrink-0">
                  <r.icon className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.desc}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportCSV(r.title)}
                  disabled={!!generating}
                  className="flex-shrink-0 rounded-xl h-8 text-xs gap-1.5"
                >
                  {generating === r.title ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  Export
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Tasks Table */}
        <Card className="border-border/40">
          <CardContent className="p-0">
            <div className="px-5 py-4 border-b border-border/40">
              <h3 className="font-semibold text-foreground text-sm">Recent Task Log</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-secondary/30">
                  <tr>
                    {["Task", "Staff", "Date", "Status"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentTasks.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">No data</td></tr>
                  ) : (
                    recentTasks.map((t) => (
                      <tr key={t.id} className="border-t border-border/20 hover:bg-secondary/20">
                        <td className="px-4 py-3 font-medium text-foreground">{t.title}</td>
                        <td className="px-4 py-3 text-muted-foreground">{t.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{t.date}</td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PremiumLayout>
  );
}
