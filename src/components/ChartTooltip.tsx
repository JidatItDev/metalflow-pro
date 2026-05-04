import { fmtCurrency } from "@/lib/format";

type PayloadRow = { name?: string; value?: number; color?: string; dataKey?: string };

export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter = fmtCurrency,
}: {
  active?: boolean;
  payload?: PayloadRow[];
  label?: string;
  valueFormatter?: (n: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card/95 backdrop-blur-sm px-3 py-2.5 shadow-lg min-w-[160px]">
      <div className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">{label}</div>
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={p.dataKey ?? p.name ?? i} className="flex items-center justify-between gap-6 text-xs">
            <span className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              <span className="text-muted-foreground truncate">{p.name}</span>
            </span>
            <span className="font-semibold tabular-nums text-foreground">{valueFormatter(Number(p.value))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
