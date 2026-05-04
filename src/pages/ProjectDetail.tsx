import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStore, materialPurchaseSummary, projectFinancials } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, statusVariantForMaterial, statusVariantForProject } from "@/components/StatusBadge";
import { ProgressBar, variantForProgress } from "@/components/ProgressBar";
import { fmtCurrency, fmtDate } from "@/lib/format";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/MetricCard";
import { MaterialPurchaseDrawer } from "@/components/MaterialPurchaseDrawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ExpenseCategory, MaterialLine } from "@/lib/types";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const projects = useStore(s => s.projects);
  const purchases = useStore(s => s.purchases);
  const workers = useStore(s => s.workers);
  const assignments = useStore(s => s.assignments);
  const expenses = useStore(s => s.expenses);
  const updateProject = useStore(s => s.updateProject);
  const addAssignment = useStore(s => s.addAssignment);
  const removeAssignment = useStore(s => s.removeAssignment);
  const updateAssignment = useStore(s => s.updateAssignment);
  const addExpense = useStore(s => s.addExpense);
  const removeExpense = useStore(s => s.removeExpense);
  const addProjectMaterial = useStore(s => s.addProjectMaterial);
  const removeProjectMaterial = useStore(s => s.removeProjectMaterial);

  const project = projects.find(p => p.id === id);

  // Material drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeMaterial, setActiveMaterial] = useState<MaterialLine | null>(null);

  // Add material dialog
  const [matDlg, setMatDlg] = useState(false);
  const [newMat, setNewMat] = useState({ name: "", unit: "pcs", quantity: 0, rate: 0 });

  // Add assignment dialog
  const [asgDlg, setAsgDlg] = useState(false);
  const [newAsg, setNewAsg] = useState({ workerId: "", days: 1, startDate: new Date().toISOString().slice(0, 10) });

  // Add expense dialog
  const [expDlg, setExpDlg] = useState(false);
  const [newExp, setNewExp] = useState<{ category: ExpenseCategory; description: string; amount: number; date: string }>({
    category: "Transport", description: "", amount: 0, date: new Date().toISOString().slice(0, 10),
  });

  if (!project) return <div className="text-label">Project not found.</div>;

  const projectPurchases = purchases.filter(p => p.projectId === project.id);
  const projectAssignments = assignments.filter(a => a.projectId === project.id);
  const projectExpenses = expenses.filter(e => e.projectId === project.id);
  const fin = projectFinancials(project.id)!;

  return (
    <>
      <button onClick={() => navigate("/projects")} className="flex items-center gap-1.5 text-label hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to projects
      </button>

      <PageHeader
        title={project.title}
        subtitle={`${project.code} · ${project.client} · ${project.location}`}
        actions={
          <StatusBadge variant={statusVariantForProject(project.status)} className="px-3 py-1.5 text-body">{project.status}</StatusBadge>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Contract value" value={fmtCurrency(project.contractValue)} />
        <MetricCard label="Total spent" value={fmtCurrency(fin.totalCost)} hint={`${((fin.totalCost / Math.max(1, project.contractValue)) * 100).toFixed(0)}% of contract`} />
        <MetricCard label="Profit / loss" value={fmtCurrency(fin.profit)} trend={{ value: `${fin.margin.toFixed(1)}%`, positive: fin.profit >= 0 }} />
        <MetricCard label="Progress" value={`${project.progress}%`} hint={`Ends ${fmtDate(project.endDate)}`} />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-secondary mb-5">
          {["overview", "materials", "labour", "expenses", "profit"].map(k =>
            <TabsTrigger key={k} value={k} className="data-[state=active]:bg-white capitalize">
              {k === "profit" ? "Profitability" : k}
            </TabsTrigger>
          )}
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 surface-card p-5">
              <h2 className="text-section mb-4">Cost breakdown</h2>
              <CostBar project={fin} />

              <h2 className="text-section mt-6 mb-3">Recent activity</h2>
              <div className="space-y-2">
                {projectExpenses.slice(0, 6).map(e => (
                  <div key={e.id} className="flex items-center justify-between text-body p-2.5 rounded-md hover:bg-secondary">
                    <div className="min-w-0">
                      <div className="truncate">{e.description}</div>
                      <div className="text-2xs text-muted-foreground">{e.category} · {fmtDate(e.date)}</div>
                    </div>
                    <div className="tabular-nums font-medium">{fmtCurrency(e.amount)}</div>
                  </div>
                ))}
                {projectExpenses.length === 0 && <div className="text-label text-center py-6">No activity yet.</div>}
              </div>
            </div>

            <div className="surface-card p-5">
              <h2 className="text-section mb-4">Project</h2>
              <div className="space-y-3 text-body">
                <Row k="Client" v={project.client} />
                <Row k="Location" v={project.location} />
                <Row k="Start" v={fmtDate(project.startDate)} />
                <Row k="End" v={fmtDate(project.endDate)} />
                <div className="pt-3 hairline-t space-y-1.5">
                  <Label>Progress %</Label>
                  <Input type="number" value={project.progress}
                    onChange={e => updateProject(project.id, { progress: Math.max(0, Math.min(100, Number(e.target.value))) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={project.status} onValueChange={v => updateProject(project.id, { status: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Active", "On Hold", "Completed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* MATERIALS */}
        <TabsContent value="materials">
          <div className="surface-card overflow-hidden">
            <div className="p-5 hairline-b">
              <h2 className="text-section">Materials & procurement</h2>
              <p className="text-label mt-0.5">Tap a row to record purchases</p>
            </div>

            {/* Desktop list */}
            <div className="hidden md:block">
              <div className="grid grid-cols-12 gap-3 px-5 py-3 text-label hairline-b">
                <div className="col-span-4">Material</div>
                <div className="col-span-3">Procurement</div>
                <div className="col-span-2 text-right">Spent</div>
                <div className="col-span-2 text-right">Estimated</div>
                <div className="col-span-1 text-right">Status</div>
              </div>
              {project.materials.map(m => {
                const sm = materialPurchaseSummary(m.id, m.quantity, projectPurchases);
                return (
                  <motion.button key={m.id} layout onClick={() => { setActiveMaterial(m); setDrawerOpen(true); }}
                    className="w-full text-left grid grid-cols-12 gap-3 px-5 py-4 items-center hairline-b last:border-0 hover:bg-secondary/60 transition-colors"
                  >
                    <div className="col-span-4">
                      <div className="text-body font-medium truncate">{m.name}</div>
                      <div className="text-2xs text-muted-foreground">{m.quantity} {m.unit} estimated · remaining {sm.remaining} {m.unit}</div>
                    </div>
                    <div className="col-span-3">
                      <div className="flex items-center justify-between text-2xs mb-1.5">
                        <span className="text-muted-foreground tabular-nums">{sm.purchasedQty} / {m.quantity}</span>
                        <span className="font-medium">{sm.progress.toFixed(0)}%</span>
                      </div>
                      <ProgressBar value={sm.progress} variant={variantForProgress(sm.progress, sm.status)} />
                    </div>
                    <div className="col-span-2 text-right tabular-nums">{fmtCurrency(sm.purchasedCost)}</div>
                    <div className="col-span-2 text-right tabular-nums text-muted-foreground">{fmtCurrency(m.quantity * m.rate)}</div>
                    <div className="col-span-1 flex justify-end items-center gap-1">
                      <StatusBadge variant={statusVariantForMaterial(sm.status)} withDot={false}>{sm.status[0]}</StatusBadge>
                      <button onClick={(e) => { e.stopPropagation(); removeProjectMaterial(project.id, m.id); toast.success("Material removed"); }} className="text-steel-300 hover:text-danger ml-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.button>
                );
              })}
              {project.materials.length === 0 && <div className="py-12 text-center text-label">No materials yet.</div>}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border">
              {project.materials.map(m => {
                const sm = materialPurchaseSummary(m.id, m.quantity, projectPurchases);
                return (
                  <button key={m.id} onClick={() => { setActiveMaterial(m); setDrawerOpen(true); }} className="w-full text-left p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="text-body font-medium truncate">{m.name}</div>
                        <div className="text-2xs text-muted-foreground">{sm.purchasedQty}/{m.quantity} {m.unit} · remaining {sm.remaining}</div>
                      </div>
                      <StatusBadge variant={statusVariantForMaterial(sm.status)}>{sm.status}</StatusBadge>
                    </div>
                    <ProgressBar value={sm.progress} variant={variantForProgress(sm.progress, sm.status)} />
                    <div className="flex items-center justify-between text-2xs mt-2">
                      <span className="text-muted-foreground">Spent {fmtCurrency(sm.purchasedCost)}</span>
                      <span className="text-muted-foreground">Est. {fmtCurrency(m.quantity * m.rate)}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 md:px-5 md:py-4 flex justify-end hairline-t bg-secondary/30">
              <Button size="sm" variant="outline" onClick={() => setMatDlg(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add material
              </Button>
            </div>
          </div>

          <Dialog open={matDlg} onOpenChange={setMatDlg}>
            <DialogContent>
              <DialogHeader><DialogTitle>Add material</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5"><Label>Name</Label><Input value={newMat.name} onChange={e => setNewMat({ ...newMat, name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Unit</Label><Input value={newMat.unit} onChange={e => setNewMat({ ...newMat, unit: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Estimated qty</Label><Input type="number" value={newMat.quantity} onChange={e => setNewMat({ ...newMat, quantity: Number(e.target.value) })} /></div>
                <div className="col-span-2 space-y-1.5"><Label>Estimated rate</Label><Input type="number" value={newMat.rate} onChange={e => setNewMat({ ...newMat, rate: Number(e.target.value) })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMatDlg(false)}>Cancel</Button>
                <Button onClick={() => {
                  if (!newMat.name) { toast.error("Name required"); return; }
                  addProjectMaterial(project.id, newMat);
                  setNewMat({ name: "", unit: "pcs", quantity: 0, rate: 0 }); setMatDlg(false);
                  toast.success("Material added");
                }}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* LABOUR */}
        <TabsContent value="labour">
          <div className="surface-card overflow-hidden">
            <div className="p-5 hairline-b flex items-center justify-between">
              <div>
                <h2 className="text-section">Labour assignments</h2>
                <p className="text-label mt-0.5">Days × daily wage = labour cost</p>
              </div>
              <Dialog open={asgDlg} onOpenChange={setAsgDlg}>
                <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="w-3.5 h-3.5 mr-1" /> Assign worker</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Assign worker</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Worker</Label>
                      <Select value={newAsg.workerId} onValueChange={v => setNewAsg({ ...newAsg, workerId: v })}>
                        <SelectTrigger><SelectValue placeholder="Select a worker" /></SelectTrigger>
                        <SelectContent>
                          {workers.filter(w => w.active).map(w =>
                            <SelectItem key={w.id} value={w.id}>{w.name} · {w.role} · {fmtCurrency(w.dailyWage)}/day</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label>Days</Label><Input type="number" value={newAsg.days} onChange={e => setNewAsg({ ...newAsg, days: Number(e.target.value) })} /></div>
                      <div className="space-y-1.5"><Label>Start date</Label><Input type="date" value={newAsg.startDate} onChange={e => setNewAsg({ ...newAsg, startDate: e.target.value })} /></div>
                    </div>
                    {newAsg.workerId && (
                      <div className="surface-metric p-3 text-2xs">
                        Total cost: <span className="font-medium text-foreground tabular-nums">
                          {fmtCurrency((workers.find(w => w.id === newAsg.workerId)?.dailyWage ?? 0) * newAsg.days)}
                        </span>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAsgDlg(false)}>Cancel</Button>
                    <Button onClick={() => {
                      if (!newAsg.workerId || newAsg.days <= 0) { toast.error("Worker and days required"); return; }
                      addAssignment({ projectId: project.id, workerId: newAsg.workerId, days: newAsg.days, startDate: new Date(newAsg.startDate).toISOString() });
                      setNewAsg({ workerId: "", days: 1, startDate: new Date().toISOString().slice(0, 10) });
                      setAsgDlg(false); toast.success("Worker assigned");
                    }}>Assign</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {projectAssignments.length === 0 ? (
              <div className="py-12 text-center text-label">No workers assigned yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {projectAssignments.map(a => {
                  const w = workers.find(x => x.id === a.workerId);
                  if (!w) return null;
                  return (
                    <div key={a.id} className="p-4 flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-accent-soft text-accent flex items-center justify-center text-2xs font-medium shrink-0">
                        {w.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-body font-medium truncate">{w.name}</div>
                        <div className="text-2xs text-muted-foreground">{w.role} · {fmtCurrency(w.dailyWage)}/day · started {fmtDate(a.startDate)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input type="number" className="w-20 h-9 text-right" value={a.days}
                          onChange={e => updateAssignment(a.id, { days: Math.max(0, Number(e.target.value)) })} />
                        <span className="text-2xs text-muted-foreground">days</span>
                      </div>
                      <div className="text-body font-medium tabular-nums w-28 text-right">{fmtCurrency(w.dailyWage * a.days)}</div>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-danger"
                        onClick={() => { removeAssignment(a.id); toast.success("Assignment removed"); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* EXPENSES */}
        <TabsContent value="expenses">
          <div className="surface-card overflow-hidden">
            <div className="p-5 hairline-b flex items-center justify-between">
              <div>
                <h2 className="text-section">All expenses</h2>
                <p className="text-label mt-0.5">Auto-generated from purchases & labour, plus manual entries</p>
              </div>
              <Dialog open={expDlg} onOpenChange={setExpDlg}>
                <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="w-3.5 h-3.5 mr-1" /> Log expense</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Log manual expense</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Category</Label>
                      <Select value={newExp.category} onValueChange={v => setNewExp({ ...newExp, category: v as ExpenseCategory })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(["Transport", "Fuel", "Equipment", "Site", "Admin", "Misc"] as ExpenseCategory[]).map(c =>
                            <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label>Description</Label><Input value={newExp.description} onChange={e => setNewExp({ ...newExp, description: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label>Amount</Label><Input type="number" value={newExp.amount} onChange={e => setNewExp({ ...newExp, amount: Number(e.target.value) })} /></div>
                      <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={newExp.date} onChange={e => setNewExp({ ...newExp, date: e.target.value })} /></div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setExpDlg(false)}>Cancel</Button>
                    <Button onClick={() => {
                      if (!newExp.description || newExp.amount <= 0) { toast.error("Description and amount required"); return; }
                      addExpense({ projectId: project.id, category: newExp.category, description: newExp.description,
                        amount: newExp.amount, date: new Date(newExp.date).toISOString(), source: "manual" });
                      setNewExp({ category: "Transport", description: "", amount: 0, date: new Date().toISOString().slice(0, 10) });
                      setExpDlg(false); toast.success("Expense logged");
                    }}>Add</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="divide-y divide-border">
              {projectExpenses.map(e => (
                <div key={e.id} className="p-4 flex items-center gap-3">
                  <StatusBadge variant={
                    e.category === "Materials" ? "info" :
                    e.category === "Labour" ? "warning" : "neutral"
                  } withDot={false}>{e.category}</StatusBadge>
                  <div className="flex-1 min-w-0">
                    <div className="text-body truncate">{e.description}</div>
                    <div className="text-2xs text-muted-foreground">{fmtDate(e.date)} · {e.source}</div>
                  </div>
                  <div className="text-body font-medium tabular-nums">{fmtCurrency(e.amount)}</div>
                  {e.source === "manual" && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-danger" onClick={() => removeExpense(e.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              {projectExpenses.length === 0 && <div className="py-12 text-center text-label">No expenses yet.</div>}
            </div>
          </div>
        </TabsContent>

        {/* PROFITABILITY */}
        <TabsContent value="profit">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 surface-card p-5">
              <h2 className="text-section mb-4">Profit & loss</h2>
              <div className="space-y-3">
                <PnlRow label="Contract value (revenue)" value={fmtCurrency(project.contractValue)} />
                <PnlRow label="Materials" value={`− ${fmtCurrency(fin.materialCost)}`} muted />
                <PnlRow label="Labour" value={`− ${fmtCurrency(fin.labourCost)}`} muted />
                <PnlRow label="Other expenses" value={`− ${fmtCurrency(fin.otherCost)}`} muted />
                <div className="hairline-t pt-3 mt-3">
                  <PnlRow label="Total cost" value={`− ${fmtCurrency(fin.totalCost)}`} bold />
                </div>
                <div className="hairline-t pt-4">
                  <div className="flex items-end justify-between">
                    <span className="type-card">Profit / loss</span>
                    <span className={"text-metric " + (fin.profit >= 0 ? "text-success" : "text-danger")}>
                      {fin.profit >= 0 ? "+" : ""}{fmtCurrency(fin.profit)}
                    </span>
                  </div>
                  <div className="text-2xs text-muted-foreground mt-1 text-right">Margin {fin.margin.toFixed(1)}%</div>
                </div>
              </div>
            </div>

            <div className="surface-card p-5">
              <h2 className="text-section mb-4">Composition</h2>
              <CostBar project={fin} stacked />
              <div className="mt-4 space-y-2 text-2xs">
                <Legend color="bg-accent" label="Materials" value={fmtCurrency(fin.materialCost)} />
                <Legend color="bg-warning" label="Labour" value={fmtCurrency(fin.labourCost)} />
                <Legend color="bg-slate-500" label="Other" value={fmtCurrency(fin.otherCost)} />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <MaterialPurchaseDrawer project={project} material={activeMaterial} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-label">{k}</span>
      <span className="text-body">{v}</span>
    </div>
  );
}
function PnlRow({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-muted-foreground text-body" : "text-body"}>{label}</span>
      <span className={"tabular-nums " + (bold ? "font-medium" : "")}>{value}</span>
    </div>
  );
}
function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-sm ${color}`} />{label}</div>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
function CostBar({ project: f, stacked }: { project: ReturnType<typeof projectFinancials> & {} extends infer X ? any : any; stacked?: boolean }) {
  const total = Math.max(1, f.materialCost + f.labourCost + f.otherCost);
  const widths = {
    m: (f.materialCost / total) * 100,
    l: (f.labourCost / total) * 100,
    o: (f.otherCost / total) * 100,
  };
  return (
    <>
      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden flex">
        <motion.div initial={{ width: 0 }} animate={{ width: `${widths.m}%` }} transition={{ duration: 0.6 }} className="bg-accent" />
        <motion.div initial={{ width: 0 }} animate={{ width: `${widths.l}%` }} transition={{ duration: 0.6, delay: 0.1 }} className="bg-warning" />
        <motion.div initial={{ width: 0 }} animate={{ width: `${widths.o}%` }} transition={{ duration: 0.6, delay: 0.2 }} className="bg-slate-500" />
      </div>
      {!stacked && (
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="surface-metric p-3"><div className="text-2xs text-muted-foreground">Materials</div><div className="type-card font-medium tabular-nums mt-1">{fmtCurrency(f.materialCost)}</div></div>
          <div className="surface-metric p-3"><div className="text-2xs text-muted-foreground">Labour</div><div className="type-card font-medium tabular-nums mt-1">{fmtCurrency(f.labourCost)}</div></div>
          <div className="surface-metric p-3"><div className="text-2xs text-muted-foreground">Other</div><div className="type-card font-medium tabular-nums mt-1">{fmtCurrency(f.otherCost)}</div></div>
        </div>
      )}
    </>
  );
}
