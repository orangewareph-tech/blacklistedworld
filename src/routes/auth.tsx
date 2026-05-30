import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Turnstile } from "@/components/Turnstile";
import { verifyTurnstile, recordAuthFailure } from "@/lib/security.functions";
import { useServerFn } from "@tanstack/react-start";


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
  const [username, setUsername] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [signedUp, setSignedUp] = useState(false);
  const verifyToken = useServerFn(verifyTurnstile);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!captchaToken) {
      setErr("Please complete the anti-bot check.");
      return;
    }
    setBusy(true);
    try {
      const v = await verifyToken({ data: { token: captchaToken } });
      if (!v.success) throw new Error("Anti-bot check failed. Please try again.");

      if (mode === "signup") {
        const uname = username.trim().toLowerCase();
        if (!/^[a-z0-9_]{3,24}$/.test(uname)) {
          throw new Error("Username must be 3–24 characters: lowercase letters, numbers, underscore.");
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              display_name: displayName || uname,
              username: uname,
            },
          },
        });
        if (error) throw error;
        setSignedUp(true);
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

  if (signedUp) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="bl-card max-w-md w-full p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Check your email</h1>
          <p className="text-sm text-muted-foreground mb-4">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            You must verify your email before you can submit reports or pre-assessment requests.
          </p>
          <Link to="/" className="bl-btn bl-btn-outline">Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-12">
      <div className="bl-card w-full max-w-md p-8">
        <Link to="/" className="text-xs text-muted-foreground hover:text-white">← Back</Link>
        <h1 className="text-2xl font-bold mt-3 mb-1">
          {mode === "signin" ? "Sign in to BlackListed" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {mode === "signin"
            ? "Access submissions, flagging and your report history."
            : "Free account. Required to submit reports. Email verification + anti-bot check apply."}
        </p>

        <div className="space-y-2 mb-5">
          <button
            type="button"
            onClick={async () => {
              setErr(null);
              const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
              if (r.error) setErr(r.error.message ?? "Google sign-in failed");
            }}
            className="bl-btn w-full py-3 bg-white text-black hover:bg-white/90 flex items-center justify-center gap-2 rounded-md font-semibold"
          >
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 39.6 16.3 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.6l6.2 5.2C41.4 35.5 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
            Continue with Google
          </button>
          <button
            type="button"
            onClick={async () => {
              setErr(null);
              const r = await lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin });
              if (r.error) setErr(r.error.message ?? "Apple sign-in failed");
            }}
            className="bl-btn w-full py-3 bg-black text-white border border-white/20 hover:bg-zinc-900 flex items-center justify-center gap-2 rounded-md font-semibold"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            Continue with Apple
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-muted-foreground">or with email</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "signup" && (
            <>
              <div>
                <label className="text-sm font-semibold text-[#ccc] block mb-1">Username</label>
                <input
                  className="bl-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  maxLength={24}
                  placeholder="jane_doe"
                  pattern="[a-zA-Z0-9_]+"
                />
                <p className="text-xs text-muted-foreground mt-1">3–24 chars: letters, numbers, underscore.</p>
              </div>
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
            </>
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

          <Turnstile onToken={setCaptchaToken} />

          {err && <p className="text-sm text-[var(--accent)]">{err}</p>}
          <button type="submit" disabled={busy || !captchaToken} className="bl-btn bl-btn-primary w-full py-3">
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(null); }}
          className="text-sm text-[var(--accent-glow)] mt-5 hover:underline w-full text-center"
        >
          {mode === "signin" ? "No account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
