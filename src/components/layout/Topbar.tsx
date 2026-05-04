import { Bell, Plus, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const navigate = useNavigate();
  const user = useStore(s => s.user);
  const logout = useStore(s => s.logout);
  const tenders = useStore(s => s.tenders);
  const projects = useStore(s => s.projects);

  // notifications: over-purchases & projects without movement (heuristics)
  const purchases = useStore(s => s.purchases);
  const overCount = projects.reduce((acc, p) => {
    return acc + p.materials.filter(m => {
      const bought = purchases.filter(pp => pp.materialId === m.id).reduce((s, x) => s + x.quantity, 0);
      return bought > m.quantity;
    }).length;
  }, 0);
  const submittedCount = tenders.filter(t => t.status === "Submitted").length;

  return (
    <header className="h-16 sticky top-0 z-30 bg-background/85 backdrop-blur hairline-b">
      <div className="h-full px-4 lg:px-8 flex items-center justify-end gap-2 sm:gap-3">
        <Button size="sm" variant="outline" onClick={() => navigate("/tenders/new")}>
          <Plus className="w-4 h-4 mr-1.5" /> New Tender
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative w-9 h-9 rounded-md bg-white hairline flex items-center justify-center hover:bg-secondary">
              <Bell className="w-4 h-4 text-slate-500" />
              {(overCount + submittedCount) > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger ring-2 ring-background" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {overCount === 0 && submittedCount === 0 && (
              <div className="px-3 py-6 text-center text-label">All clear. Nothing new.</div>
            )}
            {overCount > 0 && (
              <DropdownMenuItem onClick={() => navigate("/projects")} className="flex flex-col items-start gap-0.5 cursor-pointer">
                <span className="text-body font-medium">{overCount} material{overCount > 1 ? "s" : ""} over-purchased</span>
                <span className="text-2xs text-muted-foreground">Open projects and reconcile purchases.</span>
              </DropdownMenuItem>
            )}
            {submittedCount > 0 && (
              <DropdownMenuItem onClick={() => navigate("/tenders")} className="flex flex-col items-start gap-0.5 cursor-pointer">
                <span className="text-body font-medium">{submittedCount} tender{submittedCount > 1 ? "s" : ""} awaiting response</span>
                <span className="text-2xs text-muted-foreground">Follow up with clients.</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-9 h-9 rounded-full bg-slate-900 text-white text-2xs font-medium flex items-center justify-center hover:opacity-90">
              {user.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-body font-medium">{user.name}</span>
              <span className="text-2xs text-muted-foreground">{user.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => { logout(); navigate("/login"); }} className="text-danger focus:text-danger">
              <LogOut className="w-4 h-4 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
