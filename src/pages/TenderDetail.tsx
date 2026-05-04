import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStore } from "@/lib/store";
import { Tender, MaterialLine, TenderStatus } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { StatusBadge, statusVariantForTender } from "@/components/StatusBadge";
import { fmtCurrency, uid } from "@/lib/format";
import { Plus, Trash2, ArrowLeft, Copy, FileCheck, Save } from "lucide-react";
import { toast } from "sonner";

const NEW_TEMPLATE = (): Tender => ({
  id: "new",
  code: "(new)",
  title: "",
  client: "",
  clientContact: "",
  location: "",
  createdAt: new Date().toISOString(),
  dueDate: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
  status: "Draft",
  materials: [],
  labourEstimate: 0,
  otherCosts: 0,
  marginPct: 18,
  notes: "",
});

export default function TenderDetail() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  const tendersList = useStore(s => s.tenders);
  const create = useStore(s => s.createTender);
  const update = useStore(s => s.updateTender);
  const duplicate = useStore(s => s.duplicateTender);
  const convert = useStore(s => s.convertTenderToProject);

  const original = isNew ? NEW_TEMPLATE() : tendersList.find(t => t.id === id);
  const [draft, setDraft] = useState<Tender | undefined>(original);

  useEffect(() => { setDraft(original); /* eslint-disable-next-line */ }, [id]);

  // Convert dialog state
  const [convertOpen, setConvertOpen] = useState(false);
  const [contractValue, setContractValue] = useState(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10));

  const totals = useMemo(() => {
    if (!draft) return { materials: 0, subtotal: 0, margin: 0, quote: 0 };
    const materials = draft.materials.reduce((s, m) => s + m.quantity * m.rate, 0);
    const subtotal = materials + draft.labourEstimate + draft.otherCosts;
    const margin = subtotal * (draft.marginPct / 100);
    const quote = subtotal + margin;
    return { materials, subtotal, margin, quote };
  }, [draft]);

  if (!draft) return (
    <div className="text-label">Tender not found.</div>
  );

  const setField = <K extends keyof Tender>(k: K, v: Tender[K]) => setDraft({ ...draft, [k]: v });

  const addMaterial = () =>
    setDraft({ ...draft, materials: [...draft.materials, { id: uid("m"), name: "", unit: "pcs", quantity: 0, rate: 0 }] });
  const updateMaterial = (mid: string, patch: Partial<MaterialLine>) =>
    setDraft({ ...draft, materials: draft.materials.map(m => m.id === mid ? { ...m, ...patch } : m) });
  const removeMaterial = (mid: string) =>
    setDraft({ ...draft, materials: draft.materials.filter(m => m.id !== mid) });

  const save = () => {
    if (!draft.title || !draft.client) { toast.error("Title and client are required"); return; }
    if (isNew) {
      const newId = create({
        title: draft.title, client: draft.client, clientContact: draft.clientContact,
        location: draft.location, dueDate: draft.dueDate, materials: draft.materials,
        labourEstimate: draft.labourEstimate, otherCosts: draft.otherCosts,
        marginPct: draft.marginPct, notes: draft.notes, status: draft.status,
      });
      toast.success("Tender created");
      navigate(`/tenders/${newId}`, { replace: true });
    } else {
      update(draft.id, draft);
      toast.success("Tender saved");
    }
  };

  const handleConvert = () => {
    if (contractValue <= 0) { toast.error("Enter a contract value"); return; }
    const projId = convert(draft.id, contractValue, new Date(startDate).toISOString(), new Date(endDate).toISOString());
    if (projId) {
      toast.success("Tender converted to project");
      setConvertOpen(false);
      navigate(`/projects/${projId}`);
    }
  };

  return (
    <>
      <button onClick={() => navigate("/tenders")} className="flex items-center gap-1.5 text-label hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to tenders
      </button>

      <PageHeader
        title={isNew ? "New tender" : draft.title || "Untitled tender"}
        subtitle={isNew ? "Create a new quotation" : `${draft.code} · created ${new Date(draft.createdAt).toLocaleDateString()}`}
        actions={
          <>
            {!isNew && draft.status !== "Won" && (
              <Button variant="outline" onClick={() => {
                const nid = duplicate(draft.id); if (nid) { toast.success("Duplicated"); navigate(`/tenders/${nid}`); }
              }}>
                <Copy className="w-4 h-4 mr-1.5" /> Duplicate
              </Button>
            )}
            {!isNew && draft.status !== "Won" && (
              <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => setContractValue(Math.round(totals.quote))}>
                    <FileCheck className="w-4 h-4 mr-1.5" /> Convert to project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Convert to project</DialogTitle>
                    <DialogDescription>Enter the agreed contract value. Materials will be inherited as estimates.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Contract value (QAR)</Label>
                      <Input type="number" value={contractValue} onChange={e => setContractValue(Number(e.target.value))} />
                      <div className="text-2xs text-muted-foreground">Quoted: {fmtCurrency(totals.quote)}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Start date</Label>
                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>End date</Label>
                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setConvertOpen(false)}>Cancel</Button>
                    <Button onClick={handleConvert}>Create project</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Button onClick={save}><Save className="w-4 h-4 mr-1.5" /> Save</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Client + Project info */}
          <div className="surface-card p-5">
            <h2 className="text-section mb-4">Client & project</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Project title</Label>
                <Input value={draft.title} onChange={e => setField("title", e.target.value)} placeholder="e.g. Office Tower — Glazing" />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={draft.status} onValueChange={v => setField("status", v as TenderStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["Draft", "Submitted", "Won", "Lost"] as TenderStatus[]).map(s =>
                      <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Client</Label>
                <Input value={draft.client} onChange={e => setField("client", e.target.value)} placeholder="Client name" />
              </div>
              <div className="space-y-1.5">
                <Label>Contact</Label>
                <Input value={draft.clientContact ?? ""} onChange={e => setField("clientContact", e.target.value)} placeholder="Name · phone" />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={draft.location} onChange={e => setField("location", e.target.value)} placeholder="Site location" />
              </div>
              <div className="space-y-1.5">
                <Label>Due date</Label>
                <Input type="date" value={draft.dueDate.slice(0, 10)} onChange={e => setField("dueDate", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Materials */}
          <div className="surface-card overflow-hidden">
            <div className="p-5 hairline-b flex items-center justify-between">
              <div>
                <h2 className="text-section">Material estimation</h2>
                <p className="text-label mt-0.5">Quantities and unit rates</p>
              </div>
              <Button size="sm" variant="outline" onClick={addMaterial}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add row
              </Button>
            </div>
            {draft.materials.length === 0 ? (
              <div className="py-12 text-center text-label">No materials yet. Add your first row.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-body">
                  <thead>
                    <tr className="text-label hairline-b">
                      <th className="text-left font-normal px-4 py-2.5">Material</th>
                      <th className="text-left font-normal px-4 py-2.5 w-24">Unit</th>
                      <th className="text-right font-normal px-4 py-2.5 w-24">Qty</th>
                      <th className="text-right font-normal px-4 py-2.5 w-28">Rate</th>
                      <th className="text-right font-normal px-4 py-2.5 w-32">Total</th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.materials.map(m => (
                      <tr key={m.id} className="hairline-b last:border-0">
                        <td className="px-4 py-2">
                          <Input className="h-9" value={m.name} onChange={e => updateMaterial(m.id, { name: e.target.value })} placeholder="Material name" />
                        </td>
                        <td className="px-4 py-2">
                          <Input className="h-9" value={m.unit} onChange={e => updateMaterial(m.id, { unit: e.target.value })} />
                        </td>
                        <td className="px-4 py-2">
                          <Input type="number" className="h-9 text-right" value={m.quantity} onChange={e => updateMaterial(m.id, { quantity: Number(e.target.value) })} />
                        </td>
                        <td className="px-4 py-2">
                          <Input type="number" className="h-9 text-right" value={m.rate} onChange={e => updateMaterial(m.id, { rate: Number(e.target.value) })} />
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums font-medium">{fmtCurrency(m.quantity * m.rate)}</td>
                        <td className="px-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-danger" onClick={() => removeMaterial(m.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="surface-card p-5">
            <h2 className="text-section mb-3">Notes</h2>
            <Textarea rows={4} value={draft.notes ?? ""} onChange={e => setField("notes", e.target.value)} placeholder="Internal notes, scope reminders, conditions…" />
          </div>
        </div>

        {/* Pricing summary (sticky) */}
        <div className="lg:col-span-1">
          <div className="surface-card p-5 sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-section">Pricing summary</h2>
              <StatusBadge variant={statusVariantForTender(draft.status)}>{draft.status}</StatusBadge>
            </div>

            <div className="space-y-3 mb-4">
              <Row label="Materials" value={fmtCurrency(totals.materials)} />
              <div className="space-y-1.5">
                <Label>Labour estimate</Label>
                <Input type="number" value={draft.labourEstimate} onChange={e => setField("labourEstimate", Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>Other costs</Label>
                <Input type="number" value={draft.otherCosts} onChange={e => setField("otherCosts", Number(e.target.value))} />
              </div>
            </div>

            <div className="hairline-t pt-4 mb-4">
              <Row label="Subtotal" value={fmtCurrency(totals.subtotal)} />
            </div>

            <div className="space-y-1.5 mb-4">
              <Label>Margin %</Label>
              <Input type="number" value={draft.marginPct} onChange={e => setField("marginPct", Number(e.target.value))} />
              <div className="text-2xs text-muted-foreground">{fmtCurrency(totals.margin)}</div>
            </div>

            <div className="hairline-t pt-4">
              <div className="flex items-end justify-between">
                <span className="text-label">Final quote</span>
                <span className="text-metric">{fmtCurrency(totals.quote)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-label">{label}</span>
      <span className="text-body tabular-nums font-medium">{value}</span>
    </div>
  );
}
