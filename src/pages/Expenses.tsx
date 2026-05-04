import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtCurrency, fmtDate } from "@/lib/format";
import { Expense, ExpenseCategory } from "@/lib/types";
import { ArrowUpRight, Search } from "lucide-react";

const CATEGORY_TABS: ("All" | ExpenseCategory)[] = [
  "All", "Materials", "Labour", "Transport", "Fuel", "Equipment", "Site", "Admin", "Misc",
];

function categoryBadgeVariant(category: ExpenseCategory): "info" | "warning" | "neutral" {
  if (category === "Materials") return "info";
  if (category === "Labour") return "warning";
  return "neutral";
}

export default function Expenses() {
  const expenses = useStore(s => s.expenses);
  const projects = useStore(s => s.projects);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("All");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const filtered = useMemo(() => expenses.filter(e => {
    const proj = projects.find(p => p.id === e.projectId);
    const matchesQ = `${e.description} ${proj?.title ?? ""} ${proj?.code ?? ""} ${e.category}`.toLowerCase().includes(q.toLowerCase());
    const matchesTab = tab === "All" || e.category === tab;
    const matchesProject = projectFilter === "all" || e.projectId === projectFilter;
    return matchesQ && matchesTab && matchesProject;
  }), [expenses, projects, q, tab, projectFilter]);

  const total = useMemo(() => filtered.reduce((s, e) => s + e.amount, 0), [filtered]);

  const uniqueProjectCount = useMemo(() => new Set(filtered.map(e => e.projectId)).size, [filtered]);

  const categoryTotals = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of filtered) {
      m.set(e.category, (m.get(e.category) ?? 0) + e.amount);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const groupedByProject = useMemo(() => {
    const m = new Map<string, Expense[]>();
    for (const e of filtered) {
      const arr = m.get(e.projectId) ?? [];
      arr.push(e);
      m.set(e.projectId, arr);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return [...m.entries()].sort((a, b) => {
      const pa = projects.find(p => p.id === a[0]);
      const pb = projects.find(p => p.id === b[0]);
      return (pa?.title ?? "").localeCompare(pb?.title ?? "");
    });
  }, [filtered, projects]);

  const selectedProjectLabel = projectFilter === "all"
    ? "All projects"
    : projects.find(p => p.id === projectFilter)?.title ?? "Project";

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle="Spending by project — filter, search, and scan grouped lines."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="surface-card p-4">
          <div className="text-label mb-1">Total (this view)</div>
          <div className="text-metric tabular-nums">{fmtCurrency(total)}</div>
          <div className="text-2xs text-muted-foreground mt-1">{filtered.length} line{filtered.length === 1 ? "" : "s"}</div>
        </div>
        <div className="surface-card p-4">
          <div className="text-label mb-1">Projects in view</div>
          <div className="text-metric tabular-nums">{uniqueProjectCount}</div>
          <div className="text-2xs text-muted-foreground mt-1 truncate" title={selectedProjectLabel}>
            {projectFilter === "all" ? "Across all filtered projects" : selectedProjectLabel}
          </div>
        </div>
        <div className="surface-card p-4 min-h-[5.5rem]">
          <div className="text-label mb-1.5">Top categories (this view)</div>
          <div className="flex flex-wrap gap-1.5">
            {categoryTotals.slice(0, 4).map(([cat, amt]) => (
              <Badge key={cat} variant="secondary" className="font-normal text-2xs tabular-nums">
                {cat}: {fmtCurrency(amt)}
              </Badge>
            ))}
            {categoryTotals.length === 0 && (
              <span className="text-2xs text-muted-foreground">No data for current filters</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-[260px] h-9">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="font-medium">{p.code}</span>
                  <span className="text-muted-foreground"> — {p.title}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1 min-w-0 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel-300" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search description, project, or category…" className="pl-9 h-9" />
          </div>
        </div>
        <div className="-mx-1 px-1 overflow-x-auto pb-1">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-secondary h-9 inline-flex w-max min-w-full sm:w-auto flex-nowrap justify-start">
              {CATEGORY_TABS.map(s => (
                <TabsTrigger key={s} value={s} className="text-xs shrink-0 px-3 h-7 data-[state=active]:bg-white">
                  {s}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="space-y-6">
        {groupedByProject.map(([projectId, list]) => {
          const proj = projects.find(p => p.id === projectId);
          const subtotal = list.reduce((s, e) => s + e.amount, 0);
          const title = proj?.title ?? "Unknown project";
          const code = proj?.code ?? "—";

          return (
            <div key={projectId} className="surface-card overflow-hidden">
              <div className="px-4 py-3 sm:px-5 sm:py-4 bg-secondary/40 hairline-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <h2 className="text-section truncate">{title}</h2>
                    <Badge variant="outline" className="shrink-0 font-mono text-2xs">{code}</Badge>
                  </div>
                  {proj && (
                    <p className="text-2xs text-muted-foreground truncate">
                      {proj.client} · {proj.location}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <div className="text-right">
                    <div className="text-2xs text-muted-foreground">Subtotal · {list.length} expense{list.length === 1 ? "" : "s"}</div>
                    <div className="text-body font-semibold tabular-nums">{fmtCurrency(subtotal)}</div>
                  </div>
                  {proj && (
                    <Button variant="outline" size="sm" className="h-8 shrink-0" asChild>
                      <Link to={`/projects/${proj.id}`}>
                        Open project <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              {/* Column headers — desktop */}
              <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-2.5 text-label hairline-b bg-muted/30">
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-5">Description</div>
                <div className="col-span-1">Source</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>

              <div className="divide-y divide-border">
                {list.map(e => (
                  <div key={e.id}>
                    <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 items-center text-body hover:bg-muted/20 transition-colors">
                      <div className="col-span-2 text-2xs text-muted-foreground tabular-nums">{fmtDate(e.date)}</div>
                      <div className="col-span-2">
                        <StatusBadge withDot={false} variant={categoryBadgeVariant(e.category)}>{e.category}</StatusBadge>
                      </div>
                      <div className="col-span-5 min-w-0">
                        <div className="truncate font-medium">{e.description}</div>
                      </div>
                      <div className="col-span-1 text-2xs text-muted-foreground capitalize">{e.source}</div>
                      <div className="col-span-2 text-right font-semibold tabular-nums">{fmtCurrency(e.amount)}</div>
                    </div>
                    <div className="md:hidden p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <StatusBadge withDot={false} variant={categoryBadgeVariant(e.category)}>{e.category}</StatusBadge>
                        <span className="text-body font-semibold tabular-nums shrink-0">{fmtCurrency(e.amount)}</span>
                      </div>
                      <p className="text-body leading-snug">{e.description}</p>
                      <div className="text-2xs text-muted-foreground flex flex-wrap gap-x-2 gap-y-0.5">
                        <span className="tabular-nums">{fmtDate(e.date)}</span>
                        <span aria-hidden>·</span>
                        <span className="capitalize">{e.source}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="surface-card py-16 px-4 text-center">
            <p className="text-body font-medium mb-1">No expenses match</p>
            <p className="text-label max-w-sm mx-auto">Try another project filter, category tab, or search term.</p>
          </div>
        )}
      </div>
    </>
  );
}
