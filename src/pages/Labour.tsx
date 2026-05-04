import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmtCurrency, fmtDate } from "@/lib/format";
import { Plus, Trash2, Phone, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function Labour() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "team" ? "team" : "tracking";

  const setTab = (v: string) => {
    setSearchParams(v === "team" ? { tab: "team" } : {});
  };

  const assignments = useStore(s => s.assignments);
  const workers = useStore(s => s.workers);
  const projects = useStore(s => s.projects);
  const addAssignment = useStore(s => s.addAssignment);
  const addWorker = useStore(s => s.addWorker);
  const updateWorker = useStore(s => s.updateWorker);
  const removeWorker = useStore(s => s.removeWorker);

  const totalLabour = assignments.reduce((s, a) => {
    const w = workers.find(x => x.id === a.workerId);
    return s + (w ? w.dailyWage * a.days : 0);
  }, 0);

  const grouped = useMemo(() => projects.map(p => ({
    project: p,
    items: assignments.filter(a => a.projectId === p.id).map(a => {
      const w = workers.find(x => x.id === a.workerId)!;
      return { a, w };
    }).filter(x => x.w),
  })).filter(g => g.items.length > 0), [projects, assignments, workers]);

  /* Assign worker dialog */
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignProjectId, setAssignProjectId] = useState("");
  const [assignProjectLocked, setAssignProjectLocked] = useState(false);
  const [newAsg, setNewAsg] = useState({
    workerId: "",
    days: 1,
    startDate: new Date().toISOString().slice(0, 10),
  });

  const openAssign = (projectId?: string) => {
    if (projectId) {
      setAssignProjectId(projectId);
      setAssignProjectLocked(true);
    } else {
      setAssignProjectId("");
      setAssignProjectLocked(false);
    }
    setNewAsg({
      workerId: "",
      days: 1,
      startDate: new Date().toISOString().slice(0, 10),
    });
    setAssignOpen(true);
  };

  const submitAssignment = () => {
    if (!assignProjectId || !newAsg.workerId || newAsg.days <= 0) {
      toast.error("Project, worker and days are required");
      return;
    }
    addAssignment({
      projectId: assignProjectId,
      workerId: newAsg.workerId,
      days: newAsg.days,
      startDate: new Date(newAsg.startDate).toISOString(),
    });
    toast.success("Worker assigned");
    setAssignOpen(false);
    setAssignProjectLocked(false);
    setAssignProjectId("");
  };

  /* Add worker dialog (Team tab) */
  const [workerDlg, setWorkerDlg] = useState(false);
  const [n, setN] = useState({ name: "", role: "", dailyWage: 0, phone: "", active: true });

  return (
    <>
      <PageHeader
        title="Workforce"
        subtitle={
          tab === "tracking"
            ? `Tracking · total committed labour: ${fmtCurrency(totalLabour)}`
            : "Team and daily wages"
        }
        actions={
          <div className="flex flex-wrap items-center gap-2 justify-end">
            {tab === "tracking" && (
                <Button variant="outline" size="sm" onClick={() => openAssign()}>
                  <UserPlus className="w-4 h-4 mr-1.5" /> Assign to project
                </Button>
            )}
            {tab === "team" && (
              <Dialog open={workerDlg} onOpenChange={setWorkerDlg}>
                <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1.5" /> Add worker</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add worker</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1.5"><Label>Name</Label><Input value={n.name} onChange={e => setN({ ...n, name: e.target.value })} /></div>
                    <div className="space-y-1.5"><Label>Role</Label><Input value={n.role} onChange={e => setN({ ...n, role: e.target.value })} /></div>
                    <div className="space-y-1.5"><Label>Daily wage</Label><Input type="number" value={n.dailyWage} onChange={e => setN({ ...n, dailyWage: Number(e.target.value) })} /></div>
                    <div className="col-span-2 space-y-1.5"><Label>Phone</Label><Input value={n.phone} onChange={e => setN({ ...n, phone: e.target.value })} /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setWorkerDlg(false)}>Cancel</Button>
                    <Button onClick={() => {
                      if (!n.name) { toast.error("Name required"); return; }
                      addWorker(n); setN({ name: "", role: "", dailyWage: 0, phone: "", active: true }); setWorkerDlg(false); toast.success("Worker added");
                    }}>Add</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        }
      />

      <Dialog open={assignOpen} onOpenChange={(o) => {
        setAssignOpen(o);
        if (!o) { setAssignProjectLocked(false); setAssignProjectId(""); }
      }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign worker</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select
                value={assignProjectId || undefined}
                onValueChange={setAssignProjectId}
                disabled={assignProjectLocked}
              >
                <SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.title} · {p.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Worker</Label>
              <Select value={newAsg.workerId || undefined} onValueChange={v => setNewAsg({ ...newAsg, workerId: v })}>
                <SelectTrigger><SelectValue placeholder="Select a worker" /></SelectTrigger>
                <SelectContent>
                  {workers.filter(w => w.active).map(w => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} · {w.role} · {fmtCurrency(w.dailyWage)}/day
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Days</Label><Input type="number" value={newAsg.days} onChange={e => setNewAsg({ ...newAsg, days: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label>Start date</Label><Input type="date" value={newAsg.startDate} onChange={e => setNewAsg({ ...newAsg, startDate: e.target.value })} /></div>
            </div>
            {newAsg.workerId && assignProjectId && (
              <div className="surface-metric p-3 text-2xs">
                Total cost:{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {fmtCurrency((workers.find(w => w.id === newAsg.workerId)?.dailyWage ?? 0) * newAsg.days)}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={submitAssignment}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-secondary mb-5">
          <TabsTrigger value="tracking" className="data-[state=active]:bg-white">Tracking</TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-white">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="tracking" className="mt-0">
          <div className="space-y-4">
            {grouped.map(({ project, items }) => {
              const total = items.reduce((s, x) => s + x.w.dailyWage * x.a.days, 0);
              return (
                <div key={project.id} className="surface-card overflow-hidden">
                  <div className="hairline-b flex items-stretch">
                    <button type="button" onClick={() => navigate(`/projects/${project.id}`)}
                      className="flex-1 min-w-0 p-5 flex items-center justify-between hover:bg-secondary/60 text-left">
                      <div className="min-w-0">
                        <div className="type-card font-medium truncate">{project.title}</div>
                        <div className="text-2xs text-muted-foreground">{project.code} · {items.length} worker{items.length === 1 ? "" : "s"}</div>
                      </div>
                      <div className="type-card font-medium tabular-nums shrink-0 ml-3">{fmtCurrency(total)}</div>
                    </button>
                    <div className="flex items-center pr-3 shrink-0">
                      <Button type="button" variant="outline" size="sm" onClick={() => openAssign(project.id)}>
                        Assign
                      </Button>
                    </div>
                  </div>
                  <div className="divide-y divide-border">
                    {items.map(({ a, w }) => (
                      <div key={a.id} className="p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-accent-soft text-accent flex items-center justify-center text-2xs font-medium">
                          {w.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-body font-medium truncate">{w.name}</div>
                          <div className="text-2xs text-muted-foreground">{w.role} · started {fmtDate(a.startDate)}</div>
                        </div>
                        <div className="text-2xs text-muted-foreground">{a.days} days × {fmtCurrency(w.dailyWage)}</div>
                        <div className="w-28 text-right text-body font-medium tabular-nums">{fmtCurrency(w.dailyWage * a.days)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {grouped.length === 0 && <div className="surface-card py-16 text-center text-label">No labour assignments yet.</div>}
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map(w => {
              const wAsg = assignments.filter(a => a.workerId === w.id);
              const days = wAsg.reduce((s, a) => s + a.days, 0);
              const totalCost = days * w.dailyWage;
              const projectCount = new Set(wAsg.map(a => a.projectId)).size;
              return (
                <div key={w.id} className="surface-card p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-accent-soft text-accent flex items-center justify-center type-card font-medium">
                      {w.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="type-card font-medium truncate">{w.name}</div>
                      <div className="text-2xs text-muted-foreground">{w.role}</div>
                    </div>
                    <Switch checked={w.active} onCheckedChange={v => updateWorker(w.id, { active: v })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="surface-metric p-2.5"><div className="text-2xs text-muted-foreground">Daily wage</div><div className="text-body font-medium tabular-nums">{fmtCurrency(w.dailyWage)}</div></div>
                    <div className="surface-metric p-2.5"><div className="text-2xs text-muted-foreground">Total earned</div><div className="text-body font-medium tabular-nums">{fmtCurrency(totalCost)}</div></div>
                  </div>
                  <div className="flex items-center justify-between text-2xs">
                    <a href={`tel:${w.phone}`} className="flex items-center gap-1.5 text-accent hover:underline"><Phone className="w-3 h-3" /> {w.phone}</a>
                    <span className="text-muted-foreground">{projectCount} project{projectCount === 1 ? "" : "s"} · {days} days</span>
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-danger" onClick={() => { removeWorker(w.id); toast.success("Worker removed"); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
