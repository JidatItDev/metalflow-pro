import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const user = useStore(s => s.user);
  const logout = useStore(s => s.logout);

  return (
    <>
      <PageHeader title="Settings" subtitle="Workspace and account" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="surface-card p-5">
          <h2 className="text-section mb-4">Profile</h2>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Full name</Label><Input defaultValue={user.name} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input defaultValue={user.email} /></div>
            <div className="space-y-1.5"><Label>Company</Label><Input defaultValue={user.company} /></div>
          </div>
        </div>
        <div className="surface-card p-5">
          <h2 className="text-section mb-4">Preferences</h2>
          <div className="space-y-3 text-body">
            <Row k="Currency" v="QAR — Qatari Riyal" />
            <Row k="Date format" v="DD MMM YYYY" />
            <Row k="Timezone" v="Asia/Dubai (GMT+4)" />
            <Row k="Plan" v="Owner · Single seat" />
          </div>
        </div>
        <div className="surface-card p-5 lg:col-span-2">
          <h2 className="text-section mb-2">Demo build</h2>
          <p className="text-label mb-4">Data lives in memory and resets on reload. Persistent storage is the only missing piece.</p>
          <Button variant="outline" className="text-danger hover:text-danger"
            onClick={() => { logout(); navigate("/login"); }}>
            <LogOut className="w-4 h-4 mr-1.5" /> Sign out
          </Button>
        </div>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between hairline-b last:border-0 py-2">
      <span className="text-muted-foreground">{k}</span>
      <span>{v}</span>
    </div>
  );
}
