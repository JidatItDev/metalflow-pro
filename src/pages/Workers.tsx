import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fmtCurrency } from "@/lib/format";
import { Plus, Trash2, Phone } from "lucide-react";
import { toast } from "sonner";

export default function Workers() {
  const workers = useStore(s => s.workers);
  const assignments = useStore(s => s.assignments);
  const projects = useStore(s => s.projects);
  const addWorker = useStore(s => s.addWorker);
  const updateWorker = useStore(s => s.updateWorker);
  const removeWorker = useStore(s => s.removeWorker);

  const [dlg, setDlg] = useState(false);
  const [n, setN] = useState({ name: "", role: "", dailyWage: 0, phone: "", active: true });

  return (
    <>
      <PageHeader title="Workers" subtitle="Team and daily wages" actions={
        <Dialog open={dlg} onOpenChange={setDlg}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1.5" /> Add worker</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add worker</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5"><Label>Name</Label><Input value={n.name} onChange={e => setN({ ...n, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Role</Label><Input value={n.role} onChange={e => setN({ ...n, role: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Daily wage</Label><Input type="number" value={n.dailyWage} onChange={e => setN({ ...n, dailyWage: Number(e.target.value) })} /></div>
              <div className="col-span-2 space-y-1.5"><Label>Phone</Label><Input value={n.phone} onChange={e => setN({ ...n, phone: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDlg(false)}>Cancel</Button>
              <Button onClick={() => {
                if (!n.name) { toast.error("Name required"); return; }
                addWorker(n); setN({ name: "", role: "", dailyWage: 0, phone: "", active: true }); setDlg(false); toast.success("Worker added");
              }}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      } />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers.map(w => {
          const wAsg = assignments.filter(a => a.workerId === w.id);
          const days = wAsg.reduce((s, a) => s + a.days, 0);
          const totalCost = days * w.dailyWage;
          const projectCount = new Set(wAsg.map(a => a.projectId)).size;
          return (
            <div key={w.id} className="surface-card p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-accent-soft text-accent flex items-center justify-center text-card font-medium">
                  {w.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-card font-medium truncate">{w.name}</div>
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
    </>
  );
}
