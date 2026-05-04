import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useStore, projectFinancials } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { ChartTooltip } from "@/components/ChartTooltip";
import { StatusBadge, statusVariantForProject } from "@/components/StatusBadge";
import { ProgressBar, variantForProgress } from "@/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { fmtCurrency, fmtDate, rollingChartMonthKeys } from "@/lib/format";
import { buildProfitMonthlySeries } from "@/lib/profit";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Line, LineChart,
} from "recharts";
import {
  TrendingUp, Wallet, Briefcase, AlertTriangle, ArrowRight, Plus, FileText, FolderKanban, HardHat,
} from "lucide-react";

const sectionMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const projects = useStore(s => s.projects);
  const tenders = useStore(s => s.tenders);
  const expenses = useStore(s => s.expenses);
  const purchases = useStore(s => s.purchases);
  const [productFilter, setProductFilter] = useState("all");

  const activeProjects = projects.filter(p => p.status === "Active");
  const totalContractValue = projects.reduce((s, p) => s + p.contractValue, 0);
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const totalProfit = projects.reduce((s, p) => s + (projectFinancials(p.id)?.profit ?? 0), 0);

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

  const overBudget = projects.filter(p => {
    const f = projectFinancials(p.id);
    return f && f.totalCost > p.contractValue;
  });

  const monthly = buildProfitMonthlySeries(projects, expenses, rollingChartMonthKeys(), productFilter);
  const selectedProduct = projects.find(p => p.id === productFilter);

  const metrics = [
    { label: "Active projects", value: activeProjects.length, hint: `${projects.length} total`, icon: <Briefcase className="w-4 h-4" /> },
    { label: "Contract value", value: fmtCurrency(totalContractValue), hint: "All projects", icon: <Wallet className="w-4 h-4" /> },
    { label: "Total spent", value: fmtCurrency(totalSpent), hint: "Materials · Labour · Other", icon: <TrendingUp className="w-4 h-4" /> },
    {
      label: "Balance remaining",
      value: fmtCurrency(totalProfit),
      hint: totalProfit >= 0 ? "Contract value minus costs" : "Over committed vs contracts",
      trend: { value: `${((totalProfit / Math.max(1, totalContractValue)) * 100).toFixed(1)}%`, positive: totalProfit >= 0 },
      icon: <TrendingUp className="w-4 h-4" />,
    },
  ] as const;

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
        {metrics.map((m, i) => (
          <MetricCard key={m.label} {...m} delay={i * 0.08} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <motion.div
          className="lg:col-span-2 surface-card p-5 overflow-hidden"
          {...sectionMotion}
          transition={{ ...sectionMotion.transition, delay: 0.12 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-section">Revenue vs expenses</h2>
              <p className="text-label mt-0.5">
                Last 6 months · {selectedProduct ? selectedProduct.title : "All Projects"} · includes profit trend
              </p>
            </div>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-[240px] h-9">
                <SelectValue placeholder="Filter by product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="h-72 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthly} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashFillRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-revenue))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(152 45% 46%)" stopOpacity={0.92} />
                  </linearGradient>
                  <linearGradient id="dashFillExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-expense))" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="hsl(155 14% 42%)" stopOpacity={0.85} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--chart-grid))" strokeDasharray="3 6" vertical={false} strokeOpacity={0.65} />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} dy={4} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={36} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--accent-soft) / 0.45)" }}
                  content={({ active, payload, label }) => (
                    <ChartTooltip active={active} payload={payload as never} label={label} />
                  )}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" />
                <Bar
                  dataKey="Revenue"
                  fill="url(#dashFillRev)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={32}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
                <Bar
                  dataKey="Expenses"
                  fill="url(#dashFillExp)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={32}
                  animationDuration={1000}
                  animationEasing="ease-out"
                  animationBegin={120}
                />
                <Line
                  type="monotone"
                  dataKey="Profit"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2.75}
                  dot={{ r: 3, strokeWidth: 2, stroke: "hsl(var(--card))", fill: "hsl(var(--accent))" }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: "hsl(var(--card))", fill: "hsl(var(--accent))" }}
                  animationDuration={1000}
                  animationEasing="ease-out"
                  animationBegin={180}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          className="surface-card p-5"
          {...sectionMotion}
          transition={{ ...sectionMotion.transition, delay: 0.22 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <h2 className="text-section">Alerts</h2>
          </div>
          <div className="space-y-3">
            {overBudget.map(p => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-danger-soft border border-danger/15"
              >
                <span className="status-dot bg-danger mt-1.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-body font-medium truncate">{p.title}</div>
                  <div className="text-2xs text-muted-foreground">Over budget — review costs</div>
                </div>
              </motion.div>
            ))}
            {overPurchased.slice(0, 3).map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i }}
                className="flex items-start gap-3 p-3 rounded-lg bg-warning-soft border border-warning/20"
              >
                <span className="status-dot bg-warning mt-1.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-body font-medium truncate">{a.material}</div>
                  <div className="text-2xs text-muted-foreground">+{a.over} {a.unit} over · {a.project}</div>
                </div>
              </motion.div>
            ))}
            {pendingMaterials.slice(0, 2).map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary border border-border/80"
              >
                <span className="status-dot bg-slate-500 mt-1.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-body font-medium truncate">{p.project}</div>
                  <div className="text-2xs text-muted-foreground">{p.count} material{p.count > 1 ? "s" : ""} not yet purchased</div>
                </div>
              </motion.div>
            ))}
            {overBudget.length === 0 && overPurchased.length === 0 && pendingMaterials.length === 0 && (
              <div className="text-label py-8 text-center">No alerts. All projects are on track.</div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        className="surface-card p-5 mb-6"
        {...sectionMotion}
        transition={{ ...sectionMotion.transition, delay: 0.26 }}
      >
        <div className="mb-4">
          <h2 className="text-section">Monthly profit trend</h2>
          <p className="text-label mt-0.5">
            Profit only · {selectedProduct ? selectedProduct.title : "All Projects"}
          </p>
        </div>
        <div className="h-64 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthly} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--chart-grid))" strokeDasharray="3 6" vertical={false} strokeOpacity={0.65} />
              <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                width={36}
              />
              <Tooltip
                content={({ active, payload, label }) => (
                  <ChartTooltip active={active} payload={payload as never} label={label} />
                )}
              />
              <Line
                type="monotone"
                dataKey="Profit"
                name="Profit"
                stroke="hsl(var(--accent))"
                strokeWidth={2.8}
                dot={{ r: 3.5, strokeWidth: 2, stroke: "hsl(var(--card))", fill: "hsl(var(--accent))" }}
                activeDot={{ r: 7, strokeWidth: 2, stroke: "hsl(var(--card))", fill: "hsl(var(--accent))" }}
                animationDuration={1000}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div
        className="surface-card p-5 mb-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.48, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
      >
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
          {activeProjects.map((p, i) => {
            const f = projectFinancials(p.id)!;
            return (
              <motion.button
                key={p.id}
                type="button"
                onClick={() => navigate(`/projects/${p.id}`)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 + i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 22 } }}
                whileTap={{ scale: 0.995 }}
                className="text-left p-4 rounded-xl bg-accent-soft/70 border border-accent/25 shadow-md hover:bg-accent-soft hover:border-accent/35 hover:shadow-lg transition-[box-shadow,border-color,background-color] duration-300 group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="type-card truncate tracking-tight">{p.title}</div>
                    <div className="text-2xs text-muted-foreground truncate mt-0.5">{p.client} · {p.code}</div>
                  </div>
                  <StatusBadge variant={statusVariantForProject(p.status)}>{p.status}</StatusBadge>
                </div>
                <ProgressBar value={p.progress} variant={variantForProgress(p.progress)} />
                <div className="flex items-center justify-between mt-3 text-2xs">
                  <span className="text-muted-foreground">{p.progress}% complete · ends {fmtDate(p.endDate)}</span>
                  <span className={f.profit >= 0 ? "text-success font-semibold tabular-nums" : "text-danger font-semibold tabular-nums"}>
                    {f.profit >= 0 ? "+" : ""}{fmtCurrency(f.profit)}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.28, duration: 0.4 }}
      >
        {[
          { label: "New tender", icon: FileText, to: "/tenders/new" },
          { label: "Open projects", icon: FolderKanban, to: "/projects" },
          { label: "Assign worker", icon: HardHat, to: "/labour" },
          { label: "Log expense", icon: Wallet, to: "/expenses" },
        ].map((qa, i) => (
          <motion.button
            key={qa.label}
            type="button"
            onClick={() => navigate(qa.to)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 + i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3, transition: { type: "spring", stiffness: 380, damping: 24 } }}
            whileTap={{ scale: 0.98 }}
            className="surface-card p-4 flex items-center gap-3 text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-accent-soft/80 group-hover:bg-accent/15 flex items-center justify-center text-accent transition-colors duration-300 ring-1 ring-accent/10">
              <qa.icon className="w-4 h-4" />
            </div>
            <div className="text-body font-semibold tracking-tight">{qa.label}</div>
          </motion.button>
        ))}
      </motion.div>
    </>
  );
}
