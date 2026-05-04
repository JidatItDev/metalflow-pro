import { cn } from "@/lib/utils";

interface Props {
  value: number;          // 0-100
  variant?: "accent" | "success" | "warning" | "danger" | "neutral";
  className?: string;
}

const colorMap = {
  accent:  "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger:  "bg-danger",
  neutral: "bg-slate-500",
};

export function ProgressBar({ value, variant = "accent", className }: Props) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-[5px] w-full rounded-full bg-secondary overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", colorMap[variant])}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function variantForProgress(progress: number, status?: string) {
  if (status === "Over-purchased") return "danger" as const;
  if (status === "Completed" || progress >= 100) return "success" as const;
  if (progress >= 50) return "accent" as const;
  if (progress > 0) return "warning" as const;
  return "neutral" as const;
}
