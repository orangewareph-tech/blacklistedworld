import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/reports/$id")({
  component: ReportDetail,
});

type Report = {
  id: string;
  subject_name: string;
  alias: string | null;
  country: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  social: string | null;
  passport_partial: string | null;
  national_id_partial: string | null;
  bank_partial: string | null;
  wallet: string | null;
  transaction_type: string;
  industry: string | null;
  category: string;
  amount_usd: number | null;
  incident_date: string | null;
  reference_no: string | null;
  court_case_no: string | null;
  police_report_no: string | null;
  description: string;
  risk: string;
  status: string;
  created_at: string;
};

function ReportDetail() {
  const { id } = useParams({ from: "/reports/$id" });
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [flagOpen, setFlagOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [flagged, setFlagged] = useState(false);

  useEffect(() => {
    supabase.from("reports").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      setReport(data as Report | null);
      setLoading(false);
    });
  }, [id]);

  const flag = async () => {
    if (!user || !flagReason.trim()) return;
    const { error } = await supabase.from("report_flags").insert({
      report_id: id,
      flagger_id: user.id,
      reason: flagReason.trim(),
    });
    if (!error) {
      setFlagged(true);
      setFlagOpen(false);
    }
  };

  if (loading) return <div className="p-10 text-muted-foreground">Loading…</div>;
  if (!report) return <div className="p-10 text-muted-foreground">Report not found.</div>;

  const fields: [string, string | null][] = [
    ["Alias", report.alias],
    ["Country / City", [report.city, report.country].filter(Boolean).join(", ") || null],
    ["Transaction Type", report.transaction_type],
    ["Industry", report.industry],
    ["Category", report.category],
    ["Amount (USD)", report.amount_usd ? `$${report.amount_usd.toLocaleString()}` : null],
    ["Incident Date", report.incident_date],
    ["Email", report.email],
    ["Phone", report.phone],
    ["Website", report.website],
    ["Social", report.social],
    ["Passport (partial)", report.passport_partial],
    ["National ID (partial)", report.national_id_partial],
    ["Bank (partial)", report.bank_partial],
    ["Wallet", report.wallet],
    ["Reference", report.reference_no],
    ["Court Case", report.court_case_no],
    ["Police Report", report.police_report_no],
  ];

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <Link to="/reports" className="text-xs text-muted-foreground hover:text-white">← All reports</Link>
        <div className="bl-card p-8 mt-3">
          <div className="flex justify-between items-start gap-3 mb-3">
            <h1 className="text-2xl font-bold">{report.subject_name}</h1>
            <span className={`bl-badge ${report.risk === "high" ? "bl-badge-high" : "bl-badge-medium"}`}>
              {report.risk} risk
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-6">
            Filed {new Date(report.created_at).toLocaleDateString()} · Status: {report.status}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-6">
            {fields.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="text-sm text-muted-foreground">
                <strong className="text-[#ccc]">{k}:</strong> {v}
              </div>
            ))}
          </div>
          <h2 className="font-bold mb-2">Description</h2>
          <p className="text-sm text-[#bbb] whitespace-pre-wrap leading-relaxed">{report.description}</p>

          <div className="mt-8 pt-6 border-t border-border">
            {user ? (
              flagged ? (
                <p className="text-sm text-[#a5d6a7]">✅ Thanks — your flag was submitted.</p>
              ) : flagOpen ? (
                <div className="space-y-3">
                  <textarea
                    className="bl-input min-h-[80px]"
                    placeholder="Why are you flagging this report?"
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    maxLength={500}
                  />
                  <div className="flex gap-2">
                    <button className="bl-btn bl-btn-primary" onClick={flag}>Submit flag</button>
                    <button className="bl-btn bl-btn-outline" onClick={() => setFlagOpen(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button className="bl-btn bl-btn-outline text-xs" onClick={() => setFlagOpen(true)}>🚩 Flag for review</button>
              )
            ) : (
              <Link to="/auth" className="text-xs text-[var(--accent-glow)] hover:underline">Sign in to flag this report</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
