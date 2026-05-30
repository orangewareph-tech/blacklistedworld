import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { recordAuthFailure } from "@/lib/security.functions";
import { useServerFn } from "@tanstack/react-start";


export const Route = createFileRoute("/verify-phone")({
  head: () => ({
    meta: [
      { title: "Verify Phone — BlackListed" },
      { name: "description", content: "Verify your mobile number via SMS one-time code." },
    ],
  }),
  component: VerifyPhonePage,
});

function VerifyPhonePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code" | "done">("phone");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const sendCode = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null); setBusy(true);
    try {
      const normalized = phone.trim().replace(/\s+/g, "");
      if (!/^\+[1-9]\d{6,14}$/.test(normalized)) {
        throw new Error("Enter your phone in international format, e.g. +14155551234");
      }
      const { error } = await supabase.auth.updateUser({ phone: normalized });
      if (error) throw error;
      setStep("code");
      setMsg("Code sent. Check your SMS.");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to send code");
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null); setBusy(true);
    try {
      const normalized = phone.trim().replace(/\s+/g, "");
      const { error } = await supabase.auth.verifyOtp({
        phone: normalized,
        token: code.trim(),
        type: "phone_change",
      });
      if (error) throw error;
      if (user) {
        await supabase
          .from("profiles")
          .update({ phone: normalized, phone_verified_at: new Date().toISOString() })
          .eq("id", user.id);
      }
      setStep("done");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Invalid or expired code");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-12">
      <div className="bl-card w-full max-w-md p-8">
        <Link to="/profile" className="text-xs text-muted-foreground hover:text-white">← Back to profile</Link>
        <h1 className="text-2xl font-bold mt-3 mb-1">Verify your phone</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Optional extra anti-bot layer. We'll send a one-time SMS code.
        </p>

        {step === "phone" && (
          <form onSubmit={sendCode} className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-[#ccc] block mb-1">Mobile number</label>
              <input
                type="tel"
                className="bl-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+14155551234"
                required
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground mt-1">International format with country code.</p>
            </div>
            {err && <p className="text-sm text-[var(--accent)]">{err}</p>}
            <button disabled={busy} className="bl-btn bl-btn-primary w-full py-3">
              {busy ? "Sending…" : "Send SMS code"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={verifyCode} className="space-y-3">
            <p className="text-sm text-muted-foreground">Code sent to <strong>{phone}</strong></p>
            <div>
              <label className="text-sm font-semibold text-[#ccc] block mb-1">6-digit code</label>
              <input
                inputMode="numeric"
                className="bl-input tracking-widest text-center text-lg"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                maxLength={6}
                pattern="[0-9]{6}"
              />
            </div>
            {msg && <p className="text-sm text-emerald-400">{msg}</p>}
            {err && <p className="text-sm text-[var(--accent)]">{err}</p>}
            <button disabled={busy} className="bl-btn bl-btn-primary w-full py-3">
              {busy ? "Verifying…" : "Verify code"}
            </button>
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="text-xs text-muted-foreground hover:text-white w-full text-center"
            >
              Use a different number
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="text-center p-6 bg-[rgba(46,125,50,0.15)] border border-[rgba(46,125,50,0.4)] rounded-lg text-[#a5d6a7]">
            ✅ <strong>Phone verified.</strong>
            <div className="mt-4">
              <Link to="/profile" className="bl-btn bl-btn-outline">Back to profile</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
