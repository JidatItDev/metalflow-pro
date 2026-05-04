import { describe, it, expect } from "vitest";
import { buildProfitMonthlySeries } from "@/lib/profit";
import { Project, Expense } from "@/lib/types";

describe("buildProfitMonthlySeries", () => {
  const projects: Project[] = [
    {
      id: "prj_001",
      code: "P-001",
      title: "Atlas",
      client: "A",
      location: "Qatar",
      contractValue: 120000,
      status: "Active",
      progress: 50,
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: "2026-06-30T00:00:00.000Z",
      materials: [],
    },
    {
      id: "prj_002",
      code: "P-002",
      title: "Marina",
      client: "B",
      location: "Qatar",
      contractValue: 60000,
      status: "Active",
      progress: 30,
      startDate: "2026-02-01T00:00:00.000Z",
      endDate: "2026-07-31T00:00:00.000Z",
      materials: [],
    },
  ];

  const expenses: Expense[] = [
    { id: "e1", projectId: "prj_001", category: "Materials", description: "a", amount: 5000, date: "2026-03-10T00:00:00.000Z", source: "manual" },
    { id: "e2", projectId: "prj_002", category: "Materials", description: "b", amount: 3000, date: "2026-03-11T00:00:00.000Z", source: "manual" },
  ];

  it("returns profit as revenue minus expenses for all projects", () => {
    const series = buildProfitMonthlySeries(projects, expenses, ["2026-03"]);
    expect(series).toHaveLength(1);
    expect(series[0]).toMatchObject({
      Revenue: 30000,
      Expenses: 8000,
      Profit: 22000,
    });
  });

  it("filters data by selected project", () => {
    const series = buildProfitMonthlySeries(projects, expenses, ["2026-03"], "prj_001");
    expect(series).toHaveLength(1);
    expect(series[0]).toMatchObject({
      Revenue: 20000,
      Expenses: 5000,
      Profit: 15000,
    });
  });
});
