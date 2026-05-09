import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand-gold text-brand-navy hover:bg-brand-gold-dark",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-danger text-white hover:bg-danger/80",
        outline: "text-foreground",
        pending: "border-transparent bg-warning/10 text-warning",
        in_progress: "border-transparent bg-info/10 text-info",
        completed: "border-transparent bg-success/10 text-success",
        overdue: "border-transparent bg-danger/10 text-danger",
        approved: "border-transparent bg-emerald-500/10 text-emerald-500",
        rejected: "border-transparent bg-muted text-muted-foreground",
        submitted: "border-transparent bg-brand-gold/10 text-brand-gold-dark",
        revision_requested: "border-transparent bg-warning/10 text-warning",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
