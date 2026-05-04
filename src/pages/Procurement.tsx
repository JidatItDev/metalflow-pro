import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore, materialPurchaseSummary } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, statusVariantForMaterial } from "@/components/StatusBadge";
import { ProgressBar, variantForProgress } from "@/components/ProgressBar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmtCurrency } from "@/lib/format";
import { Search } from "lucide-react";

export default function Procurement() {
  const navigate = useNavigate();
  const projects = useStore(s => s.projects);
  const purchases = useStore(s => s.purchases);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("All");

  const rows = useMemo(() => {
    const list: any[] = [];
    projects.forEach(p => {
      p.materials.forEach(m => {
        const sm = materialPurchaseSummary(m.id, m.quantity, purchases.filter(pp => pp.projectId === p.id));
        list.push({ project: p, material: m, summary: sm });
      });
    });
    return list.filter(r => {
      const matchesQ = `${r.material.name} ${r.project.title}`.toLowerCase().includes(q.toLowerCase());
      const matchesTab = tab === "All" || r.summary.status === tab;
      return matchesQ && matchesTab;
    });
  }, [projects, purchases, q, tab]);

  return (
    <>
      <PageHeader title="Procurement" subtitle="Material status across all projects" />
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel-300" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search materials…" className="pl-9 h-9" />
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-secondary h-9">
            {["All", "Pending", "Partial", "Completed", "Over-purchased"].map(s =>
              <TabsTrigger key={s} value={s} className="text-2xs h-7 px-3 data-[state=active]:bg-white">{s}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="divide-y divide-border">
          {rows.map(({ project, material, summary }) => (
            <button key={material.id} onClick={() => navigate(`/projects/${project.id}`)}
              className="w-full text-left p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center hover:bg-secondary/60">
              <div className="md:col-span-4">
                <div className="text-body font-medium truncate">{material.name}</div>
                <div className="text-2xs text-muted-foreground truncate">{project.title} · {project.code}</div>
              </div>
              <div className="md:col-span-4">
                <div className="flex items-center justify-between text-2xs mb-1.5">
                  <span className="text-muted-foreground tabular-nums">{summary.purchasedQty} / {material.quantity} {material.unit}</span>
                  <span className="font-medium">{summary.progress.toFixed(0)}%</span>
                </div>
                <ProgressBar value={summary.progress} variant={variantForProgress(summary.progress, summary.status)} />
              </div>
              <div className="md:col-span-2 text-right text-body tabular-nums">{fmtCurrency(summary.purchasedCost)}</div>
              <div className="md:col-span-2 flex md:justify-end">
                <StatusBadge variant={statusVariantForMaterial(summary.status)}>{summary.status}</StatusBadge>
              </div>
            </button>
          ))}
          {rows.length === 0 && <div className="py-12 text-center text-label">No materials found.</div>}
        </div>
      </div>
    </>
  );
}
