import { rollingChartMonthKeys } from "./format";
import { Expense, Project } from "./types";

type ProfitPoint = {
  month: string;
  Revenue: number;
  Expenses: number;
  Profit: number;
};

function monthLabel(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short" });
}

function monthSpan(startISO: string, endISO: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / (30 * 86400000)));
}

export function buildProfitMonthlySeries(
  projects: Project[],
  expenses: Expense[],
  monthKeys = rollingChartMonthKeys(),
  projectId = "all",
): ProfitPoint[] {
  const scopedProjects = projectId === "all" ? projects : projects.filter(p => p.id === projectId);
  const scopedProjectIds = new Set(scopedProjects.map(p => p.id));

  return monthKeys.map((monthKey) => {
    const [y, m] = monthKey.split("-").map(Number);
    const monthAnchor = new Date(y, m - 1, 1);
    let revenue = 0;

    scopedProjects.forEach((p) => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      if (monthAnchor >= start && monthAnchor <= end) {
        revenue += p.contractValue / monthSpan(p.startDate, p.endDate);
      }
    });

    const monthExpense = expenses
      .filter(e => e.date.slice(0, 7) === monthKey && scopedProjectIds.has(e.projectId))
      .reduce((s, e) => s + e.amount, 0);

    const roundedRevenue = Math.round(revenue);
    const roundedExpenses = Math.round(monthExpense);

    return {
      month: monthLabel(monthKey),
      Revenue: roundedRevenue,
      Expenses: roundedExpenses,
      Profit: roundedRevenue - roundedExpenses,
    };
  });
}
