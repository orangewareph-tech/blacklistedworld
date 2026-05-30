import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Turnstile } from "@/components/Turnstile";
import { RequireVerifiedEmail } from "@/components/RequireVerifiedEmail";
import { verifyTurnstile } from "@/lib/security.functions";
import { useServerFn } from "@tanstack/react-start";
import { Search, CheckCircle2 } from "lucide-react";


export const Route = createFileRoute("/pre-assessment")({
  head: () => ({
    meta: [
      { title: "Pre-Assessment Request — BlackListed" },
      { name: "description", content: "Check a person or entity before entering into a transaction. Reviewed by analysts." },
    ],
  }),
  component: Wrapper,
});

function Wrapper() {
  return (
    <RequireVerifiedEmail>
      <PreAssessmentPage />
    </RequireVerifiedEmail>
  );
}

function PreAssessmentPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<{ ticket: string } | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const verifyToken = useServerFn(verifyTurnstile);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setErr(null);
    if (!captchaToken) {
      setErr("Please complete the anti-bot check.");
      return;
    }
    setBusy(true);
    try {
      const v = await verifyToken({ data: { token: captchaToken } });
      if (!v.success) throw new Error("Anti-bot check failed. Please try again.");

      const fd = new FormData(e.currentTarget);
      const g = (k: string) => (fd.get(k)?.toString().trim() || null);
      const amountRaw = fd.get("amount_usd")?.toString();
      const payload = {
        submitter_id: user.id,
        status: "pending" as const,
        subject_name: g("subject_name")!,
        alias: g("alias"),
        country: g("country"),
        city: g("city"),
        phone: g("phone"),
        email: g("email"),
        website: g("website"),
        social: g("social"),
        transaction_type: g("transaction_type")!,
        industry: g("industry"),
        amount_usd: amountRaw ? Number(amountRaw) : null,
        description: g("description")!,
      };
      const { data, error } = await supabase
        .from("pre_assessments")
        .insert(payload)
        .select("id, ticket_number")
        .single();
      if (error) throw error;
      setDone({ ticket: data.ticket_number as string });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="text-xs text-muted-foreground hover:text-white">← Back</Link>
        <div className="bl-card p-8 md:p-10 mt-3">
          <h1 className="text-center text-2xl font-bold mb-1 inline-flex items-center justify-center gap-2 w-full"><Search className="w-5 h-5 text-white" strokeWidth={1.5} /> Pre-Assessment Request</h1>
          <p className="text-center text-muted-foreground mb-8 text-sm">
            Check a person or entity <strong className="text-foreground">before</strong> entering into a transaction.
          </p>

          {done ? (
            <div className="text-center p-6 bg-[rgba(46,125,50,0.15)] border border-[rgba(46,125,50,0.4)] rounded-lg text-[#a5d6a7]">
              <div className="inline-flex items-center gap-2 justify-center"><CheckCircle2 className="w-4 h-4" strokeWidth={1.75} /> <strong>Pre-assessment submitted.</strong></div>
              <div className="mt-3 text-foreground">

                Your ticket number:
                <div className="text-2xl font-mono font-bold mt-1 tracking-wider">{done.ticket}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Save this number — log in anytime to check status or answer follow-up questions.
              </p>
              <div className="mt-4 flex gap-2 justify-center">
                <Link to="/profile" className="bl-btn bl-btn-outline">My tickets</Link>
                <Link to="/" className="bl-btn bl-btn-outline">Back to home</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Subject Name / Company *"><input name="subject_name" className="bl-input" required maxLength={200} /></Field>
                <Field label="Alias / Nickname"><input name="alias" className="bl-input" maxLength={100} /></Field>
                <Field label="Country"><input name="country" className="bl-input" maxLength={80} /></Field>
                <Field label="City"><input name="city" className="bl-input" maxLength={80} /></Field>
                <Field label="Phone"><input name="phone" type="tel" className="bl-input" maxLength={30} /></Field>
                <Field label="Email"><input name="email" type="email" className="bl-input" maxLength={120} /></Field>
                <Field label="Website / Domain"><input name="website" className="bl-input" maxLength={120} /></Field>
                <Field label="Social Media"><input name="social" className="bl-input" maxLength={150} /></Field>
                <Field label="Transaction Type *">
                  <select name="transaction_type" className="bl-input" required defaultValue="">
                    <option value="" disabled>Select…</option>
                    <option>Investment</option><option>Loan</option><option>Real Estate</option>
                    <option>Trade / Commodity</option><option>Cryptocurrency</option>
                    <option>Service Contract</option><option>Online Purchase</option><option>Other</option>
                  </select>
                </Field>
                <Field label="Industry">
                  <input name="industry" className="bl-input" maxLength={80} />
                </Field>
                <Field label="Expected Amount (USD)"><input name="amount_usd" type="number" min={0} className="bl-input" /></Field>
              </div>
              <Field label="What do you need checked? *">
                <textarea name="description" className="bl-input min-h-[140px] resize-y" required maxLength={5000}
                  placeholder="Background, what's being offered, your concerns, links you'd like us to review." />
              </Field>
              <Turnstile onToken={setCaptchaToken} />
              {err && <p className="text-sm text-[var(--accent)]">{err}</p>}
              <button disabled={busy || !captchaToken} type="submit" className="bl-btn bl-btn-primary w-full py-3.5 text-base inline-flex items-center justify-center gap-2">
                {busy ? "Submitting…" : (<><Search className="w-4 h-4" strokeWidth={1.5} /> Submit Pre-Assessment</>)}
              </button>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-[#ccc]">{label}</label>
      {children}
    </div>
  );
}
