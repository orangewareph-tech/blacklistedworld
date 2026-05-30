import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — BlackListed" },
      { name: "description", content: "Browse and search community-verified due diligence reports." },
    ],
  }),
  component: ReportsPage,
});

type ReportRow = {
  id: string;
  subject_name: string;
  country: string | null;
  city: string | null;
  category: string;
  transaction_type: string;
  risk: "low" | "medium" | "high";
  status: "approved" | "resolved" | "pending" | "rejected";
  amount_usd: number | null;
  created_at: string;
};

function ReportsPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let query = supabase
        .from("reports")
        .select("id,subject_name,country,city,category,transaction_type,risk,status,amount_usd,created_at")
        .in("status", ["approved", "resolved"])
        .order("created_at", { ascending: false })
        .limit(100);
      if (q.trim()) {
        const term = `%${q.trim()}%`;
        query = query.or(
          `subject_name.ilike.${term},alias.ilike.${term},email.ilike.${term},wallet.ilike.${term},website.ilike.${term},country.ilike.${term}`
        );
      }
      const { data } = await query;
      setRows((data as ReportRow[] | null) ?? []);
      setLoading(false);
    };
    const id = setTimeout(load, 250);
    return () => clearTimeout(id);
  }, [q]);

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="text-xs text-muted-foreground hover:text-white">← Back</Link>
        <h1 className="text-3xl font-bold mt-3 mb-1">Reports</h1>
        <p className="text-sm text-muted-foreground mb-6">Search names, companies, wallets, websites, emails or countries.</p>
        <div className="bl-search mb-6">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reports…"
          />
        </div>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground">No reports found.</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <Link
                to="/reports/$id"
                params={{ id: r.id }}
                key={r.id}
                className="bl-card bl-card-hover p-5 block"
              >
                <div className="flex justify-between items-start mb-2 gap-2">
                  <span className="font-bold leading-tight">{r.subject_name}</span>
                  <span className={`bl-badge ${r.risk === "high" ? "bl-badge-high" : "bl-badge-medium"}`}>
                    {r.risk} risk
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-1">{r.category} · {r.transaction_type}</div>
                <div className="text-xs text-muted-foreground">
                  {[r.city, r.country].filter(Boolean).join(", ") || "—"}
                  {r.amount_usd ? ` · $${r.amount_usd.toLocaleString()}` : ""}
                </div>
                <div className="text-[0.7rem] text-[#666] mt-3 border-t border-border pt-2">
                  {new Date(r.created_at).toLocaleDateString()} · {r.status}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
