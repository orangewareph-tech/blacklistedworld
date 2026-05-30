import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/reports")({
  validateSearch: searchSchema,
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

// Sanitize term for PostgREST .or() — commas and parentheses break the filter syntax
function sanitizeForOr(s: string) {
  return s.replace(/[,()]/g, " ").trim();
}

function Highlight({ text, term }: { text: string | null | undefined; term: string }) {
  if (text === null || text === undefined || text === "") return <>—</>;
  const t = term.trim();
  if (!t) return <>{text}</>;
  const lower = t.toLowerCase();
  const parts = text.split(new RegExp(`(${escapeRegExp(t)})`, "i"));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === lower ? (
          <mark key={i} className="bg-accent/30 text-white rounded px-0.5">{p}</mark>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

function ReportsPage() {
  const { q: initialQ } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(initialQ ?? "");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync URL when user types (debounced)
  useEffect(() => {
    const id = setTimeout(() => {
      navigate({ search: { q: q.trim() || undefined }, replace: true });
    }, 300);
    return () => clearTimeout(id);
  }, [q, navigate]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      let query = supabase
        .from("reports")
        .select("id,subject_name,alias,email,wallet,website,country,city,category,transaction_type,risk,status,amount_usd,created_at")
        .in("status", ["approved", "resolved"])
        .order("created_at", { ascending: false })
        .limit(100);
      const safe = sanitizeForOr(q);
      if (safe) {
        const term = `%${safe}%`;
        query = query.or(
          `subject_name.ilike.${term},alias.ilike.${term},email.ilike.${term},wallet.ilike.${term},website.ilike.${term},country.ilike.${term},city.ilike.${term}`
        );
      }
      const { data, error } = await query;
      if (error) {
        console.error("[reports] search failed", error);
        setError(error.message);
        setRows([]);
      } else {
        setRows((data as ReportRow[] | null) ?? []);
      }
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
        <p className="text-sm text-muted-foreground mb-6">Search names, companies, wallets, websites, emails, cities or countries.</p>
        <div className="bl-search mb-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reports…"
            autoFocus
          />
        </div>
        <div className="text-xs text-muted-foreground mb-6">
          {loading ? "Searching…" : `${rows.length} result${rows.length === 1 ? "" : "s"}${term ? ` for "${term}"` : ""}`}
        </div>
        {error ? (
          <p className="text-sm text-red-400">Search error: {error}</p>
        ) : loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground">No reports found{term ? ` for "${term}"` : ""}.</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => {
              const lt = term.toLowerCase();
              const matchedField = !term
                ? null
                : (r.alias && r.alias.toLowerCase().includes(lt) && { label: "Alias", value: r.alias }) ||
                  (r.wallet && r.wallet.toLowerCase().includes(lt) && { label: "Wallet", value: r.wallet }) ||
                  (r.website && r.website.toLowerCase().includes(lt) && { label: "Website", value: r.website }) ||
                  (r.email && r.email.toLowerCase().includes(lt) && { label: "Email", value: r.email }) ||
                  null;
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
