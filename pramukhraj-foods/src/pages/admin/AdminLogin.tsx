import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Mail, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { adminUsers, DEMO_PASSWORD } from "@/mock/adminUsers";
import { getRole } from "@/mock/roles";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore(s => s.login);
  const loginError = useAuthStore(s => s.loginError);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();

  if (isAuthenticated) {
    const from = (location.state as { from?: string })?.from ?? "/admin";
    return <Navigate to={from} replace />;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    debugger
    if (await login(email, password)) {
      const from = (location.state as { from?: string })?.from ?? "/admin";
      navigate(from, { replace: true });
    }
  }

  function quickFill(demoEmail: string) {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
  }

  return (
    <div className="flex min-h-screen bg-teal-deep text-ivory">
      <div className="hidden w-1/2 flex-col justify-between bg-teal p-12 lg:flex">
        <Logo className="text-ivory" />
        <div>
          <h1 className="font-display text-4xl leading-tight">
            Commerce Console
          </h1>
          <p className="mt-4 max-w-md text-sm text-ivory/70">
            Manage products, orders, content and access for PramukhRaj Foods
            from a single, role-aware admin workspace.
          </p>
        </div>
        <p className="text-xs text-ivory/50">
          © 2026 PramukhRaj Foods Pvt. Ltd. Internal use only.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo className="text-ivory" />
          </div>
          <div className="rounded-card border border-ivory/10 bg-ivory/[0.04] p-6 backdrop-blur">
            <div className="mb-1 flex items-center gap-2">
              <ShieldCheck size={18} className="text-turmeric" />
              <h2 className="font-display text-xl">Admin Sign In</h2>
            </div>
            <p className="mb-6 text-sm text-ivory/60">
              Role-based access — only registered admins may enter.
            </p>

            <form onSubmit={submit} className="space-y-4">
              <label className="block">
                <span className="mb-1 flex items-center gap-1.5 text-xs text-ivory/60">
                  <Mail size={13} /> Email
                </span>
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  type="text"
                  required
                  placeholder="user1234"
                  className="w-full rounded-lg border border-ivory/15 bg-ivory/5 px-3 py-2 text-sm text-ivory outline-none placeholder:text-ivory/30 focus:border-turmeric/60"
                />
              </label>
              <label className="block">
                <span className="mb-1 flex items-center gap-1.5 text-xs text-ivory/60">
                  <Lock size={13} /> Password
                </span>
                <div className="relative">
                  <input
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-ivory/15 bg-ivory/5 px-3 py-2 pr-9 text-sm text-ivory outline-none placeholder:text-ivory/30 focus:border-turmeric/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory/50"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </label>

              {loginError && (
                <p className="rounded-lg bg-oxblood/20 px-3 py-2 text-xs text-oxblood-deep text-oxblood">
                  {loginError}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full">
                Sign In
              </Button>
            </form>

            <div className="mt-6 border-t border-ivory/10 pt-5">
              <p className="mb-2 text-xs uppercase tracking-wide text-ivory/40">
                Try a demo role
              </p>
              <div className="flex flex-wrap gap-2">
                {adminUsers
                  .filter(u => !u.IsDeleted)
                  .map(u => (
                    <button
                      key={u.UserId}
                      type="button"
                      onClick={() => quickFill(u.Username)}
                      className="rounded-full bg-ivory/10 px-3 py-1.5 text-xs hover:bg-ivory/20"
                    >
                      {getRole(u.Role)?.name}
                    </button>
                  ))}
              </div>
              <p className="mt-3 text-[11px] text-ivory/40">
                Demo password for every account:{" "}
                <span className="font-mono text-ivory/60">{DEMO_PASSWORD}</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
