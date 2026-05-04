import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon, title, description, action, className,
}: { icon?: ReactNode; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-16 px-6", className)}>
      {icon && <div className="w-12 h-12 rounded-full bg-secondary text-steel-300 flex items-center justify-center mb-4">{icon}</div>}
      <p className="type-card text-foreground">{title}</p>
      {description && <p className="text-label mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
