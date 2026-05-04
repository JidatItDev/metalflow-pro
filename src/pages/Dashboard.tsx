import { useNavigate } from "react-router-dom";
import { useStore, projectFinancials } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge, statusVariantForProject } from "@/components/StatusBadge";
import { ProgressBar, variantForProgress } from "@/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { fmtCurrency, fmtDate } from "@/lib/format";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import {
  TrendingUp, Wallet, Briefcase, AlertTriangle, ArrowRight, Plus, FileText, FolderKanban, HardHat,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const projects = useStore(s => s.projects);
  const tenders = useStore(s => s.tenders);
  const expenses = useStore(s => s.expenses);
  const purchases = useStore(s => s.purchases);

  const activeProjects = projects.filter(p => p.status === "Active");
  const totalContractValue = projects.reduce((s, p) => s + p.contractValue, 0);
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const totalProfit = projects.reduce((s, p) => s + (projectFinancials(p.id)?.profit ?? 0), 0);

  // alerts
  const overPurchased: { project: string; material: string; over: number; unit: string }[] = [];
  const pendingMaterials: { project: string; count: number }[] = [];
  projects.forEach(p => {
    let pending = 0;
    p.materials.forEach(m => {
      const bought = purchases.filter(pp => pp.materialId === m.id).reduce((s, x) => s + x.quantity, 0);
      if (bought > m.quantity) overPurchased.push({ project: p.title, material: m.name, over: bought - m.quantity, unit: m.unit });
      if (bought === 0) pending++;
    });
    if (pending > 0) pendingMaterials.push({ project: p.title, count: pending });
  });

  // budget
  const overBudget = projects.filter(p => {
    const f = projectFinancials(p.id);
    return f && f.totalCost > p.contractValue;
  });

  // chart data: monthly revenue vs expenses for current year
  const monthly = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i)); d.setDate(1);
    const monthKey = d.toISOString().slice(0, 7);
    const monthLabel = d.toLocaleDateString("en-US", { month: "short" });
    // distribute revenue evenly across project duration for chart visualization
    let revenue = 0;
    projects.forEach(p => {
      const start = new Date(p.startDate); const end = new Date(p.endDate);
      const months = Math.max(1, Math.round((end.getTime() - start.getTime()) / (30 * 86400000)));
      const monthDate = new Date(d);
      if (monthDate >= start && monthDate <= end) revenue += p.contractValue / months;
    });
    const exp = expenses.filter(e => e.date.slice(0, 7) === monthKey).reduce((s, e) => s + e.amount, 0);
    return { month: monthLabel, Revenue: Math.round(revenue), Expenses: Math.round(exp) };
  });

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Operational overview · live profitability and procurement health"
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/projects")}>
              <Briefcase className="w-4 h-4 mr-1.5" /> Projects
            </Button>
            <Button onClick={() => navigate("/tenders/new")}>
              <Plus className="w-4 h-4 mr-1.5" /> New Tender
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Active projects" value={activeProjects.length} hint={`${projects.length} total`} icon={<Briefcase className="w-4 h-4" />} />
        <MetricCard label="Contract value" value={fmtCurrency(totalContractValue)} hint="All projects" icon={<Wallet className="w-4 h-4" />} />
        <MetricCard label="Total spent" value={fmtCurrency(totalSpent)} hint="Materials · Labour · Other" icon={<TrendingUp className="w-4 h-4" />} />
        <MetricCard
          label="Balance remaining"
          value={fmtCurrency(totalProfit)}
          hint={totalProfit >= 0 ? "Contract value minus costs" : "Over committed vs contracts"}
          trend={{ value: `${((totalProfit / Math.max(1, totalContractValue)) * 100).toFixed(1)}%`, positive: totalProfit >= 0 }}
          icon={<TrendingUp className="w-4 h-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Chart */}
        <div className="lg:col-span-2 surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-section">Revenue vs expenses</h2>
              <p className="text-label mt-0.5">Last 6 months</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={monthly} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--chart-grid))" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--accent-soft) / 0.5)" }}
                  contentStyle={{ borderRadius: 8, border: "0.5px solid hsl(var(--border))", fontSize: 12, background: "hsl(var(--card))" }}
                  formatter={(v: number) => fmtCurrency(v)}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                <Bar dataKey="Revenue" fill="hsl(var(--chart-revenue))" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Expenses" fill="hsl(var(--chart-expense))" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts */}
        <div className="surface-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <h2 className="text-section">Alerts</h2>
          </div>
          <div className="space-y-3">
            {overBudget.map(p => (
              <div key={p.id} className="flex items-start gap-3 p-3 rounded-md bg-danger-soft">
                <span className="status-dot bg-danger mt-1.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-body font-medium truncate">{p.title}</div>
                  <div className="text-2xs text-muted-foreground">Over budget — review costs</div>
                </div>
              </div>
            ))}
            {overPurchased.slice(0, 3).map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-warning-soft">
                <span className="status-dot bg-warning mt-1.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-body font-medium truncate">{a.material}</div>
                  <div className="text-2xs text-muted-foreground">+{a.over} {a.unit} over · {a.project}</div>
                </div>
              </div>
            ))}
            {pendingMaterials.slice(0, 2).map((p, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-secondary">
                <span className="status-dot bg-slate-500 mt-1.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-body font-medium truncate">{p.project}</div>
                  <div className="text-2xs text-muted-foreground">{p.count} material{p.count > 1 ? "s" : ""} not yet purchased</div>
                </div>
              </div>
            ))}
            {overBudget.length === 0 && overPurchased.length === 0 && pendingMaterials.length === 0 && (
              <div className="text-label py-8 text-center">No alerts. All projects are on track.</div>
            )}
          </div>
        </div>
      </div>

      {/* Active projects */}
      <div className="surface-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-section">Active projects</h2>
            <p className="text-label mt-0.5">Real-time profitability</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/projects")} className="text-accent">
            View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeProjects.map(p => {
            const f = projectFinancials(p.id)!;
            return (
              <button key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
                className="text-left p-4 rounded-[10px] bg-secondary hover:bg-accent-soft transition-colors group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="type-card truncate">{p.title}</div>
                    <div className="text-2xs text-muted-foreground truncate">{p.client} · {p.code}</div>
                  </div>
                  <StatusBadge variant={statusVariantForProject(p.status)}>{p.status}</StatusBadge>
                </div>
                <ProgressBar value={p.progress} variant={variantForProgress(p.progress)} />
                <div className="flex items-center justify-between mt-3 text-2xs">
                  <span className="text-muted-foreground">{p.progress}% complete · ends {fmtDate(p.endDate)}</span>
                  <span className={f.profit >= 0 ? "text-success font-medium" : "text-danger font-medium"}>
                    {f.profit >= 0 ? "+" : ""}{fmtCurrency(f.profit)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "New tender", icon: FileText, to: "/tenders/new" },
          { label: "Open projects", icon: FolderKanban, to: "/projects" },
          { label: "Assign worker", icon: HardHat, to: "/labour" },
          { label: "Log expense", icon: Wallet, to: "/expenses" },
        ].map(qa => (
          <button key={qa.label} onClick={() => navigate(qa.to)}
            className="surface-card p-4 hover:bg-accent-soft transition-colors flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-md bg-secondary group-hover:bg-white flex items-center justify-center text-slate-700">
              <qa.icon className="w-4 h-4" />
            </div>
            <div className="text-body font-medium">{qa.label}</div>
          </button>
        ))}
      </div>
    </>
  );
}
