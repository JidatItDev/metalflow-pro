import { create } from "zustand";
import {
  Tender, Project, Purchase, Worker, WorkerAssignment, Expense,
  MaterialLine, MaterialStatus, ExpenseCategory,
} from "./types";
import { uid, rollingChartMonthKeys } from "./format";

// ---------- SEED DATA ----------

const t1Materials: MaterialLine[] = [
  { id: "m_t1_1", name: "Aluminum Profile 50x50", unit: "m", quantity: 320, rate: 28 },
  { id: "m_t1_2", name: "Tempered Glass 8mm", unit: "sqm", quantity: 145, rate: 95 },
  { id: "m_t1_3", name: "Silicone Sealant", unit: "tube", quantity: 60, rate: 18 },
  { id: "m_t1_4", name: "Stainless Steel Bolts M8", unit: "pcs", quantity: 800, rate: 1.4 },
  { id: "m_t1_5", name: "Rubber Gasket", unit: "m", quantity: 280, rate: 6 },
];

const t2Materials: MaterialLine[] = [
  { id: "m_t2_1", name: "Aluminum Curtain Wall System", unit: "sqm", quantity: 220, rate: 320 },
  { id: "m_t2_2", name: "Insulated Glass Unit", unit: "sqm", quantity: 220, rate: 180 },
  { id: "m_t2_3", name: "Spider Fittings", unit: "pcs", quantity: 48, rate: 240 },
  { id: "m_t2_4", name: "Anchor Brackets", unit: "pcs", quantity: 96, rate: 35 },
  { id: "m_t2_5", name: "Powder Coating Service", unit: "sqm", quantity: 220, rate: 22 },
];

const seedTenders: Tender[] = [
  {
    id: "tnd_001", code: "T-2025-014", title: "Office Tower — Glazing Package",
    client: "Meridian Developments", clientContact: "Khalid Rahman · +971 50 442 8819",
    location: "Business Bay, Dubai",
    createdAt: "2025-04-08T09:00:00.000Z", dueDate: "2025-05-22T00:00:00.000Z",
    status: "Submitted", materials: t1Materials,
    labourEstimate: 38000, otherCosts: 12500, marginPct: 18,
    notes: "Phased delivery across 6 floors. Site access weekdays only.",
  },
  {
    id: "tnd_002", code: "T-2025-011", title: "Marina Residences — Curtain Wall",
    client: "Coastline Properties", clientContact: "Sara Mansoor · +971 55 109 7741",
    location: "Dubai Marina",
    createdAt: "2025-03-12T09:00:00.000Z", dueDate: "2025-04-02T00:00:00.000Z",
    status: "Won", materials: t2Materials,
    labourEstimate: 82000, otherCosts: 28000, marginPct: 22,
    notes: "Premium client, repeat business. Quality is critical.",
    convertedProjectId: "prj_002",
  },
  {
    id: "tnd_003", code: "T-2025-009", title: "Warehouse Skylight Replacement",
    client: "Logistic Park JLT", location: "JLT, Dubai",
    createdAt: "2025-02-20T09:00:00.000Z", dueDate: "2025-03-10T00:00:00.000Z",
    status: "Lost", materials: [
      { id: "m_t3_1", name: "Polycarbonate Sheet", unit: "sqm", quantity: 180, rate: 75 },
      { id: "m_t3_2", name: "Aluminum Frame", unit: "m", quantity: 220, rate: 24 },
    ],
    labourEstimate: 18000, otherCosts: 4000, marginPct: 15,
  },
];

// Project 1 — Active, partial procurement
const p1Materials: MaterialLine[] = [
  { id: "m_p1_1", name: "Aluminum Profile 60x40", unit: "m", quantity: 480, rate: 32 },
  { id: "m_p1_2", name: "Tempered Glass 10mm", unit: "sqm", quantity: 210, rate: 110 },
  { id: "m_p1_3", name: "Silicone Sealant", unit: "tube", quantity: 90, rate: 18 },
  { id: "m_p1_4", name: "Hinges Heavy Duty", unit: "pcs", quantity: 64, rate: 22 },
  { id: "m_p1_5", name: "EPDM Gasket", unit: "m", quantity: 360, rate: 7 },
];

// Project 2 — From won tender 002
const seedProjects: Project[] = [
  {
    id: "prj_001", code: "P-2025-006", title: "Atlas Plaza — Facade Refit",
    client: "Atlas Holdings", location: "Sheikh Zayed Rd, Dubai",
    contractValue: 285000, status: "Active", progress: 42,
    startDate: "2025-03-01T00:00:00.000Z", endDate: "2027-12-31T23:59:59.999Z",
    materials: p1Materials,
  },
  {
    id: "prj_002", code: "P-2025-008", title: "Marina Residences — Curtain Wall",
    client: "Coastline Properties", location: "Dubai Marina",
    contractValue: 198000, status: "Active", progress: 22,
    startDate: "2025-04-15T00:00:00.000Z", endDate: "2028-03-31T23:59:59.999Z",
    tenderId: "tnd_002",
    materials: t2Materials.map(m => ({ ...m, id: m.id.replace("t2", "p2") })),
  },
];

const seedPurchases: Purchase[] = [
  // p1_1 partial: 480 needed, bought 280
  { id: uid("pur"), materialId: "m_p1_1", projectId: "prj_001", supplier: "Gulf Aluminum Trading", quantity: 180, rate: 31, date: "2025-03-08T00:00:00.000Z", invoiceRef: "INV-2841" },
  { id: uid("pur"), materialId: "m_p1_1", projectId: "prj_001", supplier: "Gulf Aluminum Trading", quantity: 100, rate: 32.5, date: "2025-03-22T00:00:00.000Z", invoiceRef: "INV-2899" },
  // p1_2 completed: 210, bought 210
  { id: uid("pur"), materialId: "m_p1_2", projectId: "prj_001", supplier: "Emirates Glass Co.", quantity: 120, rate: 108, date: "2025-03-12T00:00:00.000Z", invoiceRef: "EG-7712" },
  { id: uid("pur"), materialId: "m_p1_2", projectId: "prj_001", supplier: "Emirates Glass Co.", quantity: 90, rate: 112, date: "2025-04-02T00:00:00.000Z", invoiceRef: "EG-7801" },
  // p1_3 over-purchased: 90 needed, bought 105
  { id: uid("pur"), materialId: "m_p1_3", projectId: "prj_001", supplier: "BuildMart", quantity: 60, rate: 18, date: "2025-03-09T00:00:00.000Z", invoiceRef: "BM-1102" },
  { id: uid("pur"), materialId: "m_p1_3", projectId: "prj_001", supplier: "BuildMart", quantity: 45, rate: 17.5, date: "2025-04-04T00:00:00.000Z", invoiceRef: "BM-1188" },
  // p1_4 pending: 0
  // p1_5 partial: 360 needed, bought 200
  { id: uid("pur"), materialId: "m_p1_5", projectId: "prj_001", supplier: "Seal & Gasket LLC", quantity: 200, rate: 6.8, date: "2025-03-18T00:00:00.000Z", invoiceRef: "SG-441" },

  // Project 2 — early stage
  { id: uid("pur"), materialId: "m_p2_4", projectId: "prj_002", supplier: "Anchor Tech", quantity: 96, rate: 34, date: "2025-04-22T00:00:00.000Z", invoiceRef: "AT-2025-09" },
  { id: uid("pur"), materialId: "m_p2_5", projectId: "prj_002", supplier: "Coat Pro", quantity: 80, rate: 22, date: "2025-04-28T00:00:00.000Z", invoiceRef: "CP-118" },
];

/** Demo purchases/manual lines aligned to the same rolling 6 months as the dashboard chart. */
const chartMonthKeys = rollingChartMonthKeys();
const demoRollingPurchases: Purchase[] = chartMonthKeys.flatMap((key, idx) => [
  {
    id: uid("pur"),
    materialId: "m_p1_1",
    projectId: "prj_001",
    supplier: "Gulf Aluminum Trading",
    quantity: 48 + idx * 7,
    rate: 32,
    date: `${key}-12T10:00:00.000Z`,
    invoiceRef: `ROLL-${key}-A`,
  },
  {
    id: uid("pur"),
    materialId: "m_p2_1",
    projectId: "prj_002",
    supplier: "Systems Procurement",
    quantity: 14 + (idx % 4),
    rate: 305,
    date: `${key}-24T10:00:00.000Z`,
    invoiceRef: `ROLL-${key}-B`,
  },
]);
const demoRollingManual: Expense[] = chartMonthKeys.map((key, i) => ({
  id: uid("exp"),
  projectId: i % 2 === 0 ? "prj_001" : "prj_002",
  category: (["Transport", "Fuel", "Site", "Equipment"] as const)[i % 4],
  description: `Site operations — ${key}`,
  amount: 3400 + i * 720 + (i % 3) * 380,
  date: `${key}-18T12:00:00.000Z`,
  source: "manual",
}));

const allSeedPurchases = [...seedPurchases, ...demoRollingPurchases];

const seedWorkers: Worker[] = [
  { id: "wkr_001", name: "Rashid Khan",     role: "Lead Fabricator", dailyWage: 320, phone: "+971 50 221 4488", active: true },
  { id: "wkr_002", name: "Mohammed Idris",  role: "Glazier",         dailyWage: 280, phone: "+971 55 100 8821", active: true },
  { id: "wkr_003", name: "Anwar Hussain",   role: "Welder",          dailyWage: 260, phone: "+971 56 411 2299", active: true },
  { id: "wkr_004", name: "Tariq Aslam",     role: "Helper",          dailyWage: 160, phone: "+971 50 990 1144", active: true },
  { id: "wkr_005", name: "Saleem Akhtar",   role: "Site Supervisor", dailyWage: 380, phone: "+971 52 661 7733", active: true },
];

const seedAssignments: WorkerAssignment[] = [
  { id: uid("wa"), projectId: "prj_001", workerId: "wkr_001", days: 42, startDate: "2025-03-03T00:00:00.000Z" },
  { id: uid("wa"), projectId: "prj_001", workerId: "wkr_002", days: 35, startDate: "2025-03-05T00:00:00.000Z" },
  { id: uid("wa"), projectId: "prj_001", workerId: "wkr_004", days: 50, startDate: "2025-03-03T00:00:00.000Z" },
  { id: uid("wa"), projectId: "prj_001", workerId: "wkr_005", days: 30, startDate: "2025-03-03T00:00:00.000Z" },

  { id: uid("wa"), projectId: "prj_002", workerId: "wkr_003", days: 18, startDate: "2025-04-18T00:00:00.000Z" },
  { id: uid("wa"), projectId: "prj_002", workerId: "wkr_004", days: 22, startDate: "2025-04-18T00:00:00.000Z" },
];

const seedManualExpenses: Expense[] = [
  { id: uid("exp"), projectId: "prj_001", category: "Transport", description: "Material delivery — site",     amount: 1850, date: "2025-03-10T00:00:00.000Z", source: "manual" },
  { id: uid("exp"), projectId: "prj_001", category: "Equipment", description: "Scaffolding rental (1 month)", amount: 4200, date: "2025-03-15T00:00:00.000Z", source: "manual" },
  { id: uid("exp"), projectId: "prj_001", category: "Fuel",      description: "Site vehicle fuel",            amount: 620,  date: "2025-04-01T00:00:00.000Z", source: "manual" },
  { id: uid("exp"), projectId: "prj_001", category: "Site",      description: "Safety equipment",             amount: 980,  date: "2025-03-20T00:00:00.000Z", source: "manual" },

  { id: uid("exp"), projectId: "prj_002", category: "Transport", description: "Crane mobilization",           amount: 6500, date: "2025-04-20T00:00:00.000Z", source: "manual" },
  { id: uid("exp"), projectId: "prj_002", category: "Admin",     description: "Permits and approvals",        amount: 2400, date: "2025-04-16T00:00:00.000Z", source: "manual" },
];

// ---------- STORE ----------

interface Store {
  // auth
  authed: boolean;
  user: { name: string; email: string; company: string };
  login: (email: string, password: string) => boolean;
  logout: () => void;

  tenders: Tender[];
  projects: Project[];
  purchases: Purchase[];
  workers: Worker[];
  assignments: WorkerAssignment[];
  expenses: Expense[];

  // tender ops
  createTender: (t: Omit<Tender, "id" | "code" | "createdAt" | "status"> & Partial<Pick<Tender, "status">>) => string;
  updateTender: (id: string, patch: Partial<Tender>) => void;
  duplicateTender: (id: string) => string | undefined;
  deleteTender: (id: string) => void;
  convertTenderToProject: (tenderId: string, contractValue: number, startDate: string, endDate: string) => string | undefined;

  // project ops
  updateProject: (id: string, patch: Partial<Project>) => void;
  addProjectMaterial: (projectId: string, m: Omit<MaterialLine, "id">) => void;
  updateProjectMaterial: (projectId: string, materialId: string, patch: Partial<MaterialLine>) => void;
  removeProjectMaterial: (projectId: string, materialId: string) => void;

  // purchases
  addPurchase: (p: Omit<Purchase, "id">) => void;
  removePurchase: (id: string) => void;

  // workers
  addWorker: (w: Omit<Worker, "id">) => void;
  updateWorker: (id: string, patch: Partial<Worker>) => void;
  removeWorker: (id: string) => void;

  // assignments
  addAssignment: (a: Omit<WorkerAssignment, "id">) => void;
  updateAssignment: (id: string, patch: Partial<WorkerAssignment>) => void;
  removeAssignment: (id: string) => void;

  // expenses
  addExpense: (e: Omit<Expense, "id">) => void;
  removeExpense: (id: string) => void;
}

export const useStore = create<Store>((set, get) => ({
  authed: false,
  user: { name: "Omar Al-Farsi", email: "owner@alco.ae", company: "ALCO Aluminum Works" },
  login: (email, password) => {
    if (email.trim().toLowerCase() === "owner@alco.ae" && password === "demo1234") {
      set({ authed: true });
      return true;
    }
    return false;
  },
  logout: () => set({ authed: false }),

  tenders: seedTenders,
  projects: seedProjects,
  purchases: allSeedPurchases,
  workers: seedWorkers,
  assignments: seedAssignments,
  expenses: [
    ...seedManualExpenses,
    ...demoRollingManual,
    // auto-derived expenses for purchases
    ...allSeedPurchases.map<Expense>(p => ({
      id: uid("exp"), projectId: p.projectId, category: "Materials" as ExpenseCategory,
      description: `Purchase · ${p.invoiceRef} · ${p.supplier}`,
      amount: p.quantity * p.rate, date: p.date, source: "purchase", refId: p.id,
    })),
    // auto labour expenses
    ...seedAssignments.map<Expense>(a => {
      const w = seedWorkers.find(w => w.id === a.workerId)!;
      return {
        id: uid("exp"), projectId: a.projectId, category: "Labour" as ExpenseCategory,
        description: `Labour · ${w.name} · ${a.days} days`,
        amount: a.days * w.dailyWage, date: a.startDate, source: "labour", refId: a.id,
      };
    }),
  ],

  createTender: (t) => {
    const id = uid("tnd");
    const num = String(get().tenders.length + 14).padStart(3, "0");
    const code = `T-2025-${num}`;
    set(s => ({ tenders: [{ id, code, createdAt: new Date().toISOString(), status: t.status ?? "Draft", ...t } as Tender, ...s.tenders] }));
    return id;
  },
  updateTender: (id, patch) =>
    set(s => ({ tenders: s.tenders.map(t => t.id === id ? { ...t, ...patch } : t) })),
  duplicateTender: (id) => {
    const t = get().tenders.find(x => x.id === id);
    if (!t) return;
    const newId = uid("tnd");
    const num = String(get().tenders.length + 14).padStart(3, "0");
    const dup: Tender = { ...t, id: newId, code: `T-2025-${num}`, status: "Draft",
      createdAt: new Date().toISOString(), convertedProjectId: undefined,
      title: t.title + " (copy)",
      materials: t.materials.map(m => ({ ...m, id: uid("m") })),
    };
    set(s => ({ tenders: [dup, ...s.tenders] }));
    return newId;
  },
  deleteTender: (id) =>
    set(s => ({ tenders: s.tenders.filter(t => t.id !== id) })),

  convertTenderToProject: (tenderId, contractValue, startDate, endDate) => {
    const t = get().tenders.find(x => x.id === tenderId);
    if (!t) return;
    const id = uid("prj");
    const num = String(get().projects.length + 6).padStart(3, "0");
    const code = `P-2025-${num}`;
    const proj: Project = {
      id, code, title: t.title, client: t.client, location: t.location,
      contractValue, status: "Active", progress: 0,
      startDate, endDate, tenderId,
      materials: t.materials.map(m => ({ ...m, id: uid("m") })),
    };
    set(s => ({
      projects: [proj, ...s.projects],
      tenders: s.tenders.map(x => x.id === tenderId ? { ...x, status: "Won", convertedProjectId: id } : x),
    }));
    return id;
  },

  updateProject: (id, patch) =>
    set(s => ({ projects: s.projects.map(p => p.id === id ? { ...p, ...patch } : p) })),
  addProjectMaterial: (projectId, m) =>
    set(s => ({ projects: s.projects.map(p =>
      p.id === projectId ? { ...p, materials: [...p.materials, { ...m, id: uid("m") }] } : p) })),
  updateProjectMaterial: (projectId, materialId, patch) =>
    set(s => ({ projects: s.projects.map(p =>
      p.id === projectId ? { ...p, materials: p.materials.map(x => x.id === materialId ? { ...x, ...patch } : x) } : p) })),
  removeProjectMaterial: (projectId, materialId) =>
    set(s => ({ projects: s.projects.map(p =>
      p.id === projectId ? { ...p, materials: p.materials.filter(x => x.id !== materialId) } : p) })),

  addPurchase: (p) => {
    const id = uid("pur");
    const newPurchase: Purchase = { ...p, id };
    set(s => ({
      purchases: [newPurchase, ...s.purchases],
      expenses: [{
        id: uid("exp"), projectId: p.projectId, category: "Materials",
        description: `Purchase · ${p.invoiceRef || "—"} · ${p.supplier}`,
        amount: p.quantity * p.rate, date: p.date, source: "purchase", refId: id,
      }, ...s.expenses],
    }));
  },
  removePurchase: (id) =>
    set(s => ({
      purchases: s.purchases.filter(p => p.id !== id),
      expenses: s.expenses.filter(e => e.refId !== id),
    })),

  addWorker: (w) => set(s => ({ workers: [{ ...w, id: uid("wkr") }, ...s.workers] })),
  updateWorker: (id, patch) =>
    set(s => ({ workers: s.workers.map(w => w.id === id ? { ...w, ...patch } : w) })),
  removeWorker: (id) =>
    set(s => ({ workers: s.workers.filter(w => w.id !== id) })),

  addAssignment: (a) => {
    const id = uid("wa");
    const w = get().workers.find(x => x.id === a.workerId);
    if (!w) return;
    set(s => ({
      assignments: [{ ...a, id }, ...s.assignments],
      expenses: [{
        id: uid("exp"), projectId: a.projectId, category: "Labour",
        description: `Labour · ${w.name} · ${a.days} days`,
        amount: a.days * w.dailyWage, date: a.startDate, source: "labour", refId: id,
      }, ...s.expenses],
    }));
  },
  updateAssignment: (id, patch) => {
    const a = get().assignments.find(x => x.id === id);
    if (!a) return;
    const updated = { ...a, ...patch };
    const w = get().workers.find(x => x.id === updated.workerId);
    set(s => ({
      assignments: s.assignments.map(x => x.id === id ? updated : x),
      expenses: s.expenses.map(e =>
        e.refId === id && w
          ? { ...e, amount: updated.days * w.dailyWage, description: `Labour · ${w.name} · ${updated.days} days`, date: updated.startDate }
          : e),
    }));
  },
  removeAssignment: (id) =>
    set(s => ({
      assignments: s.assignments.filter(a => a.id !== id),
      expenses: s.expenses.filter(e => e.refId !== id),
    })),

  addExpense: (e) => set(s => ({ expenses: [{ ...e, id: uid("exp"), source: "manual" }, ...s.expenses] })),
  removeExpense: (id) => set(s => ({ expenses: s.expenses.filter(e => e.id !== id) })),
}));

// ---------- DERIVED HELPERS ----------

export function materialPurchaseSummary(materialId: string, estimatedQty: number, purchases: Purchase[]) {
  const list = purchases.filter(p => p.materialId === materialId);
  const purchasedQty = list.reduce((s, p) => s + p.quantity, 0);
  const purchasedCost = list.reduce((s, p) => s + p.quantity * p.rate, 0);
  const remaining = Math.max(0, estimatedQty - purchasedQty);
  const progress = estimatedQty > 0 ? Math.min(100, (purchasedQty / estimatedQty) * 100) : 0;
  let status: MaterialStatus = "Pending";
  if (purchasedQty === 0) status = "Pending";
  else if (purchasedQty > estimatedQty) status = "Over-purchased";
  else if (purchasedQty >= estimatedQty) status = "Completed";
  else status = "Partial";
  return { purchases: list, purchasedQty, purchasedCost, remaining, progress, status };
}

export function projectFinancials(projectId: string) {
  const s = useStore.getState();
  const project = s.projects.find(p => p.id === projectId);
  if (!project) return null;
  const projectExpenses = s.expenses.filter(e => e.projectId === projectId);
  const materialCost = projectExpenses.filter(e => e.category === "Materials").reduce((a, e) => a + e.amount, 0);
  const labourCost   = projectExpenses.filter(e => e.category === "Labour").reduce((a, e) => a + e.amount, 0);
  const otherCost    = projectExpenses.filter(e => !["Materials", "Labour"].includes(e.category)).reduce((a, e) => a + e.amount, 0);
  const totalCost = materialCost + labourCost + otherCost;
  const profit = project.contractValue - totalCost;
  const margin = project.contractValue > 0 ? (profit / project.contractValue) * 100 : 0;
  return { project, materialCost, labourCost, otherCost, totalCost, profit, margin, projectExpenses };
}
