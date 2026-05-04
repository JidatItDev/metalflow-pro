import { Plus, LogOut } from "lucide-react";
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

  return (
    <header className="h-16 sticky top-0 z-30 bg-background/85 backdrop-blur hairline-b">
      <div className="h-full px-4 lg:px-8 flex items-center justify-end gap-2 sm:gap-3">
        <Button size="sm" variant="outline" onClick={() => navigate("/tenders/new")}>
          <Plus className="w-4 h-4 mr-1.5" /> New Tender
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-9 h-9 rounded-full bg-primary text-primary-foreground text-2xs font-medium flex items-center justify-center hover:opacity-90">
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
