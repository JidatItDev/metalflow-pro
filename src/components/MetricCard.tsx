import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { motion } from "framer-motion";

interface Props {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  trend?: { value: string; positive?: boolean };
  icon?: ReactNode;
  className?: string;
  /** Stagger index for entrance animation (0–3 typical). */
  delay?: number;
}

export function MetricCard({ label, value, hint, trend, icon, className, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        y: -4,
        transition: { type: "spring", stiffness: 420, damping: 28 },
      }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "surface-card p-5 flex flex-col gap-3.5 will-change-transform",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-label tracking-tight">{label}</span>
        {icon && (
          <span className="text-accent/80 shrink-0 rounded-md bg-accent-soft/60 p-1.5 ring-1 ring-accent/10">
            {icon}
          </span>
        )}
      </div>
      <div className="text-metric text-foreground tabular-nums tracking-tight">{value}</div>
      <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-border/50">
        {hint && <span className="text-hint leading-snug">{hint}</span>}
        {trend && (
          <span className={cn("text-2xs font-semibold tabular-nums shrink-0", trend.positive ? "text-success" : "text-danger")}>
            {trend.positive ? "▲" : "▼"} {trend.value}
          </span>
        )}
      </div>
    </motion.div>
  );
}
