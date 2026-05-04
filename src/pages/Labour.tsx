import { useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { fmtCurrency, fmtDate } from "@/lib/format";

export default function Labour() {
  const navigate = useNavigate();
  const assignments = useStore(s => s.assignments);
  const workers = useStore(s => s.workers);
  const projects = useStore(s => s.projects);

  const grouped = projects.map(p => ({
    project: p,
    items: assignments.filter(a => a.projectId === p.id).map(a => {
      const w = workers.find(x => x.id === a.workerId)!;
      return { a, w };
    }).filter(x => x.w),
  })).filter(g => g.items.length > 0);

  const totalLabour = assignments.reduce((s, a) => {
    const w = workers.find(x => x.id === a.workerId);
    return s + (w ? w.dailyWage * a.days : 0);
  }, 0);

  return (
    <>
      <PageHeader title="Labour tracking" subtitle={`Total committed labour cost: ${fmtCurrency(totalLabour)}`} />

      <div className="space-y-4">
        {grouped.map(({ project, items }) => {
          const total = items.reduce((s, x) => s + x.w.dailyWage * x.a.days, 0);
          return (
            <div key={project.id} className="surface-card overflow-hidden">
              <button onClick={() => navigate(`/projects/${project.id}`)}
                className="w-full p-5 hairline-b flex items-center justify-between hover:bg-secondary/60">
                <div className="text-left min-w-0">
                  <div className="text-card font-medium truncate">{project.title}</div>
                  <div className="text-2xs text-muted-foreground">{project.code} · {items.length} worker{items.length === 1 ? "" : "s"}</div>
                </div>
                <div className="text-card font-medium tabular-nums">{fmtCurrency(total)}</div>
              </button>
              <div className="divide-y divide-border">
                {items.map(({ a, w }) => (
                  <div key={a.id} className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent-soft text-accent flex items-center justify-center text-2xs font-medium">
                      {w.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-body font-medium truncate">{w.name}</div>
                      <div className="text-2xs text-muted-foreground">{w.role} · started {fmtDate(a.startDate)}</div>
                    </div>
                    <div className="text-2xs text-muted-foreground">{a.days} days × {fmtCurrency(w.dailyWage)}</div>
                    <div className="w-28 text-right text-body font-medium tabular-nums">{fmtCurrency(w.dailyWage * a.days)}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {grouped.length === 0 && <div className="surface-card py-16 text-center text-label">No labour assignments yet.</div>}
      </div>
    </>
  );
}
