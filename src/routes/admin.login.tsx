import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ShieldCheck, Lock, Mail, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Sign-in — BlackListed CMS" },
      { name: "description", content: "Restricted access. Admin authentication required." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && isAdmin) navigate({ to: "/admin" });
  }, [user, isAdmin, loading, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) throw new Error(error?.message ?? "Sign-in failed");

      // Verify admin role server-side via has_role()
      const { data: roleRow, error: roleErr } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleErr) throw roleErr;
      if (!roleRow) {
        await supabase.auth.signOut();
        throw new Error("Access denied. This account is not an administrator.");
      }
      navigate({ to: "/admin" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="text-xs text-muted-foreground hover:text-white">← Back to site</Link>
        <div className="bl-card p-8 mt-3">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-11 w-11 rounded-full bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/30">
              <ShieldCheck className="h-5 w-5 text-[var(--accent)]" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin CMS Access</h1>
              <p className="text-xs text-muted-foreground">Restricted — administrator credentials required</p>
            </div>
          </div>

          {err && (
            <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/40 rounded-md p-3 mb-4">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" strokeWidth={1.75} />
              <p className="text-xs text-destructive">{err}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Email</span>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bl-input pl-10 w-full"
                  placeholder="admin@example.com"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Password</span>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bl-input pl-10 w-full"
                  placeholder="••••••••"
                />
              </div>
            </label>

            <button disabled={busy} type="submit" className="bl-btn bl-btn-primary w-full">
              {busy ? "Verifying…" : "Sign in to CMS"}
            </button>
          </form>

          <p className="text-[0.65rem] text-muted-foreground mt-6 leading-relaxed">
            All access is logged. Non-admin accounts are rejected and signed out automatically.
            If you've forgotten your credentials, contact a fellow administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
