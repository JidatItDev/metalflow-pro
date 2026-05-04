import { useNavigate } from "react-router-dom";
import { useStore, projectFinancials } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, statusVariantForProject } from "@/components/StatusBadge";
import { ProgressBar, variantForProgress } from "@/components/ProgressBar";
import { fmtCurrency, fmtDate } from "@/lib/format";
import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Projects() {
  const navigate = useNavigate();
  const projects = useStore(s => s.projects);
  const [tab, setTab] = useState("All");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => projects.filter(p => {
    const ok = tab === "All" || p.status === tab;
    const m = `${p.title} ${p.client} ${p.code}`.toLowerCase().includes(q.toLowerCase());
    return ok && m;
  }), [projects, tab, q]);

  return (
    <>
      <PageHeader title="Projects" subtitle="Active and completed work" />

      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel-300" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search projects…" className="pl-9 h-9" />
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-secondary h-9">
            {["All", "Active", "On Hold", "Completed"].map(s =>
              <TabsTrigger key={s} value={s} className="text-2xs h-7 px-3 data-[state=active]:bg-white">{s}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(p => {
          const f = projectFinancials(p.id)!;
          const profitPositive = f.profit >= 0;
          return (
            <button key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
              className="surface-card p-5 text-left hover:shadow-sm hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="min-w-0">
                  <div className="text-card font-medium truncate">{p.title}</div>
                  <div className="text-2xs text-muted-foreground">{p.code}</div>
                </div>
                <StatusBadge variant={statusVariantForProject(p.status)}>{p.status}</StatusBadge>
              </div>
              <div className="text-label mb-4 truncate">{p.client} · {p.location}</div>

              <div className="surface-metric p-3 mb-4">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xs text-muted-foreground">Contract value</div>
                    <div className="text-card font-medium tabular-nums">{fmtCurrency(p.contractValue)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xs text-muted-foreground">Profit</div>
                    <div className={"text-card font-medium tabular-nums " + (profitPositive ? "text-success" : "text-danger")}>
                      {profitPositive ? "+" : ""}{fmtCurrency(f.profit)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-1.5">
                <span className="text-2xs text-muted-foreground">Progress</span>
                <span className="text-2xs font-medium">{p.progress}%</span>
              </div>
              <ProgressBar value={p.progress} variant={variantForProgress(p.progress)} />
              <div className="text-2xs text-muted-foreground mt-3">
                {fmtDate(p.startDate)} → {fmtDate(p.endDate)}
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && <div className="surface-card py-16 text-center text-label">No projects yet.</div>}
    </>
  );
}
