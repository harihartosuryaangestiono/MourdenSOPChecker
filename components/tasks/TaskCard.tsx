"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Camera, Clock } from "lucide-react";
import { formatTime } from "@/lib/utils";
import type { DailyTaskInstance } from "@/types/task.types";
import Link from "next/link";

interface TaskCardProps {
  task: DailyTaskInstance;
  onUpload?: () => void;
}

export function TaskCard({ task, onUpload }: TaskCardProps) {
  const isPending = task.status === "pending" || task.status === "overdue";
  const isCompleted = task.status === "completed";
  
  const category = task.sop_task?.sop_template?.category;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground truncate">
              {task.sop_task?.title}
            </h4>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {category && (
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ 
                    borderColor: category.color ? `var(--${category.color})` : undefined,
                    color: category.color ? `var(--${category.color})` : undefined 
                  }}
                >
                  {category.name}
                </Badge>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Sebelum {task.deadline_time.slice(0, 5)}
              </div>
            </div>
          </div>
          <StatusBadge status={task.status} />
        </div>

        {isPending && (
          <div className="mt-4">
            <Link href={`/staff/task/${task.id}`}>
              <Button 
                className="w-full h-12 bg-brand-gold hover:bg-brand-gold-dark text-brand-navy font-semibold"
                onClick={onUpload}
              >
                <Camera className="w-5 h-5 mr-2" />
                Upload Bukti Foto
              </Button>
            </Link>
          </div>
        )}

        {isCompleted && task.submission && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-success/5 rounded-lg">
            <div className="w-12 h-12 rounded-lg bg-cover bg-center" 
                 style={{ backgroundImage: `url(${task.submission.photo_url})` }} />
            <div className="flex-1">
              <p className="text-sm font-medium text-success">Selesai</p>
              <p className="text-xs text-muted-foreground">
                {formatTime(task.submission.submitted_at)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
