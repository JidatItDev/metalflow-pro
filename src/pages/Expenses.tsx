import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtCurrency, fmtDate } from "@/lib/format";
import { Search } from "lucide-react";

export default function Expenses() {
  const expenses = useStore(s => s.expenses);
  const projects = useStore(s => s.projects);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("All");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const filtered = useMemo(() => expenses.filter(e => {
    const proj = projects.find(p => p.id === e.projectId);
    const matchesQ = `${e.description} ${proj?.title ?? ""} ${e.category}`.toLowerCase().includes(q.toLowerCase());
    const matchesTab = tab === "All" || e.category === tab;
    const matchesProject = projectFilter === "all" || e.projectId === projectFilter;
    return matchesQ && matchesTab && matchesProject;
  }), [expenses, projects, q, tab, projectFilter]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <>
      <PageHeader title="Expenses" subtitle={`${filtered.length} entries · ${fmtCurrency(total)}`} />
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-[220px] h-9">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.title} · {p.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1 min-w-0 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel-300" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search expenses…" className="pl-9 h-9" />
          </div>
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-secondary h-9">
            {["All", "Materials", "Labour", "Transport", "Fuel", "Equipment", "Site", "Admin", "Misc"].map(s =>
              <TabsTrigger key={s} value={s} className="text-2xs h-7 px-3 data-[state=active]:bg-white">{s}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </div>
      <div className="surface-card overflow-hidden">
        <div className="divide-y divide-border">
          {filtered.map(e => {
            const proj = projects.find(p => p.id === e.projectId);
            return (
              <div key={e.id} className="p-4 flex items-start sm:items-center gap-3">
                <div className="flex flex-wrap items-center gap-2 shrink-0 max-w-full">
                  <StatusBadge withDot={false} variant={
                    e.category === "Materials" ? "info" : e.category === "Labour" ? "warning" : "neutral"
                  }>{e.category}</StatusBadge>
                  <Badge
                    variant="secondary"
                    className="font-normal max-w-[min(220px,45vw)] truncate"
                    title={proj ? `${proj.title} (${proj.code})` : undefined}
                  >
                    {proj?.title ?? "—"}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-body truncate">{e.description}</div>
                  <div className="text-2xs text-muted-foreground truncate">{fmtDate(e.date)} · {e.source}</div>
                </div>
                <div className="text-body font-medium tabular-nums shrink-0">{fmtCurrency(e.amount)}</div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="py-12 text-center text-label">No expenses match.</div>}
        </div>
      </div>
    </>
  );
}
