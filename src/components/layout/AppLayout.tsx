import { Outlet, useLocation, Navigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";

export function AppLayout() {
  const authed = useStore(s => s.authed);
  const location = useLocation();
  if (!authed) return <Navigate to="/login" replace />;

  /* `location.key` is unique per history entry. Avoid AnimatePresence mode="wait"
     around `<Outlet />` — it can block the next page from mounting after exit. */
  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 px-4 lg:px-8 py-6 pb-24 lg:pb-10 max-w-[1400px] w-full mx-auto">
          <motion.div
            key={location.pathname + location.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
