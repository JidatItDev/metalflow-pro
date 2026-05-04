import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, FileText, FolderKanban,
  Hammer, Receipt, BarChart3, Settings,
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
    <aside
      className={cn(
        "hidden lg:flex flex-col w-[248px] shrink-0 bg-sidebar text-sidebar-foreground h-screen sticky top-0 hairline-r",
      )}
    >
      <div className="px-4 h-16 flex items-center gap-3 hairline-b bg-sidebar-primary/60 backdrop-blur-[2px]">
        <div className="w-9 h-9 rounded-lg bg-sidebar-primary shadow-sm ring-1 ring-sidebar-border/70 flex items-center justify-center">
          <img src="/logo.png" alt="" className="w-7 h-7 rounded-md object-contain" width={28} height={28} />
        </div>
        <div className="leading-tight min-w-0">
          <div className="type-card text-sidebar-foreground tracking-tight">Everest</div>
          <div className="text-2xs text-muted-foreground">Operating suite</div>
        </div>
      </div>

      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
        <p className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
          Navigate
        </p>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => cn(
              "group relative flex items-center gap-2.5 pl-3 pr-2.5 h-9 rounded-lg text-body transition-colors",
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm ring-1 ring-sidebar-border/90"
                : "text-sidebar-foreground hover:bg-sidebar-accent/90 hover:text-sidebar-accent-foreground",
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-accent"
                    aria-hidden
                  />
                )}
                <item.icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    isActive ? "text-accent" : "text-muted-foreground/80 group-hover:text-sidebar-foreground",
                  )}
                />
                <span className="truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-2.5 hairline-t">
        <div className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl bg-sidebar-accent/35 ring-1 ring-sidebar-border/50 hover:bg-sidebar-accent/55 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xs font-medium">
            {user.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
          </div>
          <div className="flex-1 min-w-0 leading-tight">
            <div className="text-body text-sidebar-foreground truncate">{user.name}</div>
            <div className="text-2xs text-muted-foreground truncate">{user.email}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
