"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, actionLabel, onAction, className, compact }: EmptyStateProps) {
  const resolvedAction = action ?? (actionLabel ? { label: actionLabel, onClick: onAction ?? (() => {}) } : undefined);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-10 px-4" : "py-16 px-6",
        className
      )}
    >
      <div className={cn(
        "rounded-2xl bg-secondary/60 flex items-center justify-center mb-4",
        compact ? "w-12 h-12" : "w-16 h-16"
      )}>
        <Icon className={cn("text-muted-foreground", compact ? "w-6 h-6" : "w-8 h-8")} />
      </div>
      <h3 className={cn("font-semibold text-foreground mb-1.5", compact ? "text-sm" : "text-base")}>
        {title}
      </h3>
      {description && (
        <p className={cn("text-muted-foreground max-w-xs mx-auto", compact ? "text-xs" : "text-sm")}>
          {description}
        </p>
      )}
      {resolvedAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={resolvedAction.onClick}
          className="mt-5 rounded-xl"
        >
          {resolvedAction.label}
        </Button>
      )}
    </motion.div>
  );
}
