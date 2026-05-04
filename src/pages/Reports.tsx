import { useStore, projectFinancials } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { fmtCurrency } from "@/lib/format";
import { ProgressBar, variantForProgress } from "@/components/ProgressBar";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart, Line,
} from "recharts";

export default function Reports() {
  const projects = useStore(s => s.projects);
  const expenses = useStore(s => s.expenses);
  const workers = useStore(s => s.workers);
  const assignments = useStore(s => s.assignments);

  // Project profitability
  const profitability = projects.map(p => {
    const f = projectFinancials(p.id)!;
    return { name: p.code, project: p.title, Revenue: p.contractValue, Cost: f.totalCost, Profit: f.profit };
  });

  // Budget vs actual per project
  const budgetVsActual = projects.map(p => {
    const estimated = p.materials.reduce((s, m) => s + m.quantity * m.rate, 0);
    const actual = expenses.filter(e => e.projectId === p.id && e.category === "Materials").reduce((s, e) => s + e.amount, 0);
    return { name: p.code, Estimated: estimated, Actual: actual };
  });

  // Labour breakdown
  const labourBreakdown = workers.map(w => {
    const days = assignments.filter(a => a.workerId === w.id).reduce((s, a) => s + a.days, 0);
    return { name: w.name.split(" ")[0], cost: days * w.dailyWage };
  }).filter(x => x.cost > 0);

  // Monthly revenue vs expenses (last 6 months)
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
        <div className="surface-card p-5">
          <h2 className="text-section mb-4">Project profitability</h2>
          <div className="space-y-3">
            {profitability.map(p => {
              const margin = p.Revenue > 0 ? (p.Profit / p.Revenue) * 100 : 0;
              return (
                <div key={p.name}>
                  <div className="flex items-center justify-between text-body mb-1">
                    <span className="font-medium truncate">{p.project}</span>
                    <span className={"tabular-nums " + (p.Profit >= 0 ? "text-success" : "text-danger")}>
                      {p.Profit >= 0 ? "+" : ""}{fmtCurrency(p.Profit)}
                    </span>
                  </div>
                  <ProgressBar value={Math.max(0, Math.min(100, (p.Cost / Math.max(1, p.Revenue)) * 100))}
                    variant={p.Profit >= 0 ? "success" : "danger"} />
                  <div className="flex items-center justify-between text-2xs text-muted-foreground mt-1">
                    <span>{fmtCurrency(p.Cost)} of {fmtCurrency(p.Revenue)}</span>
                    <span>{margin.toFixed(1)}% margin</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="surface-card p-5">
          <h2 className="text-section mb-4">Budget vs actual (materials)</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={budgetVsActual} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmtCurrency(v)} contentStyle={{ borderRadius: 8, border: "0.5px solid hsl(var(--border))", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                <Bar dataKey="Estimated" fill="hsl(var(--steel-300))" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Actual" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-5">
          <h2 className="text-section mb-4">Labour cost breakdown</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={labourBreakdown} layout="vertical" margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" horizontal={false} />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip formatter={(v: number) => fmtCurrency(v)} contentStyle={{ borderRadius: 8, border: "0.5px solid hsl(var(--border))", fontSize: 12 }} />
                <Bar dataKey="cost" fill="hsl(var(--warning))" radius={[0, 6, 6, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-5">
          <h2 className="text-section mb-4">Monthly revenue vs expenses</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={monthly} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmtCurrency(v)} contentStyle={{ borderRadius: 8, border: "0.5px solid hsl(var(--border))", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                <Line type="monotone" dataKey="Revenue" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Expenses" stroke="hsl(var(--slate-700))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
