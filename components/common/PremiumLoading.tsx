import { motion } from "framer-motion";

export function PremiumLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-8">
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/80 to-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-6"
      >
        <div className="w-8 h-8 rounded-full border-4 border-white/20 border-t-white animate-spin" />
      </motion.div>
      <div className="space-y-3 w-full max-w-sm">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse w-5/6 mx-auto" />
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
          <div className="h-3 w-1/4 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-muted rounded animate-pulse" />
        <div className="h-3 w-5/6 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}
