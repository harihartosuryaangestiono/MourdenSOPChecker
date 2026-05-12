const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

function w(rel, code) {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, code, 'utf8');
  console.log('✓', rel);
}

// ─── Owner Dashboard ───────────────────────────────────────────────────────────
w('app/(dashboard)/owner/page.tsx', `"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PremiumLayout } from "@/components/layout/PremiumLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  TrendingUp, Users, CheckCircle, Clock, AlertCircle,
  ArrowUpRight, Activity, Calendar, Coffee, Star, Target,
  ChevronUp, ChevronDown
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from "recharts";
import { cn } from "@/lib/utils";
import { PremiumLoading } from "@/components/common/PremiumLoading";

const weeklyData = [
  { day: "Sen", completion: 85, target: 90 },
  { day: "Sel", completion: 92, target: 90 },
  { day: "Rab", completion: 78, target: 90 },
  { day: "Kam", completion: 95, target: 90 },
  { day: "Jum", completion: 88, target: 90 },
  { day: "Sab", completion: 90, target: 90 },
  { day: "Min", completion: 82, target: 90 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-3 shadow-lg">
        <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-xs text-muted-foreground">
            <span style={{ color: p.color }} className="font-bold">{p.value}%</span>{" "}
            {p.name === "completion" ? "completed" : "target"}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function OwnerDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0, completed: 0, pending: 0, overdue: 0, rate: 0, activeStaff: 0
  });
  const [staffLeaderboard, setStaffLeaderboard] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [period, setPeriod] = useState<"today" | "week">("today");

  useEffect(() => {
    (async () => {
      try {
        const sb = createClient();
        const today = new Date().toISOString().split("T")[0];

        const { data: tasks } = await sb
          .from("daily_task_instances")
          .select(\`
            id, status, shift, assigned_to,
            assigned_user:users!assigned_to(id, name, role),
            submission:task_submissions(id, submitted_at)
          \`)
          .eq("date", today);

        const { data: staffList } = await sb
          .from("users")
          .select("id, name, role")
          .in("role", ["staff", "admin"])
          .eq("is_active", true);

        if (tasks) {
          const total = tasks.length;
          const completed = tasks.filter((t: any) => t.status === "completed" || t.status === "approved").length;
          const overdue = tasks.filter((t: any) => t.status === "overdue").length;
          const pending = tasks.filter((t: any) => t.status === "pending").length;
          const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

          setStats({ totalTasks: total, completed, pending, overdue, rate, activeStaff: staffList?.length ?? 0 });

          const staffMap: Record<string, { name: string; role: string; completed: number; total: number }> = {};
          tasks.forEach((t: any) => {
            const uid = t.assigned_to;
            if (!uid) return;
            if (!staffMap[uid]) {
              staffMap[uid] = { name: t.assigned_user?.name ?? "Unknown", role: t.assigned_user?.role ?? "staff", completed: 0, total: 0 };
            }
            staffMap[uid].total++;
            if (t.status === "completed" || t.status === "approved") staffMap[uid].completed++;
          });

          const lb = Object.entries(staffMap).map(([id, s]) => ({
            id, ...s, rate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0
          })).sort((a, b) => b.rate - a.rate);
          setStaffLeaderboard(lb);

          const recent = tasks
            .filter((t: any) => t.submission?.[0])
            .slice(0, 5)
            .map((t: any) => ({
              id: t.id,
              name: t.assigned_user?.name ?? "Unknown",
              status: t.status,
              time: t.submission?.[0]?.submitted_at
                ? new Date(t.submission[0].submitted_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                : "—",
            }));
          setRecentActivity(recent);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <PremiumLoading />
    </div>
  );

  const kpis = [
    { label: "Completion Rate", value: stats.rate + "%", icon: Target, color: "text-primary", bg: "bg-primary/10", trend: "+3.2%", up: true },
    { label: "Tasks Completed", value: String(stats.completed), icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10", trend: stats.completed + "/" + stats.totalTasks, up: true },
    { label: "Active Staff", value: String(stats.activeStaff), icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", trend: "on shift", up: true },
    { label: "Overdue", value: String(stats.overdue), icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10", trend: stats.overdue > 0 ? "needs action" : "all good", up: stats.overdue === 0 },
  ];

  return (
    <PremiumLayout title="Owner Analytics" subtitle={"Mourden Café · " + new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}>
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6 space-y-6">

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card className="border-border/40 hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("p-2 rounded-xl", k.bg)}>
                      <k.icon className={cn("w-4 h-4", k.color)} />
                    </div>
                    <div className={cn("flex items-center gap-0.5 text-[10px] font-semibold", k.up ? "text-emerald-500" : "text-rose-500")}>
                      {k.up ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {k.trend}
                    </div>
                  </div>
                  <p className="text-2xl font-black text-foreground">{k.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Weekly Chart */}
          <div className="xl:col-span-2">
            <Card className="border-border/40">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Weekly Completion Rate</h3>
                    <p className="text-xs text-muted-foreground">vs. 90% target</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-primary rounded-full inline-block" />
                      Actual
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-border rounded-full inline-block" />
                      Target
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="target"
                      stroke="hsl(var(--border))"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fill="none"
                    />
                    <Area
                      type="monotone"
                      dataKey="completion"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#colorCompletion)"
                      dot={{ fill: "hsl(var(--primary))", r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Staff Leaderboard */}
          <Card className="border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground text-sm">Staff Leaderboard</h3>
                <Star className="w-4 h-4 text-primary" />
              </div>
              {staffLeaderboard.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No data yet today
                </div>
              ) : (
                <div className="space-y-3">
                  {staffLeaderboard.slice(0, 6).map((s, i) => (
                    <div key={s.id} className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full text-[10px] font-black",
                        i === 0 ? "bg-yellow-500/20 text-yellow-600" :
                        i === 1 ? "bg-zinc-400/20 text-zinc-500" :
                        i === 2 ? "bg-orange-500/20 text-orange-600" :
                        "text-muted-foreground"
                      )}>
                        {i + 1}
                      </div>
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-primary">
                          {s.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate leading-none">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{s.completed}/{s.total} tasks</p>
                      </div>
                      <span className={cn(
                        "text-xs font-bold flex-shrink-0",
                        s.rate >= 80 ? "text-emerald-500" : s.rate >= 60 ? "text-amber-500" : "text-rose-500"
                      )}>
                        {s.rate}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity + Shift Bar Chart */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Shift Breakdown Chart */}
          <div className="xl:col-span-2">
            <Card className="border-border/40">
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground text-sm mb-5">Shift Breakdown</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    data={[
                      { shift: "Opening", completed: stats.completed, pending: stats.pending, overdue: stats.overdue },
                      { shift: "Closing", completed: Math.floor(stats.completed * 0.6), pending: Math.floor(stats.pending * 0.4), overdue: 0 },
                      { shift: "Daily", completed: Math.floor(stats.completed * 0.2), pending: Math.floor(stats.pending * 0.3), overdue: 0 },
                    ]}
                    margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="shift" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pending" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground text-sm">Recent Activity</h3>
                <Activity className="w-4 h-4 text-muted-foreground" />
              </div>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No activity yet
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((a, i) => (
                    <div key={a.id} className="flex items-start gap-2.5">
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                        a.status === "completed" || a.status === "approved" ? "bg-emerald-500" :
                        a.status === "submitted" ? "bg-amber-500" : "bg-rose-500"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground leading-tight">{a.name}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{a.status}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">{a.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PremiumLayout>
  );
}
`);

console.log('Done! Owner dashboard generated.');
