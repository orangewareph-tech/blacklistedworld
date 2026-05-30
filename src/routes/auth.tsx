import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — BlackListed" },
      { name: "description", content: "Sign in or create an account to submit due diligence reports." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-12">
      <div className="bl-card w-full max-w-md p-8">
        <Link to="/" className="text-xs text-muted-foreground hover:text-white">← Back</Link>
        <h1 className="text-2xl font-bold mt-3 mb-1">
          {mode === "signin" ? "Sign in to BlackListed" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {mode === "signin" ? "Access submissions, flagging and your report history." : "Free account. Required to submit reports."}
        </p>
        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "signup" && (
            <div>
              <label className="text-sm font-semibold text-[#ccc] block mb-1">Display name</label>
              <input
                className="bl-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={80}
                placeholder="Jane Doe"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-semibold text-[#ccc] block mb-1">Email</label>
            <input
              type="email"
              className="bl-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={200}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#ccc] block mb-1">Password</label>
            <input
              type="password"
              className="bl-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              maxLength={72}
            />
          </div>
          {err && <p className="text-sm text-[var(--accent)]">{err}</p>}
          <button type="submit" disabled={busy} className="bl-btn bl-btn-primary w-full py-3">
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="text-sm text-[var(--accent-glow)] mt-5 hover:underline w-full text-center"
        >
          {mode === "signin" ? "No account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
