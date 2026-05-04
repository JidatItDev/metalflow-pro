// Domain types for ALCO

export type TenderStatus = "Draft" | "Submitted" | "Won" | "Lost";
export type ProjectStatus = "Active" | "On Hold" | "Completed";
export type MaterialStatus = "Pending" | "Partial" | "Completed" | "Over-purchased";
export type ExpenseCategory = "Materials" | "Labour" | "Transport" | "Fuel" | "Equipment" | "Site" | "Admin" | "Misc";

export interface MaterialLine {
  id: string;
  name: string;
  unit: string;            // e.g. "m", "kg", "pcs", "sqm"
  quantity: number;        // estimated quantity
  rate: number;            // estimated rate per unit
}

export interface Purchase {
  id: string;
  materialId: string;
  projectId: string;
  supplier: string;
  quantity: number;
  rate: number;
  date: string;            // ISO
  invoiceRef: string;
}

export interface Tender {
  id: string;
  code: string;            // e.g. T-2025-001
  title: string;
  client: string;
  clientContact?: string;
  location: string;
  createdAt: string;
  dueDate: string;
  status: TenderStatus;
  materials: MaterialLine[];
  labourEstimate: number;
  otherCosts: number;
  marginPct: number;       // %
  notes?: string;
  convertedProjectId?: string;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  dailyWage: number;
  phone: string;
  active: boolean;
}

export interface WorkerAssignment {
  id: string;
  projectId: string;
  workerId: string;
  days: number;
  startDate: string;
  notes?: string;
}

export interface Expense {
  id: string;
  projectId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  source: "manual" | "purchase" | "labour";
  refId?: string;
}

export interface Project {
  id: string;
  code: string;
  title: string;
  client: string;
  location: string;
  contractValue: number;
  status: ProjectStatus;
  progress: number;         // 0-100 manual
  startDate: string;
  endDate: string;
  tenderId?: string;
  materials: MaterialLine[]; // estimates inherited
}
