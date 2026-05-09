"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhotoUploader } from "@/components/photo/PhotoUploader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { createClient } from "@/lib/supabase/client";
import { uploadTaskPhoto } from "@/services/storage.service";
import { createSubmission } from "@/services/submission.service";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { DailyTaskInstance } from "@/types/task.types";

import { PremiumLayout } from "@/components/layout/PremiumLayout";
import { PremiumLoading } from "@/components/common/PremiumLoading";
import { motion } from "framer-motion";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  
  const [task, setTask] = useState<DailyTaskInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTask();
  }, [taskId]);

  async function loadTask() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("daily_task_instances")
        .select(`
          *,
          sop_task:sop_tasks(*, sop_template:sop_templates(*, category:sop_categories(*)))
        `)
        .eq("id", taskId)
        .single();

      if (error) throw error;
      setTask(data as unknown as DailyTaskInstance);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat task");
    } finally {
      setIsLoading(false);
    }
  }

  function handlePhotoSelect(file: File) {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  function handleClearPhoto() {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  }

  async function handleSubmit() {
    if (!selectedFile || !task) {
      toast.error("Silakan pilih foto terlebih dahulu");
      return;
    }

    try {
      setIsSubmitting(true);
      const { user } = (await createClient().auth.getUser()).data;
      
      if (!user) {
        toast.error("Anda harus login terlebih dahulu");
        return;
      }

      // Upload photo
      const { url, path } = await uploadTaskPhoto(selectedFile, task.id, user.id);

      // Create submission
      await createSubmission({
        task_instance_id: task.id,
        photo_url: url,
        photo_path: path,
        notes: notes || undefined,
      });

      toast.success("Bukti berhasil dikirim! Admin akan segera meninjau.");
      router.push("/staff");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengunggah. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <PremiumLoading />
      </div>
    );
  }

  if (!task) {
    return (
      <PremiumLayout title="Task Details" showSidebar={false}>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Task not found</p>
          <Button asChild variant="outline">
            <Link href="/staff">Return to Dashboard</Link>
          </Button>
        </div>
      </PremiumLayout>
    );
  }

  const category = task.sop_task?.sop_template?.category;
  const isCompleted = task.status === "completed";

  return (
    <PremiumLayout title="Task Details" showSidebar={false}>
      <div className="max-w-2xl mx-auto space-y-6 pb-20">
        {/* Back Button */}
        <Button variant="ghost" className="pl-0" asChild>
          <Link href="/staff">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Link>
        </Button>

      {/* Task Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="font-display text-xl mb-2">
                {task.sop_task?.title}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                {category && (
                  <Badge variant="outline">{category.name}</Badge>
                )}
                <StatusBadge status={task.status} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.sop_task?.instruction && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">Instruksi:</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {task.sop_task.instruction}
              </p>
            </div>
          )}

          <div className="text-sm">
            <span className="text-muted-foreground">Deadline: </span>
            <span className="font-medium">Sebelum {task.deadline_time.slice(0, 5)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Photo Upload Section */}
      {!isCompleted && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Upload Bukti Foto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PhotoUploader
              onPhotoSelect={handlePhotoSelect}
              previewUrl={previewUrl || undefined}
              onClear={handleClearPhoto}
              isUploading={isSubmitting}
            />

            {previewUrl && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Catatan tambahan (opsional)</label>
                  <textarea
                    className="w-full min-h-[100px] rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                    placeholder="Tambahkan catatan jika diperlukan..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full h-14 bg-brand-gold hover:bg-brand-gold-dark text-brand-navy font-semibold text-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Mengunggah...
                    </>
                  ) : (
                    "Kirim Bukti Foto"
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submitted Photo */}
      {isCompleted && task.submission && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Bukti Foto Terkirim</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={task.submission.photo_url}
                alt="Submitted proof"
                className="w-full aspect-[4/3] object-cover"
              />
            </div>
            {task.submission.notes && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">{task.submission.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      </div>
    </PremiumLayout>
  );
}
