const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

function w(rel, code) {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, code, 'utf8');
  console.log('✓', rel);
}

// ─── PremiumLoading ────────────────────────────────────────────────────────────
w('components/common/PremiumLoading.tsx', `"use client";

import { motion } from "framer-motion";
import { Coffee } from "lucide-react";

export function PremiumLoading({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 rounded-full border-2 border-border border-t-primary"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Coffee className="w-5 h-5 text-primary" />
        </div>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-muted-foreground font-medium"
      >
        {text}
      </motion.p>
    </div>
  );
}
`);

// ─── EmptyState ────────────────────────────────────────────────────────────────
w('components/common/EmptyState.tsx', `"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) {
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
      {action && (
        <Button
          variant="outline"
          size="sm"
          onClick={action.onClick}
          className="mt-5 rounded-xl"
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
`);

// ─── LoadingSkeleton ───────────────────────────────────────────────────────────
w('components/common/LoadingSkeleton.tsx', `import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-secondary/60", className)} />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-5 rounded-2xl border border-border/40 bg-card space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="pt-2 border-t border-border/40 flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="p-4 rounded-2xl border border-border/40 bg-card flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border/30">
      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-20 ml-auto" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
`);

// ─── StatusBadge ───────────────────────────────────────────────────────────────
w('components/common/StatusBadge.tsx', `import { cn } from "@/lib/utils";

type Status = "pending" | "in_progress" | "completed" | "overdue" | "rejected" | "approved" | "submitted" | "revision_requested";

const STATUS_MAP: Record<Status, { label: string; class: string }> = {
  pending:            { label: "Pending",     class: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  in_progress:        { label: "In Progress", class: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  completed:          { label: "Completed",   class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  overdue:            { label: "Overdue",     class: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  rejected:           { label: "Rejected",    class: "bg-red-500/10 text-red-600 border-red-500/20" },
  approved:           { label: "Approved",    class: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  submitted:          { label: "Submitted",   class: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  revision_requested: { label: "Revision",    class: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
};

interface StatusBadgeProps {
  status: Status | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const map = STATUS_MAP[status as Status] ?? { label: status, class: "bg-secondary text-muted-foreground border-border/40" };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider",
        map.class,
        className
      )}
    >
      {map.label}
    </span>
  );
}
`);

// ─── UserAvatar ────────────────────────────────────────────────────────────────
w('components/common/UserAvatar.tsx', `import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  avatarUrl?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function UserAvatar({ name, avatarUrl, className, size = "md" }: UserAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sizes = {
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-12 h-12 text-sm",
  };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn("rounded-full object-cover ring-1 ring-border/50", sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center font-bold text-primary flex-shrink-0",
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
`);

// ─── ProgressRing ──────────────────────────────────────────────────────────────
w('components/common/ProgressRing.tsx', `"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({
  value,
  size = 80,
  strokeWidth = 6,
  className,
  label,
  sublabel,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-secondary"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-primary"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && (
          <span className="text-base font-bold text-foreground leading-none">{label}</span>
        )}
        {sublabel && (
          <span className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</span>
        )}
      </div>
    </div>
  );
}
`);

// ─── ImageViewerModal ──────────────────────────────────────────────────────────
w('components/common/ImageViewerModal.tsx', `"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
}

export function ImageViewerModal({ isOpen, onClose, imageUrl, title }: ImageViewerModalProps) {
  const [scale, setScale] = useState(1);

  const handleClose = () => {
    setScale(1);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full"
          >
            <div className="flex items-center justify-between mb-3">
              {title && (
                <p className="text-sm font-medium text-white/80">{title}</p>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
                  className="h-8 w-8 text-white hover:bg-white/10"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setScale((s) => Math.min(3, s + 0.25))}
                  className="h-8 w-8 text-white hover:bg-white/10"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <a
                  href={imageUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/10"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-8 w-8 text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl bg-black/40 border border-white/10">
              <img
                src={imageUrl}
                alt={title ?? "Photo proof"}
                className="w-full object-contain max-h-[80vh] transition-transform duration-200"
                style={{ transform: "scale(" + scale + ")" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
`);

console.log('Done! Common components generated.');
