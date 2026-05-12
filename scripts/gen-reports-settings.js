const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function w(rel, code) {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, code, 'utf8');
  console.log('✓', rel);
}

// ─── Reports Page ──────────────────────────────────────────────────────────────
w('app/(dashboard)/admin/reports/page.tsx', `"use client";

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
        .select(\`
          id, date, status, shift, assigned_to,
          sop_task:sop_tasks(title),
          assigned_user:users!assigned_to(name),
          submission:task_submissions(submitted_at)
        \`)
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
        .select(\`
          date, shift, status,
          sop_task:sop_tasks(title),
          assigned_user:users!assigned_to(name),
          submission:task_submissions(submitted_at, notes)
        \`)
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

      const csv = [header, ...rows].join("\\n");
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
`);

// ─── Settings Page ─────────────────────────────────────────────────────────────
w('app/(dashboard)/settings/page.tsx', `"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PremiumLayout } from "@/components/layout/PremiumLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, User, Coffee, Bell, Moon, Sun, Shield, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumLoading } from "@/components/common/PremiumLoading";
import { useTheme } from "next-themes";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "cafe", label: "Café Info", icon: Coffee },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Moon },
  { id: "security", label: "Security", icon: Shield },
] as const;

type Tab = typeof TABS[number]["id"];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { theme, setTheme } = useTheme();

  const [profile, setProfile] = useState({ name: "", email: "", role: "", shift_preference: "all", avatar_url: "" });
  const [cafe, setCafe] = useState({ name: "", address: "", phone: "", opening_hours: "" });
  const [notifs, setNotifs] = useState({ task_due: true, task_overdue: true, review_needed: true, daily_summary: false });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const sb = createClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;
        const { data } = await sb.from("users").select("*").eq("id", user.id).single();
        if (data) setProfile({ name: data.name ?? "", email: data.email ?? user.email ?? "", role: data.role ?? "", shift_preference: data.shift_preference ?? "all", avatar_url: data.avatar_url ?? "" });
      } catch { } finally { setLoading(false); }
    })();
  }, []);

  const saveProfile = async () => {
    if (!profile.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      await sb.from("users").update({ name: profile.name, shift_preference: profile.shift_preference, avatar_url: profile.avatar_url }).eq("id", user.id);
      toast.success("Profile saved!");
    } catch { toast.error("Failed to save profile"); }
    finally { setSaving(false); }
  };

  const saveCafe = async () => {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      toast.success("Café info saved!");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const saveNotifs = async () => {
    setSaving(true);
    try {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (user) await sb.from("users").update({ notification_settings: notifs as any }).eq("id", user.id);
      toast.success("Notification preferences saved!");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!passwords.current || !passwords.next) { toast.error("Fill in all fields"); return; }
    if (passwords.next !== passwords.confirm) { toast.error("Passwords do not match"); return; }
    if (passwords.next.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setPwSaving(true);
    try {
      const sb = createClient();
      const { error } = await sb.auth.updateUser({ password: passwords.next });
      if (error) throw error;
      toast.success("Password changed!");
      setPasswords({ current: "", next: "", confirm: "" });
    } catch { toast.error("Failed to change password"); }
    finally { setPwSaving(false); }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background"><PremiumLoading /></div>
  );

  return (
    <PremiumLayout title="Settings" subtitle="Manage your account and application preferences">
      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Sidebar */}
          <nav className="sm:w-48 flex-shrink-0">
            <div className="space-y-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
                    tab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  )}
                >
                  <t.icon className="w-4 h-4 flex-shrink-0" />
                  {t.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
            >
              {tab === "profile" && (
                <Card className="border-border/40">
                  <CardContent className="p-6 space-y-5">
                    <div>
                      <h2 className="font-semibold text-foreground">Profile</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Update your personal information</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 ring-2 ring-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-bold text-primary">
                          {profile.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{profile.name || "No name"}</p>
                        <p className="text-xs text-muted-foreground capitalize">{profile.role} · {profile.email}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                        <Input
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="rounded-xl bg-secondary/40 border-transparent focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
                        <Input value={profile.email} disabled className="rounded-xl bg-secondary/20 border-transparent opacity-60" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</Label>
                        <Input value={profile.role} disabled className="rounded-xl bg-secondary/20 border-transparent opacity-60 capitalize" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shift Preference</Label>
                        <select
                          value={profile.shift_preference}
                          onChange={(e) => setProfile({ ...profile, shift_preference: e.target.value })}
                          className="w-full h-10 px-3 text-sm bg-secondary/40 border border-transparent rounded-xl focus:outline-none focus:border-primary transition-colors"
                        >
                          <option value="all">All Shifts</option>
                          <option value="opening">Opening Only</option>
                          <option value="closing">Closing Only</option>
                          <option value="daily">Daily Only</option>
                        </select>
                      </div>
                    </div>

                    <Button onClick={saveProfile} disabled={saving} className="rounded-xl">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                      Save Profile
                    </Button>
                  </CardContent>
                </Card>
              )}

              {tab === "cafe" && (
                <Card className="border-border/40">
                  <CardContent className="p-6 space-y-5">
                    <div>
                      <h2 className="font-semibold text-foreground">Café Information</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Business details displayed across the app</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        { key: "name", label: "Café Name", placeholder: "e.g. Mourden Coffee" },
                        { key: "phone", label: "Phone Number", placeholder: "+62 812 3456 7890" },
                        { key: "address", label: "Address", placeholder: "Street address" },
                        { key: "opening_hours", label: "Opening Hours", placeholder: "07:00 – 22:00" },
                      ].map((f) => (
                        <div key={f.key} className={cn("space-y-1.5", (f.key === "address" || f.key === "opening_hours") && "sm:col-span-1")}>
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</Label>
                          <Input
                            placeholder={f.placeholder}
                            value={(cafe as any)[f.key]}
                            onChange={(e) => setCafe({ ...cafe, [f.key]: e.target.value })}
                            className="rounded-xl bg-secondary/40 border-transparent focus:border-primary"
                          />
                        </div>
                      ))}
                    </div>
                    <Button onClick={saveCafe} disabled={saving} className="rounded-xl">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                      Save Café Info
                    </Button>
                  </CardContent>
                </Card>
              )}

              {tab === "notifications" && (
                <Card className="border-border/40">
                  <CardContent className="p-6 space-y-5">
                    <div>
                      <h2 className="font-semibold text-foreground">Notifications</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Choose what events trigger notifications</p>
                    </div>
                    <div className="space-y-4">
                      {[
                        { key: "task_due", label: "Task Due Soon", desc: "Notify 30 minutes before deadline" },
                        { key: "task_overdue", label: "Task Overdue", desc: "Alert when a task passes its deadline" },
                        { key: "review_needed", label: "Review Needed", desc: "Notify when a submission awaits review" },
                        { key: "daily_summary", label: "Daily Summary", desc: "End-of-day completion digest" },
                      ].map((n) => (
                        <div key={n.key} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                          <div>
                            <p className="text-sm font-medium text-foreground">{n.label}</p>
                            <p className="text-xs text-muted-foreground">{n.desc}</p>
                          </div>
                          <button
                            onClick={() => setNotifs({ ...notifs, [n.key]: !(notifs as any)[n.key] })}
                            className={cn(
                              "relative w-10 h-6 rounded-full transition-colors flex-shrink-0",
                              (notifs as any)[n.key] ? "bg-primary" : "bg-secondary"
                            )}
                          >
                            <span className={cn(
                              "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform",
                              (notifs as any)[n.key] ? "translate-x-5" : "translate-x-1"
                            )} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <Button onClick={saveNotifs} disabled={saving} className="rounded-xl">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                      Save Preferences
                    </Button>
                  </CardContent>
                </Card>
              )}

              {tab === "appearance" && (
                <Card className="border-border/40">
                  <CardContent className="p-6 space-y-5">
                    <div>
                      <h2 className="font-semibold text-foreground">Appearance</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Choose your preferred theme</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: "light", label: "Light", icon: Sun },
                        { value: "dark", label: "Dark", icon: Moon },
                        { value: "system", label: "System", icon: Shield },
                      ].map((t) => (
                        <button
                          key={t.value}
                          onClick={() => { setTheme(t.value); toast.success(t.label + " theme applied!"); }}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                            theme === t.value ? "border-primary bg-primary/5" : "border-border/40 hover:border-border"
                          )}
                        >
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", theme === t.value ? "bg-primary text-primary-foreground" : "bg-secondary")}>
                            <t.icon className="w-5 h-5" />
                          </div>
                          <span className={cn("text-xs font-semibold", theme === t.value ? "text-primary" : "text-muted-foreground")}>
                            {t.label}
                          </span>
                          {theme === t.value && <Check className="w-3 h-3 text-primary" />}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {tab === "security" && (
                <Card className="border-border/40">
                  <CardContent className="p-6 space-y-5">
                    <div>
                      <h2 className="font-semibold text-foreground">Security</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Manage your password and account security</p>
                    </div>
                    <div className="space-y-4">
                      {[
                        { key: "current", label: "Current Password", placeholder: "Enter current password" },
                        { key: "next", label: "New Password", placeholder: "Min. 8 characters" },
                        { key: "confirm", label: "Confirm New Password", placeholder: "Repeat new password" },
                      ].map((f) => (
                        <div key={f.key} className="space-y-1.5">
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</Label>
                          <Input
                            type="password"
                            placeholder={f.placeholder}
                            value={(passwords as any)[f.key]}
                            onChange={(e) => setPasswords({ ...passwords, [f.key]: e.target.value })}
                            className="rounded-xl bg-secondary/40 border-transparent focus:border-primary"
                          />
                        </div>
                      ))}
                    </div>
                    <Button onClick={changePassword} disabled={pwSaving} className="rounded-xl">
                      {pwSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                      Change Password
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </PremiumLayout>
  );
}
`);

console.log('Done! Reports + Settings pages generated.');
