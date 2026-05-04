import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layers, ArrowRight, ShieldCheck, BarChart3, Wrench } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const login = useStore(s => s.login);
  const [email, setEmail] = useState("owner@alco.ae");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const ok = login(email, password);
      if (ok) {
        toast.success("Welcome back, Omar");
        navigate("/", { replace: true });
      } else {
        toast.error("Invalid credentials");
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left: form */}
      <div className="flex flex-col justify-between p-8 lg:p-14">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
            <Layers className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="type-card text-foreground">ALCO</div>
            <div className="text-2xs text-muted-foreground">Aluminum Works · Operating Suite</div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="max-w-md w-full mx-auto py-10"
        >
          <h1 className="text-page mb-1.5">Sign in to your workspace</h1>
          <p className="text-label mb-8">Manage tenders, projects, procurement and labour from one place.</p>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-10" />
            </div>

            <Button type="submit" className="w-full h-10" disabled={loading}>
              {loading ? "Signing in…" : (<>Continue <ArrowRight className="w-4 h-4 ml-1.5" /></>)}
            </Button>
          </form>

          <div className="mt-6 surface-card p-4">
            <div className="text-2xs text-muted-foreground mb-1.5">Demo credentials</div>
            <div className="font-mono text-2xs text-foreground">owner@alco.ae · demo1234</div>
          </div>
        </motion.div>

        <div className="text-2xs text-muted-foreground">© 2025 ALCO Aluminum Works · Demo build</div>
      </div>

      {/* Right: marketing panel (light) */}
      <div className="hidden lg:flex relative bg-gradient-to-br from-accent-soft via-card to-secondary text-foreground p-14 flex-col justify-between overflow-hidden border-l border-border">
        <div className="absolute inset-0 opacity-[0.35]" style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border)) 0.5px, transparent 0.5px), linear-gradient(90deg, hsl(var(--border)) 0.5px, transparent 0.5px)",
          backgroundSize: "28px 28px",
        }} />
        <div className="relative">
          <div className="text-2xs uppercase tracking-wider text-muted-foreground">Operating suite for fabricators</div>
          <div className="text-page mt-3 max-w-sm leading-tight text-foreground">
            From quotation to profit — every project, fully accountable.
          </div>
        </div>

        <div className="relative grid grid-cols-1 gap-4 max-w-sm">
          {[
            { icon: BarChart3, title: "Live profitability", body: "Contract value vs material, labour and other costs — always current." },
            { icon: Wrench,    title: "Partial procurement", body: "Track every purchase. Know what's bought, pending and over-ordered." },
            { icon: ShieldCheck, title: "Built for owners", body: "No noise, no clock-in. Just the numbers and decisions that matter." },
          ].map((f, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.08 }}
              className="flex items-start gap-3 p-4 rounded-[10px] bg-card/90 border border-border shadow-sm"
            >
              <div className="w-8 h-8 rounded-md bg-accent-soft flex items-center justify-center shrink-0">
                <f.icon className="w-4 h-4 text-accent" />
              </div>
              <div>
                <div className="type-card text-foreground">{f.title}</div>
                <div className="text-2xs text-muted-foreground mt-0.5">{f.body}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
