import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Turnstile } from "@/components/Turnstile";
import { RequireVerifiedEmail } from "@/components/RequireVerifiedEmail";
import { verifyTurnstile } from "@/lib/security.functions";
import { useServerFn } from "@tanstack/react-start";
import { FileText, CheckCircle2, FolderOpen, ShieldCheck } from "lucide-react";


export const Route = createFileRoute("/submit")({
  head: () => ({
    meta: [
      { title: "Submit a Report — BlackListed" },
      { name: "description", content: "Submit a due diligence report. Reviewed by moderators before publication." },
    ],
  }),
  component: SubmitPageWrapper,
});

function SubmitPageWrapper() {
  return (
    <RequireVerifiedEmail>
      <SubmitPage />
    </RequireVerifiedEmail>
  );
}

const reportCategories = [
  "Fraud", "Scam Attempt", "Contract Breach", "Non-Payment", "Misrepresentation",
  "Fake Investment Scheme", "Cryptocurrency Fraud", "Gold / Commodity / Trade Fraud",
  "Identity Fraud", "Other Business Misconduct",
];

function SubmitPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<{ ticket: string; id: string } | null>(null);
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
        passport_partial: g("passport_partial"),
        national_id_partial: g("national_id_partial"),
        bank_partial: g("bank_partial"),
        wallet: g("wallet"),
        transaction_type: g("transaction_type")!,
        industry: g("industry"),
        category: g("category")!,
        amount_usd: amountRaw ? Number(amountRaw) : null,
        incident_date: g("incident_date"),
        reference_no: g("reference_no"),
        court_case_no: g("court_case_no"),
        police_report_no: g("police_report_no"),
        description: g("description")!,
      };
      const { data: report, error } = await supabase
        .from("reports")
        .insert(payload)
        .select("id, ticket_number")
        .single();
      if (error) throw error;

      const files = (fd.getAll("files") as File[]).filter((f) => f && f.size > 0);
      for (const file of files) {
        const path = `${user.id}/${report.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("evidence").upload(path, file);
        if (upErr) continue;
        await supabase.from("report_evidence").insert({
          report_id: report.id,
          uploader_id: user.id,
          file_path: path,
          file_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
        });
      }
      setDone({ ticket: report.ticket_number as string, id: report.id });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="text-xs text-muted-foreground hover:text-white">← Back</Link>
        <div className="bl-card p-8 md:p-10 mt-3">
          <h1 className="text-center text-2xl font-bold mb-1">📝 Submit Your Experience</h1>
          <p className="text-center text-muted-foreground mb-2 text-sm">
            Free of charge. <strong className="text-foreground">All submissions reviewed by admins before publication.</strong>
          </p>
          <p className="text-center text-[var(--text-muted)] mb-8 text-xs">
            Do not submit full passport numbers, national ID numbers, or full home addresses. Use partial identifiers only.
          </p>

          {done ? (
            <div className="text-center p-6 bg-[rgba(46,125,50,0.15)] border border-[rgba(46,125,50,0.4)] rounded-lg text-[#a5d6a7]">
              ✅ <strong>Report submitted for review.</strong>
              <div className="mt-3 text-foreground">
                Your ticket number:
                <div className="text-2xl font-mono font-bold mt-1 tracking-wider">{done.ticket}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Save this number — you can log in anytime to check status or upload more evidence.
              </p>
              <div className="mt-4 flex gap-2 justify-center">
                <Link to="/profile" className="bl-btn bl-btn-outline">My tickets</Link>
                <Link to="/" className="bl-btn bl-btn-outline">Back to home</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full Name / Company Name *"><input name="subject_name" className="bl-input" required maxLength={200} /></Field>
                <Field label="Alias / Nickname"><input name="alias" className="bl-input" maxLength={100} /></Field>
                <Field label="Country *"><input name="country" className="bl-input" required maxLength={80} /></Field>
                <Field label="City"><input name="city" className="bl-input" maxLength={80} /></Field>
                <Field label="Phone Number"><input name="phone" type="tel" className="bl-input" maxLength={30} /></Field>
                <Field label="Email Address"><input name="email" type="email" className="bl-input" maxLength={120} /></Field>
                <Field label="Website / Domain"><input name="website" className="bl-input" maxLength={120} /></Field>
                <Field label="Social Media Account"><input name="social" className="bl-input" maxLength={150} /></Field>
                <Field label="Passport No. (partial only)"><input name="passport_partial" className="bl-input" placeholder="AB123***" maxLength={20} /></Field>
                <Field label="National ID (partial only)"><input name="national_id_partial" className="bl-input" placeholder="****5678" maxLength={20} /></Field>
                <Field label="Bank Account (partial only)"><input name="bank_partial" className="bl-input" placeholder="IBAN ****6721" maxLength={40} /></Field>
                <Field label="Crypto Wallet"><input name="wallet" className="bl-input" maxLength={120} /></Field>
                <Field label="Transaction Type *">
                  <select name="transaction_type" className="bl-input" required defaultValue="">
                    <option value="" disabled>Select…</option>
                    <option>Investment</option><option>Loan</option><option>Real Estate</option>
                    <option>Trade / Commodity</option><option>Cryptocurrency</option>
                    <option>Service Contract</option><option>Online Purchase</option><option>Other</option>
                  </select>
                </Field>
                <Field label="Industry">
                  <select name="industry" className="bl-input" defaultValue="">
                    <option value="">Select…</option>
                    <option>Gold / Precious Metals</option><option>Crypto</option>
                    <option>Real Estate</option><option>Oil & Gas</option><option>FX / Forex</option>
                    <option>E-commerce</option><option>Logistics</option><option>Other</option>
                  </select>
                </Field>
                <Field label="Category *">
                  <select name="category" className="bl-input" required defaultValue="">
                    <option value="" disabled>Select…</option>
                    {reportCategories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Amount (USD)"><input name="amount_usd" type="number" min={0} max={1000000000} className="bl-input" /></Field>
                <Field label="Date of Incident"><input name="incident_date" type="date" className="bl-input" /></Field>
                <Field label="Reference Number"><input name="reference_no" className="bl-input" maxLength={80} /></Field>
                <Field label="Court Case Number"><input name="court_case_no" className="bl-input" maxLength={80} /></Field>
                <Field label="Police Report Number"><input name="police_report_no" className="bl-input" maxLength={80} /></Field>

                <div className="md:col-span-2">
                  <Field label="Describe Your Experience *">
                    <textarea name="description" className="bl-input min-h-[160px] resize-y" required maxLength={5000}
                      placeholder="Provide dates, amounts, what was agreed and what happened. Stick to verifiable facts." />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-[#ccc] block mb-1">Upload Evidence</label>
                  <label className="bg-[var(--input-bg)] border-[1.5px] border-dashed border-border rounded-lg p-4 text-center text-[#777] cursor-pointer block transition-all hover:border-[#555] hover:text-[#aaa]">
                    📁 Contracts, invoices, receipts, screenshots, emails
                    <input name="files" type="file" multiple accept="image/*,.pdf,.doc,.docx,.eml,.msg" className="hidden" />
                  </label>
                </div>
                <div className="md:col-span-2 flex items-start gap-2 text-xs text-[#bbb]">
                  <input id="cert" type="checkbox" required className="mt-0.5" />
                  <label htmlFor="cert">
                    I certify that the information is truthful and that I possess supporting evidence. I agree to indemnify the operator against any claims arising from this submission.
                  </label>
                </div>
                <div className="md:col-span-2">
                  <Turnstile onToken={setCaptchaToken} />
                </div>
              </div>
              {err && <p className="text-sm text-[var(--accent)]">{err}</p>}
              <button disabled={busy || !captchaToken} type="submit" className="bl-btn bl-btn-primary w-full py-3.5 text-base">
                {busy ? "Submitting…" : "🛡️ Submit Report for Review"}
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
