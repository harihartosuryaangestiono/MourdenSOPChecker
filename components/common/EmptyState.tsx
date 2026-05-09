"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 bg-card/50">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6"
      >
        <Icon className="h-10 w-10 text-primary" />
      </motion.div>
      <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="rounded-full shadow-lg hover:shadow-primary/25 transition-all">
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}
