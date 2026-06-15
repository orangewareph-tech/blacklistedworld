import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, Lock, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { setupAdminAccount } from "@/lib/admin-setup.functions";

export const Route = createFileRoute("/admin/setup")({
  head: () => ({
    meta: [
      { title: "Admin Setup — BlackListed CMS" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminSetupPage,
});

function AdminSetupPage() {
  const navigate = useNavigate();
  const setup = useServerFn(setupAdminAccount);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      await setup({ data: { email: email.trim().toLowerCase(), password } });
      // Auto sign-in
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signErr) throw signErr;
      setDone(true);
      setTimeout(() => navigate({ to: "/admin" }), 1200);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Setup failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/admin/login" className="text-xs text-muted-foreground hover:text-white">← Back to admin sign-in</Link>
        <div className="bl-card p-8 mt-3">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-11 w-11 rounded-full bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/30">
              <ShieldCheck className="h-5 w-5 text-[var(--accent)]" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Setup</h1>
              <p className="text-xs text-muted-foreground">Bootstrap or reset the administrator password</p>
            </div>
          </div>

          {done ? (
            <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/40 rounded-md p-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5" strokeWidth={1.75} />
              <p className="text-xs text-emerald-300">
                Admin account ready. Redirecting to dashboard…
              </p>
            </div>
          ) : (
            <>
              {err && (
                <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/40 rounded-md p-3 mb-4">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5" strokeWidth={1.75} />
                  <p className="text-xs text-destructive">{err}</p>
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Authorized Email</span>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                    <input
                      type="email"
                      required
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bl-input pl-10 w-full"
                      placeholder="authorized email"
                    />
                  </div>
                  <span className="text-[0.65rem] text-muted-foreground mt-1 block">
                    Only the pre-authorized administrator email will be accepted.
                  </span>
                </label>

                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">New Password</span>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bl-input pl-10 w-full"
                      placeholder="At least 8 characters"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Confirm Password</span>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      minLength={8}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="bl-input pl-10 w-full"
                      placeholder="Repeat password"
                    />
                  </div>
                </label>

                <button disabled={busy} type="submit" className="bl-btn bl-btn-primary w-full">
                  {busy ? "Setting up…" : "Create / Reset Admin Password"}
                </button>
              </form>

              <p className="text-[0.65rem] text-muted-foreground mt-6 leading-relaxed">
                This endpoint is restricted to a single pre-authorized email. All other addresses are rejected.
                Use this once to bootstrap the admin account, or anytime to reset its password.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
