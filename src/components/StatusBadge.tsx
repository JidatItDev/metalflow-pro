import { cn } from "@/lib/utils";

type Variant =
  | "draft" | "submitted" | "won" | "lost"
  | "pending" | "partial" | "completed" | "over"
  | "active" | "hold" | "neutral" | "info" | "success" | "warning" | "danger";

const map: Record<Variant, string> = {
  draft:     "bg-secondary text-slate-700 ring-border",
  submitted: "bg-accent-soft text-accent ring-accent/20",
  won:       "bg-success-soft text-success ring-success/20",
  lost:      "bg-danger-soft text-danger ring-danger/20",
  pending:   "bg-secondary text-slate-700 ring-border",
  partial:   "bg-warning-soft text-warning ring-warning/20",
  completed: "bg-success-soft text-success ring-success/20",
  over:      "bg-danger-soft text-danger ring-danger/20",
  active:    "bg-success-soft text-success ring-success/20",
  hold:      "bg-warning-soft text-warning ring-warning/20",
  neutral:   "bg-secondary text-slate-700 ring-border",
  info:      "bg-accent-soft text-accent ring-accent/20",
  success:   "bg-success-soft text-success ring-success/20",
  warning:   "bg-warning-soft text-warning ring-warning/20",
  danger:    "bg-danger-soft text-danger ring-danger/20",
};

const dotMap: Record<Variant, string> = {
  draft: "bg-slate-500", submitted: "bg-accent", won: "bg-success", lost: "bg-danger",
  pending: "bg-slate-500", partial: "bg-warning", completed: "bg-success", over: "bg-danger",
  active: "bg-success", hold: "bg-warning",
  neutral: "bg-slate-500", info: "bg-accent", success: "bg-success", warning: "bg-warning", danger: "bg-danger",
};

interface Props {
  variant?: Variant;
  children: React.ReactNode;
  withDot?: boolean;
  className?: string;
}

export function StatusBadge({ variant = "neutral", children, withDot = true, className }: Props) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-2xs font-medium ring-1 ring-inset whitespace-nowrap",
      map[variant], className,
    )}>
      {withDot && <span className={cn("w-1.5 h-1.5 rounded-full", dotMap[variant])} />}
      {children}
    </span>
  );
}

export function statusVariantForTender(s: string): Variant {
  switch (s) {
    case "Draft": return "draft";
    case "Submitted": return "submitted";
    case "Won": return "won";
    case "Lost": return "lost";
    default: return "neutral";
  }
}
export function statusVariantForMaterial(s: string): Variant {
  switch (s) {
    case "Pending": return "pending";
    case "Partial": return "partial";
    case "Completed": return "completed";
    case "Over-purchased": return "over";
    default: return "neutral";
  }
}
export function statusVariantForProject(s: string): Variant {
  switch (s) {
    case "Active": return "active";
    case "On Hold": return "hold";
    case "Completed": return "completed";
    default: return "neutral";
  }
}
