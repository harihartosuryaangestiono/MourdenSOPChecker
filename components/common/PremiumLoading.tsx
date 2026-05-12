"use client";

import { motion } from "framer-motion";
import { Coffee } from "lucide-react";

export function SkeletonCard() {
  return (
    <div className="p-5 rounded-2xl border border-border/40 bg-card space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 bg-secondary/60 rounded-lg" />
        <div className="h-4 w-16 bg-secondary/60 rounded-full" />
      </div>
      <div className="h-5 w-3/4 bg-secondary/60 rounded-lg" />
      <div className="h-3 w-full bg-secondary/40 rounded-lg" />
      <div className="h-3 w-2/3 bg-secondary/40 rounded-lg" />
      <div className="pt-2 border-t border-border/40 flex justify-between">
        <div className="h-4 w-24 bg-secondary/60 rounded-lg" />
        <div className="h-8 w-8 bg-secondary/60 rounded-full" />
      </div>
    </div>
  );
}

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
