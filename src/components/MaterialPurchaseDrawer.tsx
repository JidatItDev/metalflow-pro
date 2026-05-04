import { useMemo, useState } from "react";
import { useStore, materialPurchaseSummary } from "@/lib/store";
import { Project, MaterialLine } from "@/lib/types";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressBar, variantForProgress } from "@/components/ProgressBar";
import { StatusBadge, statusVariantForMaterial } from "@/components/StatusBadge";
import { fmtCurrency, fmtDate } from "@/lib/format";
import { Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export function MaterialPurchaseDrawer({
  project, material, open, onOpenChange,
}: {
  project: Project; material: MaterialLine | null; open: boolean; onOpenChange: (b: boolean) => void;
}) {
  const purchases = useStore(s => s.purchases);
  const addPurchase = useStore(s => s.addPurchase);
  const removePurchase = useStore(s => s.removePurchase);

  const [supplier, setSupplier] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [invoiceRef, setInvoiceRef] = useState("");

  const summary = useMemo(() => material ? materialPurchaseSummary(material.id, material.quantity, purchases) : null, [material, purchases]);

  if (!material || !summary) return null;

  const submit = () => {
    if (!supplier || quantity <= 0 || rate <= 0) { toast.error("Supplier, quantity and rate are required"); return; }
    addPurchase({
      materialId: material.id, projectId: project.id, supplier, quantity, rate,
      date: new Date(date).toISOString(), invoiceRef,
    });
    toast.success("Purchase recorded");
    setSupplier(""); setQuantity(0); setRate(0); setInvoiceRef("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 overflow-y-auto">
        <SheetHeader className="p-6 hairline-b">
          <SheetTitle className="text-section">{material.name}</SheetTitle>
          <SheetDescription>{project.title} · {project.code}</SheetDescription>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* Status block */}
          <div className="surface-metric p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-label">Procurement progress</span>
              <StatusBadge variant={statusVariantForMaterial(summary.status)}>{summary.status}</StatusBadge>
            </div>
            <div className="text-metric mb-2 tabular-nums">
              {summary.purchasedQty.toLocaleString()} / {material.quantity.toLocaleString()} {material.unit}
            </div>
            <ProgressBar value={summary.progress} variant={variantForProgress(summary.progress, summary.status)} />
            <div className="grid grid-cols-3 gap-2 mt-4 text-2xs">
              <div><div className="text-muted-foreground">Remaining</div><div className="font-medium tabular-nums">{summary.remaining.toLocaleString()} {material.unit}</div></div>
              <div><div className="text-muted-foreground">Spent</div><div className="font-medium tabular-nums">{fmtCurrency(summary.purchasedCost)}</div></div>
              <div><div className="text-muted-foreground">Estimated</div><div className="font-medium tabular-nums">{fmtCurrency(material.quantity * material.rate)}</div></div>
            </div>
          </div>

          {/* New purchase */}
          <div>
            <h3 className="text-card mb-3">Record new purchase</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5"><Label>Supplier</Label><Input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Supplier name" /></div>
              <div className="space-y-1.5"><Label>Quantity ({material.unit})</Label><Input type="number" value={quantity || ""} onChange={e => setQuantity(Number(e.target.value))} /></div>
              <div className="space-y-1.5"><Label>Rate (AED)</Label><Input type="number" value={rate || ""} onChange={e => setRate(Number(e.target.value))} /></div>
              <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Invoice #</Label><Input value={invoiceRef} onChange={e => setInvoiceRef(e.target.value)} placeholder="e.g. INV-1023" /></div>
              <div className="col-span-2 flex items-center justify-between pt-2">
                <div className="text-2xs text-muted-foreground">Total: <span className="font-medium text-foreground tabular-nums">{fmtCurrency(quantity * rate)}</span></div>
                <Button onClick={submit}><Plus className="w-4 h-4 mr-1.5" /> Add purchase</Button>
              </div>
            </div>
          </div>

          {/* History */}
          <div>
            <h3 className="text-card mb-3">Purchase history ({summary.purchases.length})</h3>
            {summary.purchases.length === 0 ? (
              <div className="text-label py-8 text-center surface-metric">No purchases yet.</div>
            ) : (
              <div className="space-y-2">
                {summary.purchases.map(p => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-start justify-between gap-3 p-3 rounded-md hairline">
                    <div className="min-w-0">
                      <div className="text-body font-medium truncate">{p.supplier}</div>
                      <div className="text-2xs text-muted-foreground">
                        {p.quantity} {material.unit} × {fmtCurrency(p.rate)} · {fmtDate(p.date)} · {p.invoiceRef || "—"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-body font-medium tabular-nums">{fmtCurrency(p.quantity * p.rate)}</div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-danger"
                        onClick={() => { removePurchase(p.id); toast.success("Purchase removed"); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
