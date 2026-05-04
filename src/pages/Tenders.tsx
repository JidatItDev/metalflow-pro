import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, statusVariantForTender } from "@/components/StatusBadge";
import { fmtCurrency, fmtDate } from "@/lib/format";
import { Plus, Search, Copy, Trash2, ArrowRight } from "lucide-react";
import {
  Tabs, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";

function tenderTotal(t: ReturnType<typeof useStore.getState>["tenders"][number]) {
  const materials = t.materials.reduce((s, m) => s + m.quantity * m.rate, 0);
  const subtotal = materials + t.labourEstimate + t.otherCosts;
  return subtotal * (1 + t.marginPct / 100);
}

export default function Tenders() {
  const navigate = useNavigate();
  const tenders = useStore(s => s.tenders);
  const duplicate = useStore(s => s.duplicateTender);
  const remove = useStore(s => s.deleteTender);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("All");

  const filtered = useMemo(() => {
    return tenders.filter(t => {
      const matchesQ = `${t.title} ${t.client} ${t.code} ${t.location}`.toLowerCase().includes(q.toLowerCase());
      const matchesTab = tab === "All" || t.status === tab;
      return matchesQ && matchesTab;
    });
  }, [tenders, q, tab]);

  return (
    <>
      <PageHeader
        title="Tenders"
        subtitle="Quotations and bids"
        actions={
          <Button onClick={() => navigate("/tenders/new")}>
            <Plus className="w-4 h-4 mr-1.5" /> New tender
          </Button>
        }
      />

      <div className="surface-card overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row md:items-center gap-3 hairline-b">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel-300" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by client, code or title…" className="pl-9 h-9" />
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-secondary h-9">
              {["All", "Draft", "Submitted", "Won", "Lost"].map(s => (
                <TabsTrigger key={s} value={s} className="text-2xs h-7 px-3 data-[state=active]:bg-white">{s}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-body">
            <thead>
              <tr className="text-label hairline-b">
                <th className="text-left font-normal px-4 py-3">Tender</th>
                <th className="text-left font-normal px-4 py-3">Client</th>
                <th className="text-left font-normal px-4 py-3">Status</th>
                <th className="text-right font-normal px-4 py-3">Quote</th>
                <th className="text-left font-normal px-4 py-3">Due</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="hairline-b last:border-0 hover:bg-secondary/60 cursor-pointer transition-colors"
                  onClick={() => navigate(`/tenders/${t.id}`)}
                >
                  <td className="px-4 py-3.5">
                    <div className="text-card font-medium">{t.title}</div>
                    <div className="text-2xs text-muted-foreground">{t.code}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-body">{t.client}</div>
                    <div className="text-2xs text-muted-foreground">{t.location}</div>
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge variant={statusVariantForTender(t.status)}>{t.status}</StatusBadge></td>
                  <td className="px-4 py-3.5 text-right tabular-nums font-medium">{fmtCurrency(tenderTotal(t))}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">{fmtDate(t.dueDate)}</td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                        const id = duplicate(t.id); if (id) { toast.success("Tender duplicated"); navigate(`/tenders/${id}`); }
                      }}><Copy className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-danger hover:text-danger"
                        onClick={() => { remove(t.id); toast.success("Tender deleted"); }}
                      ><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {filtered.map(t => (
            <button key={t.id} onClick={() => navigate(`/tenders/${t.id}`)} className="w-full text-left p-4 hover:bg-secondary/60">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="text-card font-medium truncate">{t.title}</div>
                  <div className="text-2xs text-muted-foreground">{t.code} · {t.client}</div>
                </div>
                <StatusBadge variant={statusVariantForTender(t.status)}>{t.status}</StatusBadge>
              </div>
              <div className="flex items-center justify-between text-2xs">
                <span className="text-muted-foreground">Due {fmtDate(t.dueDate)}</span>
                <span className="tabular-nums font-medium">{fmtCurrency(tenderTotal(t))}</span>
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-label">No tenders match your filters.</div>
        )}
      </div>
    </>
  );
}
