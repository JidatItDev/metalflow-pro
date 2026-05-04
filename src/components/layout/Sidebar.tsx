import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, FileText, FolderKanban,
  Hammer, Receipt, BarChart3, Settings, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

export const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/tenders", label: "Tenders", icon: FileText },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  // Procurement: hidden from nav; route /procurement still available in App.tsx
  { to: "/labour", label: "Labour", icon: Hammer },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const user = useStore(s => s.user);
  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-sidebar text-sidebar-foreground h-screen sticky top-0">
      <div className="px-5 h-16 flex items-center gap-2.5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center">
          <Layers className="w-4 h-4 text-white" />
        </div>
        <div className="leading-tight">
          <div className="type-card text-white">ALCO</div>
          <div className="text-2xs text-steel-300">Aluminum Works</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => cn(
              "group flex items-center gap-2.5 px-3 h-9 rounded-md text-body transition-colors",
              isActive
                ? "bg-white text-slate-900 font-medium shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white",
            )}
          >
            {({ isActive }) => (
              <>
                <span className={cn(
                  "w-1 h-1 rounded-full",
                  isActive ? "bg-accent" : "bg-steel-300/40 group-hover:bg-steel-300",
                )} />
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-2xs font-medium">
            {user.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
          </div>
          <div className="flex-1 min-w-0 leading-tight">
            <div className="text-body text-white truncate">{user.name}</div>
            <div className="text-2xs text-steel-300 truncate">{user.email}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
