import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, FolderKanban, Receipt, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { navItems } from "./Sidebar";

const primary = [
  { to: "/", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/tenders", label: "Tenders", icon: FileText },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/expenses", label: "Expenses", icon: Receipt },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur hairline-t">
      <div className="flex items-stretch justify-around h-16 px-1 pb-[env(safe-area-inset-bottom)]">
        {primary.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className={({ isActive }) => cn(
              "flex-1 flex flex-col items-center justify-center gap-1 text-2xs",
              isActive ? "text-accent" : "text-slate-500",
            )}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex-1 flex flex-col items-center justify-center gap-1 text-2xs text-slate-500">
              <MoreHorizontal className="w-5 h-5" />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] p-0">
            <div className="px-5 h-16 flex items-center hairline-b">
              <div className="type-card">Menu</div>
            </div>
            <div className="p-2">
              {navItems.map(item => {
                const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
                return (
                  <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 h-10 px-3 rounded-md text-body",
                      active ? "bg-accent-soft text-accent font-medium" : "text-foreground hover:bg-secondary",
                    )}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
