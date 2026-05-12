const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function w(rel, code) {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, code, 'utf8');
  console.log('✓', rel);
}

// ─── Admin Staff Management Page ───────────────────────────────────────────────
w('app/(dashboard)/admin/staff/page.tsx', `"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PremiumLayout } from "@/components/layout/PremiumLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/common/UserAvatar";
import { EmptyState } from "@/components/common/EmptyState";
import { PremiumLoading } from "@/components/common/PremiumLoading";
import {
  Plus, Search, MoreVertical, Edit2, Trash2, CheckCircle2,
  XCircle, Loader2, X, Users, AlertTriangle, Mail, Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Staff {
  id: string; name: string; email: string; role: string;
  shift_preference: string; is_active: boolean; avatar_url?: string;
  created_at?: string;
}

const ROLES = ["staff", "admin"] as const;
const SHIFTS = ["all", "opening", "closing", "daily"] as const;

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "staff" | "admin">("all");

  const [showInvite, setShowInvite] = useState(false);
  const [editTarget, setEditTarget] = useState<Staff | null>(null);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "staff", shift_preference: "all" });
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const sb = createClient();
      const { data } = await sb.from("users").select("*").in("role", ["staff", "admin"]).order("name");
      setStaff((data ?? []) as Staff[]);
    } catch { toast.error("Failed to load staff"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = staff.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || s.role === roleFilter;
    return matchSearch && matchRole;
  });

  const openInvite = () => {
    setEditTarget(null);
    setInviteForm({ name: "", email: "", role: "staff", shift_preference: "all" });
    setShowInvite(true);
  };

  const openEdit = (member: Staff) => {
    setEditTarget(member);
    setInviteForm({ name: member.name, email: member.email, role: member.role, shift_preference: member.shift_preference ?? "all" });
    setShowInvite(true);
  };

  const handleSave = async () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setSaving(true);
    try {
      const sb = createClient();
      if (editTarget) {
        await sb.from("users").update({
          name: inviteForm.name,
          role: inviteForm.role,
          shift_preference: inviteForm.shift_preference,
        }).eq("id", editTarget.id);
        toast.success("Staff updated!");
      } else {
        const { error } = await sb.from("users").insert({
          name: inviteForm.name,
          email: inviteForm.email,
          role: inviteForm.role,
          shift_preference: inviteForm.shift_preference,
          is_active: true,
        });
        if (error) throw error;
        toast.success("Staff member added! They can sign up with this email.");
      }
      setShowInvite(false);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (member: Staff) => {
    try {
      const sb = createClient();
      await sb.from("users").update({ is_active: !member.is_active }).eq("id", member.id);
      toast.success(member.is_active ? "Staff deactivated." : "Staff reactivated!");
      load();
    } catch { toast.error("Failed to update"); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const sb = createClient();
      await sb.from("users").delete().eq("id", deleteTarget.id);
      toast.success("Staff member removed.");
      setDeleteTarget(null);
      load();
    } catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); }
  };

  const activeCount = staff.filter((s) => s.is_active).length;
  const adminCount = staff.filter((s) => s.role === "admin").length;

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background"><PremiumLoading /></div>
  );

  return (
    <PremiumLayout title="Staff Management" subtitle={"Manage your team · " + activeCount + " active members"}>
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6 space-y-5">

        {/* Summary Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Staff", value: staff.length, icon: Users, color: "text-primary", bg: "bg-primary/10" },
            { label: "Active", value: activeCount, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Admins", value: adminCount, icon: Shield, color: "text-blue-500", bg: "bg-blue-500/10" },
          ].map((s, i) => (
            <Card key={i} className="border-border/40">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("p-2 rounded-xl flex-shrink-0", s.bg)}>
                  <s.icon className={cn("w-4 h-4", s.color)} />
                </div>
                <div>
                  <p className="text-lg font-black text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-xl bg-secondary/50 border-transparent text-sm"
            />
          </div>
          <div className="flex gap-1.5">
            {(["all", "staff", "admin"] as const).map((r) => (
              <Button
                key={r}
                size="sm"
                variant={roleFilter === r ? "default" : "secondary"}
                onClick={() => setRoleFilter(r)}
                className="rounded-full capitalize text-xs h-9"
              >
                {r === "all" ? "All Roles" : r}
              </Button>
            ))}
          </div>
          <Button size="sm" onClick={openInvite} className="rounded-xl h-9 gap-1.5 text-xs ml-auto">
            <Plus className="w-3.5 h-3.5" /> Add Staff
          </Button>
        </div>

        {/* Staff List */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No staff found"
            description={search ? "Try different search terms." : "Add your first staff member to get started."}
            action={{ label: "Add Staff", onClick: openInvite }}
          />
        ) : (
          <motion.div
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
          >
            {filtered.map((member) => (
              <motion.div
                key={member.id}
                variants={{ hidden: { y: 8, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 280, damping: 24 } } }}
              >
                <Card className={cn("border-border/40 hover:shadow-md transition-all", !member.is_active && "opacity-60")}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar name={member.name} avatarUrl={member.avatar_url} size="md" className="flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 -mt-1 -mr-1 flex-shrink-0">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => openEdit(member)} className="gap-2 text-sm">
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(member)} className="gap-2 text-sm">
                            {member.is_active
                              ? <><XCircle className="w-3.5 h-3.5" /> Deactivate</>
                              : <><CheckCircle2 className="w-3.5 h-3.5" /> Reactivate</>
                            }
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeleteTarget(member)} className="gap-2 text-sm text-destructive focus:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "capitalize text-[10px]",
                          member.role === "admin" ? "border-blue-500/20 bg-blue-500/5 text-blue-600" : "border-primary/20 bg-primary/5 text-primary"
                        )}
                      >
                        {member.role}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          member.is_active ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600" : "border-border/40 text-muted-foreground"
                        )}
                      >
                        {member.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {member.shift_preference && member.shift_preference !== "all" && (
                        <Badge variant="outline" className="capitalize text-[10px] border-border/40">
                          {member.shift_preference}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ─── Add / Edit Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-6"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 240 }}
              className="w-full max-w-md bg-background rounded-t-3xl sm:rounded-3xl border border-border/50 shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
                <h2 className="font-semibold text-foreground">{editTarget ? "Edit Staff Member" : "Add Staff Member"}</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowInvite(false)} className="rounded-full h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name *</Label>
                  <Input
                    placeholder="e.g. Budi Santoso"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    className="rounded-xl bg-secondary/40 border-transparent focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email *</Label>
                  <Input
                    type="email"
                    placeholder="budi@example.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    disabled={!!editTarget}
                    className="rounded-xl bg-secondary/40 border-transparent focus:border-primary disabled:opacity-60"
                  />
                  {!editTarget && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Staff must sign up using this exact email
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</Label>
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                      className="w-full h-10 px-3 text-sm bg-secondary/40 border border-transparent rounded-xl focus:outline-none focus:border-primary transition-colors"
                    >
                      {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shift</Label>
                    <select
                      value={inviteForm.shift_preference}
                      onChange={(e) => setInviteForm({ ...inviteForm, shift_preference: e.target.value })}
                      className="w-full h-10 px-3 text-sm bg-secondary/40 border border-transparent rounded-xl focus:outline-none focus:border-primary transition-colors"
                    >
                      {SHIFTS.map((s) => <option key={s} value={s} className="capitalize">{s === "all" ? "All Shifts" : s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <Button variant="outline" onClick={() => setShowInvite(false)} className="flex-1 rounded-xl">Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editTarget ? "Save Changes" : "Add Staff"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirm ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-background rounded-2xl border border-border/50 shadow-2xl p-6 space-y-4"
            >
              <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-foreground">Remove {deleteTarget.name}?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This will permanently remove this staff member from the system. Their task history will be preserved.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl">Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="flex-1 rounded-xl">
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Remove
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

// ─── Add "Generate Today" button to admin dashboard ────────────────────────────
// This patches the existing admin page to add a generate button in the toolbar area
console.log('Done! Admin staff page generated.');
