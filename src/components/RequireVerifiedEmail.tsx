import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function RequireVerifiedEmail({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (loading) return null;
  if (!user) return <>{children}</>; // upstream guard handles unauthenticated

  // email_confirmed_at is present on the supabase User when verified
  const confirmed = !!user.email_confirmed_at;
  if (confirmed) return <>{children}</>;

  const resend = async () => {
    if (!user.email) return;
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setBusy(false);
    if (error) setErr(error.message);
    else setSent(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="bl-card max-w-md w-full p-8 text-center">
        <h1 className="text-xl font-bold mb-2">Verify your email first</h1>
        <p className="text-sm text-muted-foreground mb-4">
          We sent a confirmation link to <strong>{user.email}</strong>. Click it
          to unlock report and pre-assessment submissions.
        </p>
        <p className="text-xs text-muted-foreground mb-6">
          This step prevents fake submissions and protects the platform from
          abuse.
        </p>
        {sent ? (
          <p className="text-sm text-emerald-400">
            New confirmation email sent. Check your inbox (and spam folder).
          </p>
        ) : (
          <button
            onClick={resend}
            disabled={busy}
            className="bl-btn bl-btn-primary w-full py-3"
          >
            {busy ? "Sending…" : "Resend confirmation email"}
          </button>
        )}
        {err && <p className="text-sm text-[var(--accent)] mt-3">{err}</p>}
        <p className="text-xs text-muted-foreground mt-4">
          Already verified? Sign out and sign back in to refresh your session.
        </p>
      </div>
    </div>
  );
}
