"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getSOPTemplates, createSOPTemplate, createSOPTask, updateSOPTemplate,
  deleteSOPTemplate, generateDailyTasks, getSOPCategories,
} from "@/services/task.service";
import type { SOPTemplate } from "@/types/task.types";
import {
  Plus, Edit2, Search, Clock, MoreVertical, Trash2, CheckCircle2, Copy,
  X, GripVertical, Camera, FileText, Upload, AlertTriangle, Loader2,
  Play, Download, RefreshCw, ChevronDown, Zap,
} from "lucide-react";
import { PremiumLayout } from "@/components/layout/PremiumLayout";
import { PremiumLoading, SkeletonCard } from "@/components/common/PremiumLoading";
import { EmptyState } from "@/components/common/EmptyState";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { formatTime, cn } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface TaskForm {
  title: string;
  description: string;
  instruction: string;
  photo_required: boolean;
  deadline_time: string;
}

interface CSVRow {
  title: string;
  description: string;
  shift: string;
  category: string;
  deadline: string;
  priority: string;
  task_title: string;
  task_description: string;
}

const SHIFTS = ["opening", "middle", "closing", "daily"] as const;
const PRIORITIES = ["low", "normal", "high", "critical"] as const;

const defaultTaskForm = (): TaskForm => ({
  title: "", description: "", instruction: "",
  photo_required: true, deadline_time: "",
});

export default function SOPPage() {
  const [templates, setTemplates] = useState<SOPTemplate[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [shiftFilter, setShiftFilter] = useState<"all" | "opening" | "middle" | "closing" | "daily">("all");

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<SOPTemplate | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", shift: "opening" as string,
    category_id: "", deadline_time: "08:00", priority: "normal" as string, is_active: true,
  });
  const [taskForms, setTaskForms] = useState<TaskForm[]>([defaultTaskForm()]);
  const [saving, setSaving] = useState(false);

  const [showCSV, setShowCSV] = useState(false);
  const [csvRows, setCSVRows] = useState<CSVRow[]>([]);
  const [csvDragging, setCSVDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const csvRef = useRef<HTMLInputElement>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    try {
      const [t, c] = await Promise.all([getSOPTemplates(), getSOPCategories()]);
      setTemplates(t);
      setCategories(c);
    } catch { toast.error("Failed to load data"); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = templates.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchShift = shiftFilter === "all" || t.shift === shiftFilter;
    return matchSearch && matchShift;
  });

  const openCreate = () => {
    setEditTarget(null);
    setForm({ title: "", description: "", shift: "opening", category_id: "", deadline_time: "08:00", priority: "normal", is_active: true });
    setTaskForms([defaultTaskForm()]);
    setShowCreate(true);
  };

  const openEdit = (tpl: SOPTemplate) => {
    setEditTarget(tpl);
    setForm({
      title: tpl.title, description: tpl.description ?? "",
      shift: tpl.shift, category_id: (tpl as any).category_id ?? "",
      deadline_time: tpl.deadline_time ?? "08:00",
      priority: (tpl as any).priority ?? "normal", is_active: tpl.is_active,
    });
    setTaskForms([defaultTaskForm()]);
    setShowCreate(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const cleanForm = {
        ...form,
        category_id: form.category_id || null,
      };
      if (editTarget) {
        await updateSOPTemplate(editTarget.id, cleanForm as any);
        toast.success("SOP updated!");
      } else {
        const tpl = await createSOPTemplate(cleanForm as any);
        const validTasks = taskForms.filter((t) => t.title.trim());
        for (let i = 0; i < validTasks.length; i++) {
          await createSOPTask({
            sop_template_id: tpl.id,
            title: validTasks[i].title,
            description: validTasks[i].description,
            instruction: validTasks[i].instruction,
            photo_required: validTasks[i].photo_required,
            order_index: i,
          } as any);
        }
        toast.success("SOP created with " + validTasks.length + " tasks!");
      }
      setShowCreate(false);
      load();
    } catch { toast.error("Failed to save SOP"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await deleteSOPTemplate(id);
      toast.success("SOP deleted.");
      setShowDeleteConfirm(null);
      load();
    } catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); }
  };

  const handleToggleActive = async (tpl: SOPTemplate) => {
    try {
      await updateSOPTemplate(tpl.id, { is_active: !tpl.is_active } as any);
      toast.success(tpl.is_active ? "SOP deactivated." : "SOP activated!");
      load();
    } catch { toast.error("Failed to update"); }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateDailyTasks();
      if (result.created === 0) {
        toast.info("All tasks already generated for today. (" + result.skipped + " existing)");
      } else {
        toast.success(result.created + " tasks generated for today!");
      }
    } catch { toast.error("Failed to generate tasks"); }
    finally { setGenerating(false); }
  };

  const handleDuplicate = async (tpl: SOPTemplate) => {
    try {
      await createSOPTemplate({ ...tpl, title: tpl.title + " (Copy)", id: undefined } as any);
      toast.success("SOP duplicated!");
      load();
    } catch { toast.error("Failed to duplicate"); }
  };

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/ /g, "_"));
    return lines.slice(1).map((line) => {
      const values = line.split(",");
      const row: any = {};
      headers.forEach((h, i) => { row[h] = values[i]?.trim().replace(/^"|"$/g, "") ?? ""; });
      return row as CSVRow;
    });
  };

  const parseXLSX = (buffer: ArrayBuffer): CSVRow[] => {
    const wb = XLSX.read(buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (raw.length < 2) return [];
    const headers = (raw[0] as string[]).map((h) =>
      String(h).trim().toLowerCase().replace(/ /g, "_")
    );
    return raw.slice(1).map((rowArr) => {
      const row: any = {};
      headers.forEach((h, i) => { row[h] = rowArr[i] != null ? String(rowArr[i]).trim() : ""; });
      return row as CSVRow;
    }).filter((r) => Object.values(r).some((v) => v !== ""));
  };

  const handleCSVFile = (file: File) => {
    const isXLSX = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    if (isXLSX) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        const rows = parseXLSX(buffer);
        if (rows.length === 0) { toast.error("Excel file is empty or invalid"); return; }
        setCSVRows(rows);
        toast.success(rows.length + " rows loaded from Excel");
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const rows = parseCSV(text);
        if (rows.length === 0) { toast.error("CSV is empty or invalid"); return; }
        setCSVRows(rows);
        toast.success(rows.length + " rows loaded from CSV");
      };
      reader.readAsText(file);
    }
  };

  const handleCSVImport = async () => {
    if (csvRows.length === 0) return;
    setImporting(true);
    let created = 0;
    try {
      const grouped: Record<string, CSVRow[]> = {};
      csvRows.forEach((r) => {
        const key = r.title + "||" + r.shift;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(r);
      });
      for (const [key, rows] of Object.entries(grouped)) {
        const first = rows[0];
        const tpl = await createSOPTemplate({
          title: first.title || "Imported SOP",
          description: "",
          shift: (first.shift as any) || "opening",
          deadline_time: first.deadline || "08:00",
          priority: (first.priority as any) || "normal",
          is_active: true,
        } as any);
        for (let i = 0; i < rows.length; i++) {
          if (!rows[i].task_title) continue;
          await createSOPTask({
            sop_template_id: tpl.id,
            title: rows[i].task_title,
            description: rows[i].task_description ?? "",
            photo_required: true,
            order_index: i,
          } as any);
          created++;
        }
      }
      toast.success(created + " tasks imported from CSV!");
      setShowCSV(false);
      setCSVRows([]);
      load();
    } catch { toast.error("Import failed"); }
    finally { setImporting(false); }
  };

  const downloadTemplate = () => {
    const csv = [
      "title,description,shift,category,deadline,priority,task_title,task_description",
      "Opening Procedures,Morning setup checklist,opening,Cleaning,08:00,high,Wipe counters,Clean all counter surfaces thoroughly",
      "Opening Procedures,Morning setup checklist,opening,Cleaning,08:00,high,Brew coffee,Prepare opening batch of coffee",
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "sop_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center"><PremiumLoading /></div>
  );

  return (
    <PremiumLayout title="SOP Templates" subtitle="Manage standard operating procedures">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6 space-y-5">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-xl bg-secondary/50 border-transparent text-sm"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(["all", "opening", "middle", "closing", "daily"] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={shiftFilter === s ? "default" : "secondary"}
                onClick={() => setShiftFilter(s)}
                className="rounded-full capitalize text-xs h-9"
              >
                {s === "all" ? "All" : s}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={() => setShowCSV(true)} className="rounded-xl h-9 gap-1.5 text-xs">
              <Upload className="w-3.5 h-3.5" /> Import CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={generating}
              className="rounded-xl h-9 gap-1.5 text-xs"
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Generate Today
            </Button>
            <Button size="sm" onClick={openCreate} className="rounded-xl h-9 gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> Create SOP
            </Button>
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={search ? "No templates match" : "No SOP templates yet"}
            description={search ? "Try a different search term." : "Create your first SOP template to standardise café operations."}
            action={search ? { label: "Clear", onClick: () => setSearch("") } : { label: "Create SOP", onClick: openCreate }}
          />
        ) : (
          <motion.div
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
          >
            {filtered.map((tpl) => (
              <motion.div
                key={tpl.id}
                variants={{ hidden: { y: 12, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 280, damping: 24 } } }}
              >
                <Card className={cn("border-border/40 hover:shadow-md transition-all h-full flex flex-col", !tpl.is_active && "opacity-60")}>
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="capitalize text-[10px] border-primary/20 bg-primary/5 text-primary">
                          {tpl.shift}
                        </Badge>
                        {tpl.is_active ? (
                          <Badge variant="outline" className="text-[10px] border-emerald-500/20 bg-emerald-500/5 text-emerald-600">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] border-border/40 text-muted-foreground">Inactive</Badge>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 -mt-1 -mr-1 flex-shrink-0">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => openEdit(tpl)} className="gap-2 text-sm">
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(tpl)} className="gap-2 text-sm">
                            <Copy className="w-3.5 h-3.5" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(tpl)} className="gap-2 text-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {tpl.is_active ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setShowDeleteConfirm(tpl.id)}
                            className="gap-2 text-sm text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <h3 className="font-semibold text-foreground mb-1.5 line-clamp-1">{tpl.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-auto">{tpl.description || "No description."}</p>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-4 pt-3 border-t border-border/40">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {tpl.deadline_time ? formatTime(tpl.deadline_time) : "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {(tpl as any).task_count ?? 0} tasks
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ─── Create / Edit Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-6"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 240 }}
              className="w-full max-w-2xl bg-background rounded-t-3xl sm:rounded-3xl border border-border/50 shadow-2xl flex flex-col max-h-[92vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 flex-shrink-0">
                <div>
                  <h2 className="font-semibold text-foreground">{editTarget ? "Edit SOP" : "Create SOP Template"}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Fill in the details below</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)} className="rounded-full h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Basic Info */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title *</Label>
                    <Input
                      placeholder="e.g. Opening Cleaning Checklist"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="rounded-xl bg-secondary/40 border-transparent focus:border-primary"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</Label>
                    <textarea
                      placeholder="Brief description of this SOP..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full h-20 px-3 py-2.5 text-sm bg-secondary/40 border border-transparent rounded-xl resize-none focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shift</Label>
                    <select
                      value={form.shift}
                      onChange={(e) => setForm({ ...form, shift: e.target.value })}
                      className="w-full h-10 px-3 text-sm bg-secondary/40 border border-transparent rounded-xl focus:outline-none focus:border-primary transition-colors"
                    >
                      {SHIFTS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</Label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      className="w-full h-10 px-3 text-sm bg-secondary/40 border border-transparent rounded-xl focus:outline-none focus:border-primary transition-colors"
                    >
                      {PRIORITIES.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deadline Time</Label>
                    <Input
                      type="time"
                      value={form.deadline_time}
                      onChange={(e) => setForm({ ...form, deadline_time: e.target.value })}
                      className="rounded-xl bg-secondary/40 border-transparent focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</Label>
                    <select
                      value={form.category_id}
                      onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                      className="w-full h-10 px-3 text-sm bg-secondary/40 border border-transparent rounded-xl focus:outline-none focus:border-primary transition-colors"
                    >
                      <option value="">No category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="sm:col-span-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, is_active: !form.is_active })}
                      className={cn(
                        "relative w-10 h-6 rounded-full transition-colors flex-shrink-0",
                        form.is_active ? "bg-primary" : "bg-secondary"
                      )}
                    >
                      <span className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform",
                        form.is_active ? "translate-x-5" : "translate-x-1"
                      )} />
                    </button>
                    <Label className="text-sm font-medium cursor-pointer" onClick={() => setForm({ ...form, is_active: !form.is_active })}>
                      {form.is_active ? "Active — tasks will be generated daily" : "Inactive — tasks won't be generated"}
                    </Label>
                  </div>
                </div>

                {/* Tasks (only on create) */}
                {!editTarget && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Tasks ({taskForms.length})
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setTaskForms([...taskForms, defaultTaskForm()])}
                        className="h-7 text-xs gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Task
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {taskForms.map((task, i) => (
                        <div key={i} className="bg-secondary/30 rounded-xl p-3 space-y-2 border border-border/30">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                            <Input
                              placeholder={"Task " + (i + 1) + " title"}
                              value={task.title}
                              onChange={(e) => {
                                const u = [...taskForms]; u[i] = { ...u[i], title: e.target.value }; setTaskForms(u);
                              }}
                              className="h-8 text-sm bg-background/70 border-transparent rounded-lg flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => setTaskForms(taskForms.filter((_, idx) => idx !== i))}
                              className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <Input
                            placeholder="Description (optional)"
                            value={task.description}
                            onChange={(e) => {
                              const u = [...taskForms]; u[i] = { ...u[i], description: e.target.value }; setTaskForms(u);
                            }}
                            className="h-7 text-xs bg-background/70 border-transparent rounded-lg"
                          />
                          <div className="flex items-center gap-3">
                            <Input
                              type="time"
                              value={task.deadline_time}
                              onChange={(e) => {
                                const u = [...taskForms]; u[i] = { ...u[i], deadline_time: e.target.value }; setTaskForms(u);
                              }}
                              className="h-7 text-xs bg-background/70 border-transparent rounded-lg w-32"
                            />
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                              <input
                                type="checkbox"
                                checked={task.photo_required}
                                onChange={(e) => {
                                  const u = [...taskForms]; u[i] = { ...u[i], photo_required: e.target.checked }; setTaskForms(u);
                                }}
                                className="accent-primary"
                              />
                              <Camera className="w-3 h-3" /> Photo required
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-border/40 flex gap-3 flex-shrink-0">
                <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 rounded-xl">Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editTarget ? "Save Changes" : "Create SOP"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CSV Import Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCSV && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-6"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 240 }}
              className="w-full max-w-2xl bg-background rounded-t-3xl sm:rounded-3xl border border-border/50 shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 flex-shrink-0">
                <div>
                  <h2 className="font-semibold text-foreground">Import SOPs from CSV</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Upload a CSV file to bulk import SOP templates and tasks</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={downloadTemplate} className="h-8 text-xs gap-1.5 rounded-xl">
                    <Download className="w-3 h-3" /> Template
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setShowCSV(false); setCSVRows([]); }} className="rounded-full h-8 w-8">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {csvRows.length === 0 ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setCSVDragging(true); }}
                    onDragLeave={() => setCSVDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault(); setCSVDragging(false);
                      const file = e.dataTransfer.files[0];
                      if (file) handleCSVFile(file);
                    }}
                    onClick={() => csvRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors",
                      csvDragging ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50 hover:bg-secondary/30"
                    )}
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <p className="font-semibold text-foreground mb-1">Drop CSV or Excel file here</p>
                    <p className="text-xs text-muted-foreground">Supports .csv, .xlsx, .xls · Max 5MB</p>
                    <input
                      ref={csvRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCSVFile(f); }}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{csvRows.length} rows ready to import</p>
                      <Button variant="ghost" size="sm" onClick={() => setCSVRows([])} className="h-7 text-xs">
                        Clear
                      </Button>
                    </div>
                    <div className="rounded-xl border border-border/40 overflow-hidden">
                      <div className="overflow-x-auto max-h-64">
                        <table className="w-full text-xs">
                          <thead className="bg-secondary/50">
                            <tr>
                              {["Title", "Shift", "Task Title", "Deadline", "Priority"].map((h) => (
                                <th key={h} className="px-3 py-2 text-left font-semibold text-foreground">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {csvRows.slice(0, 20).map((row, i) => (
                              <tr key={i} className="border-t border-border/20 hover:bg-secondary/20">
                                <td className="px-3 py-2 font-medium">{row.title || "—"}</td>
                                <td className="px-3 py-2 capitalize">{row.shift || "—"}</td>
                                <td className="px-3 py-2">{row.task_title || "—"}</td>
                                <td className="px-3 py-2">{row.deadline || "—"}</td>
                                <td className="px-3 py-2 capitalize">{row.priority || "normal"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {csvRows.length > 20 && (
                        <p className="text-xs text-muted-foreground text-center py-2 border-t border-border/20">
                          +{csvRows.length - 20} more rows
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-border/40 flex gap-3 flex-shrink-0">
                <Button variant="outline" onClick={() => { setShowCSV(false); setCSVRows([]); }} className="flex-1 rounded-xl">Cancel</Button>
                <Button onClick={handleCSVImport} disabled={csvRows.length === 0 || importing} className="flex-1 rounded-xl">
                  {importing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Import {csvRows.length > 0 ? csvRows.length + " rows" : ""}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirm ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showDeleteConfirm && (
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
                <h3 className="font-semibold text-foreground">Delete SOP Template?</h3>
                <p className="text-sm text-muted-foreground mt-1">This will permanently delete the template and all its tasks. This action cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(null)} className="flex-1 rounded-xl">Cancel</Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(showDeleteConfirm)}
                  disabled={deleting}
                  className="flex-1 rounded-xl"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PremiumLayout>
  );
}
