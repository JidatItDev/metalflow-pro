import { motion } from "framer-motion";
import { useStore, projectFinancials } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { ChartTooltip } from "@/components/ChartTooltip";
import { fmtCurrency } from "@/lib/format";
import { ProgressBar, variantForProgress } from "@/components/ProgressBar";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart, Line,
} from "recharts";

const cardEnter = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] as const },
};

export default function Reports() {
  const projects = useStore(s => s.projects);
  const expenses = useStore(s => s.expenses);
  const workers = useStore(s => s.workers);
  const assignments = useStore(s => s.assignments);

  const profitability = projects.map(p => {
    const f = projectFinancials(p.id)!;
    return { name: p.code, project: p.title, Revenue: p.contractValue, Cost: f.totalCost, Profit: f.profit };
  });

  const budgetVsActual = projects.map(p => {
    const estimated = p.materials.reduce((s, m) => s + m.quantity * m.rate, 0);
    const actual = expenses.filter(e => e.projectId === p.id && e.category === "Materials").reduce((s, e) => s + e.amount, 0);
    return { name: p.code, Estimated: estimated, Actual: actual };
  });

  const labourBreakdown = workers.map(w => {
    const days = assignments.filter(a => a.workerId === w.id).reduce((s, a) => s + a.days, 0);
    return { name: w.name.split(" ")[0], cost: days * w.dailyWage };
  }).filter(x => x.cost > 0);

  const monthly = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i)); d.setDate(1);
    const monthKey = d.toISOString().slice(0, 7);
    const monthLabel = d.toLocaleDateString("en-US", { month: "short" });
    let revenue = 0;
    projects.forEach(p => {
      const start = new Date(p.startDate); const end = new Date(p.endDate);
      const months = Math.max(1, Math.round((end.getTime() - start.getTime()) / (30 * 86400000)));
      if (d >= start && d <= end) revenue += p.contractValue / months;
    });
    const exp = expenses.filter(e => e.date.slice(0, 7) === monthKey).reduce((s, e) => s + e.amount, 0);
    return { month: monthLabel, Revenue: Math.round(revenue), Expenses: Math.round(exp) };
  });

  return (
    <>
      <PageHeader title="Reports" subtitle="Performance across projects, labour and time" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div className="surface-card p-5" {...cardEnter} transition={{ ...cardEnter.transition, delay: 0 }}>
          <h2 className="text-section mb-4">Project balance remaining</h2>
          <div className="space-y-3">
            {profitability.map(p => {
              const margin = p.Revenue > 0 ? (p.Profit / p.Revenue) * 100 : 0;
              return (
                <div key={p.name}>
                  <div className="flex items-center justify-between text-body mb-1 gap-2">
                    <span className="font-semibold truncate tracking-tight">{p.project}</span>
                    <span className={"tabular-nums shrink-0 font-semibold " + (p.Profit >= 0 ? "text-success" : "text-danger")}>
                      {p.Profit >= 0 ? "+" : ""}{fmtCurrency(p.Profit)}
                    </span>
                  </div>
                  <ProgressBar value={Math.max(0, Math.min(100, (p.Cost / Math.max(1, p.Revenue)) * 100))}
                    variant={p.Profit >= 0 ? "success" : "danger"} />
                  <div className="flex items-center justify-between text-2xs text-muted-foreground mt-1">
                    <span>{fmtCurrency(p.Cost)} of {fmtCurrency(p.Revenue)}</span>
                    <span>{margin.toFixed(1)}% of contract</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div className="surface-card p-5" {...cardEnter} transition={{ ...cardEnter.transition, delay: 0.08 }}>
          <h2 className="text-section mb-4">Budget vs actual (materials)</h2>
          <div className="h-64 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetVsActual} margin={{ top: 10, right: 8, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="repBarEst" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-expense))" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="hsl(155 12% 38%)" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="repBarAct" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-revenue))" />
                    <stop offset="100%" stopColor="hsl(152 42% 44%)" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--chart-grid))" strokeDasharray="3 6" vertical={false} strokeOpacity={0.65} />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={36} />
                <Tooltip
                  content={({ active, payload, label }) => (
                    <ChartTooltip active={active} payload={payload as never} label={label} />
                  )}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                <Bar dataKey="Estimated" fill="url(#repBarEst)" radius={[7, 7, 0, 0]} maxBarSize={28} animationDuration={900} animationEasing="ease-out" />
                <Bar dataKey="Actual" fill="url(#repBarAct)" radius={[7, 7, 0, 0]} maxBarSize={28} animationDuration={900} animationEasing="ease-out" animationBegin={100} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className="surface-card p-5" {...cardEnter} transition={{ ...cardEnter.transition, delay: 0.14 }}>
          <h2 className="text-section mb-4">Labour cost breakdown</h2>
          <div className="h-64 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={labourBreakdown} layout="vertical" margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="repLabour" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--warning))" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="hsl(34 85% 48%)" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--chart-grid))" strokeDasharray="3 6" horizontal={false} strokeOpacity={0.65} />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip
                  content={({ active, payload, label }) => (
                    <ChartTooltip active={active} payload={payload as never} label={label} />
                  )}
                />
                <Bar dataKey="cost" fill="url(#repLabour)" radius={[0, 8, 8, 0]} maxBarSize={22} animationDuration={900} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className="surface-card p-5" {...cardEnter} transition={{ ...cardEnter.transition, delay: 0.2 }}>
          <h2 className="text-section mb-4">Monthly revenue vs expenses</h2>
          <div className="h-64 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--chart-grid))" strokeDasharray="3 6" vertical={false} strokeOpacity={0.65} />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={36} />
                <Tooltip
                  content={({ active, payload, label }) => (
                    <ChartTooltip active={active} payload={payload as never} label={label} />
                  )}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} iconType="circle" />
                <Line
                  type="monotone"
                  dataKey="Revenue"
                  stroke="hsl(var(--chart-revenue))"
                  strokeWidth={2.75}
                  dot={{ r: 3.5, strokeWidth: 2, stroke: "hsl(var(--card))", fill: "hsl(var(--chart-revenue))" }}
                  activeDot={{ r: 7, strokeWidth: 2, stroke: "hsl(var(--card))", fill: "hsl(var(--chart-revenue))" }}
                  animationDuration={1100}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="Expenses"
                  stroke="hsl(var(--chart-expense))"
                  strokeWidth={2.75}
                  dot={{ r: 3.5, strokeWidth: 2, stroke: "hsl(var(--card))", fill: "hsl(var(--chart-expense))" }}
                  activeDot={{ r: 7, strokeWidth: 2, stroke: "hsl(var(--card))", fill: "hsl(var(--chart-expense))" }}
                  animationDuration={1100}
                  animationEasing="ease-out"
                  animationBegin={150}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </>
  );
}
