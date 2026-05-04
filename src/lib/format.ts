export const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-QA", { style: "currency", currency: "QAR", maximumFractionDigits: 0 }).format(n || 0);

export const fmtNumber = (n: number, d = 0) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n || 0);

export const fmtDate = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const fmtDateShort = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

export const uid = (prefix = "id") =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;

export const todayISO = () => new Date().toISOString();

export const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

/** YYYY-MM keys for the dashboard “last 6 months” chart (oldest first). Matches local month anchors + UTC key slice used in charts. */
export function rollingChartMonthKeys(): string[] {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    d.setDate(1);
    return d.toISOString().slice(0, 7);
  });
}
