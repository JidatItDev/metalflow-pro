import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  trend?: { value: string; positive?: boolean };
  icon?: ReactNode;
  className?: string;
}

export function MetricCard({ label, value, hint, trend, icon, className }: Props) {
  return (
    <div className={cn("surface-card p-5 flex flex-col gap-3 animate-fade-in", className)}>
      <div className="flex items-center justify-between">
        <span className="text-label">{label}</span>
        {icon && <span className="text-steel-300">{icon}</span>}
      </div>
      <div className="text-metric text-foreground">{value}</div>
      <div className="flex items-center justify-between">
        {hint && <span className="text-hint">{hint}</span>}
        {trend && (
          <span className={cn("text-2xs font-medium", trend.positive ? "text-success" : "text-danger")}>
            {trend.positive ? "▲" : "▼"} {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
