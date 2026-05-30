import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  alias: string | null;
  email: string | null;
  wallet: string | null;
  website: string | null;
  country: string | null;
  city: string | null;
  category: string;
  transaction_type: string;
  risk: "low" | "medium" | "high";
  status: "approved" | "resolved" | "pending" | "rejected";
  amount_usd: number | null;
  created_at: string;
};

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, term }: { text: string | null | undefined; term: string }) {
  if (!text) return <>—</>;
  const t = term.trim();
  if (!t) return <>{text}</>;
  const re = new RegExp(`(${escapeRegExp(t)})`, "ig");
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) =>
        re.test(p) && p.toLowerCase() === t.toLowerCase() ? (
          <mark key={i} className="bg-accent/30 text-white rounded px-0.5">{p}</mark>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

function ReportsPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let query = supabase
        .from("reports")
        .select("id,subject_name,alias,email,wallet,website,country,city,category,transaction_type,risk,status,amount_usd,created_at")
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

  const term = useMemo(() => q.trim(), [q]);

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
            {rows.map((r) => {
              const matchedField =
                term &&
                (
                  (r.alias && r.alias.toLowerCase().includes(term.toLowerCase()) && { label: "Alias", value: r.alias }) ||
                  (r.wallet && r.wallet.toLowerCase().includes(term.toLowerCase()) && { label: "Wallet", value: r.wallet }) ||
                  (r.website && r.website.toLowerCase().includes(term.toLowerCase()) && { label: "Website", value: r.website }) ||
                  (r.email && r.email.toLowerCase().includes(term.toLowerCase()) && { label: "Email", value: r.email })
                );
              return (
                <Link
                  to="/reports/$id"
                  params={{ id: r.id }}
                  key={r.id}
                  className="bl-card bl-card-hover p-5 block"
                >
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <span className="font-bold leading-tight">
                      <Highlight text={r.subject_name} term={term} />
                    </span>
                    <span className={`bl-badge ${r.risk === "high" ? "bl-badge-high" : "bl-badge-medium"}`}>
                      {r.risk} risk
                    </span>
                  </div>
                  {r.alias && (
                    <div className="text-xs text-muted-foreground mb-1">
                      aka <Highlight text={r.alias} term={term} />
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mb-1">{r.category} · {r.transaction_type}</div>
                  <div className="text-xs text-muted-foreground">
                    {[r.city, r.country].filter(Boolean).map((v, i, arr) => (
                      <span key={i}>
                        <Highlight text={v as string} term={term} />{i < arr.length - 1 ? ", " : ""}
                      </span>
                    ))}
                    {!r.city && !r.country ? "—" : ""}
                    {r.amount_usd ? ` · $${r.amount_usd.toLocaleString()}` : ""}
                  </div>
                  {matchedField && (
                    <div className="text-[0.7rem] text-muted-foreground mt-2 truncate">
                      {matchedField.label}: <Highlight text={matchedField.value} term={term} />
                    </div>
                  )}
                  <div className="text-[0.7rem] text-[#666] mt-3 border-t border-border pt-2">
                    {new Date(r.created_at).toLocaleDateString()} · {r.status}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
