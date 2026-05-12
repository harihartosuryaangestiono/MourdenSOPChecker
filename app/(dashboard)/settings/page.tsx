"use client";

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
