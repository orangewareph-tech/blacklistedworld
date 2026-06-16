import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search, Filter, Edit3, Trash2, Check, X, RotateCcw, ShieldCheck,
  ShieldOff, UserCheck, UserX, FileText, Users, Flag, History, LogOut, Eye,
  BarChart3, Inbox, Shield, Download, CheckSquare, Square,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { downloadCsv } from "@/lib/csv";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { DashboardPanel } from "@/components/admin/DashboardPanel";
import { QueuePanel } from "@/components/admin/QueuePanel";
import { AbusePanel } from "@/components/admin/AbusePanel";
import { EvidenceList } from "@/components/admin/EvidencePreview";


export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin CMS — BlackListed" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

type ReportStatus = "pending" | "approved" | "rejected" | "resolved";
type RiskLevel = "low" | "medium" | "high";

type AdminReport = {
  id: string;
  ticket_number: string | null;
  subject_name: string;
  alias: string | null;
  category: string;
  transaction_type: string;
  industry: string | null;
  country: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  status: ReportStatus;
  risk: RiskLevel;
  amount_usd: number | null;
  description: string;
  admin_notes: string | null;
  created_at: string;
  submitter_id: string | null;
};

type Tab = "reports" | "reporters" | "flags" | "users" | "audit";

function AdminPage() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("reports");
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, flags: 0, reporters: 0 });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate({ to: "/admin/login" });
  }, [user, isAdmin, loading, navigate]);

  const loadStats = useCallback(async () => {
    const [p, a, r, f, u] = await Promise.all([
      supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "rejected"),
      supabase.from("report_flags").select("*", { count: "exact", head: true }).eq("resolved", false),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]);
    setStats({
      pending: p.count ?? 0, approved: a.count ?? 0, rejected: r.count ?? 0,
      flags: f.count ?? 0, reporters: u.count ?? 0,
    });
  }, []);

  useEffect(() => { if (isAdmin) loadStats(); }, [isAdmin, loadStats]);

  if (loading || !user || !isAdmin) return null;

  const tabs: { k: Tab; label: string; icon: typeof FileText }[] = [
    { k: "reports", label: "Reports", icon: FileText },
    { k: "reporters", label: "Reporters", icon: Users },
    { k: "flags", label: "Flags", icon: Flag },
    { k: "users", label: "Admins", icon: ShieldCheck },
    { k: "audit", label: "Audit Log", icon: History },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 gap-3 flex-wrap">
          <div>
            <Link to="/" className="text-xs text-muted-foreground hover:text-white">← Site</Link>
            <h1 className="text-2xl font-bold mt-1 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-[var(--accent)]" strokeWidth={1.75} /> Admin CMS
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Signed in as {user.email}</p>
          </div>
          <button onClick={() => signOut().then(() => navigate({ to: "/admin/login" }))}
            className="bl-btn bl-btn-outline text-xs flex items-center gap-1.5">
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} /> Sign out
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Pending", n: stats.pending },
            { label: "Approved", n: stats.approved },
            { label: "Rejected", n: stats.rejected },
            { label: "Open Flags", n: stats.flags },
            { label: "Reporters", n: stats.reporters },
          ].map((s) => (
            <div key={s.label} className="bl-card p-4">
              <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mb-1">{s.label}</div>
              <div className="text-2xl font-bold">{s.n}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-5 flex-wrap border-b border-border pb-3">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.k} onClick={() => setTab(t.k)}
                className={`bl-btn text-xs flex items-center gap-1.5 ${tab === t.k ? "bl-btn-primary" : "bl-btn-outline"}`}>
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === "reports" && <ReportsPanel onChange={loadStats} />}
        {tab === "reporters" && <ReportersPanel />}
        {tab === "flags" && <FlagsPanel onChange={loadStats} />}
        {tab === "users" && <UsersPanel />}
        {tab === "audit" && <AuditPanel />}
      </div>
    </div>
  );
}

/* -------------------- Helpers -------------------- */

async function logAction(action: string, target_type: string | null, target_id: string | null, summary: string, metadata: Record<string, unknown> = {}) {
  await supabase.rpc("log_admin_action", {
    _action: action,
    _target_type: target_type ?? undefined,
    _target_id: target_id ?? undefined,
    _summary: summary,
    _metadata: metadata as never,
  });
}

/* -------------------- Reports Panel -------------------- */

function ReportsPanel({ onChange }: { onChange: () => void }) {
  const [status, setStatus] = useState<ReportStatus | "all">("pending");
  const [risk, setRisk] = useState<RiskLevel | "all">("all");
  const [country, setCountry] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [editing, setEditing] = useState<AdminReport | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    let q = supabase
      .from("reports")
      .select("id,ticket_number,subject_name,alias,category,transaction_type,industry,country,city,email,phone,website,status,risk,amount_usd,description,admin_notes,created_at,submitter_id")
      .order("created_at", { ascending: false })
      .limit(200);

    if (status !== "all") q = q.eq("status", status);
    if (risk !== "all") q = q.eq("risk", risk);
    if (country.trim()) q = q.ilike("country", `%${country.trim()}%`);
    if (search.trim()) {
      const s = `%${search.trim()}%`;
      q = q.or(`subject_name.ilike.${s},alias.ilike.${s},email.ilike.${s},website.ilike.${s},ticket_number.ilike.${s}`);
    }
    const { data } = await q;
    setReports((data as AdminReport[] | null) ?? []);
  }, [status, risk, country, search]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (r: AdminReport, newStatus: ReportStatus) => {
    setBusy(true);
    await supabase.from("reports").update({
      status: newStatus,
      reviewed_at: new Date().toISOString(),
    }).eq("id", r.id);
    await logAction(`report.${newStatus}`, "report", r.id, `${newStatus} "${r.subject_name}"`, { ticket: r.ticket_number });
    setReports((rs) => rs.filter((x) => x.id !== r.id || status === "all"));
    onChange();
    setBusy(false);
  };

  const updateRisk = async (r: AdminReport, newRisk: RiskLevel) => {
    await supabase.from("reports").update({ risk: newRisk }).eq("id", r.id);
    await logAction("report.risk_change", "report", r.id, `risk → ${newRisk} on "${r.subject_name}"`, { from: r.risk, to: newRisk });
    setReports((rs) => rs.map((x) => (x.id === r.id ? { ...x, risk: newRisk } : x)));
  };

  const remove = async (r: AdminReport) => {
    if (!confirm(`Delete report "${r.subject_name}" permanently?`)) return;
    await supabase.from("reports").delete().eq("id", r.id);
    await logAction("report.delete", "report", r.id, `deleted "${r.subject_name}"`, { ticket: r.ticket_number });
    setReports((rs) => rs.filter((x) => x.id !== r.id));
    onChange();
  };

  return (
    <div>
      <div className="bl-card p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground block mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") setSearch(searchInput); }}
                onBlur={() => setSearch(searchInput)}
                placeholder="Name, alias, email, ticket…"
                className="bl-input pl-10 w-full"
              />
            </div>
          </div>
          <div>
            <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground block mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as ReportStatus | "all")} className="bl-input">
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="resolved">Resolved</option>
              <option value="all">All</option>
            </select>
          </div>
          <div>
            <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground block mb-1">Risk</label>
            <select value={risk} onChange={(e) => setRisk(e.target.value as RiskLevel | "all")} className="bl-input">
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground block mb-1">Country</label>
            <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. UAE" className="bl-input w-32" />
          </div>
          <div className="text-xs text-muted-foreground self-center flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" strokeWidth={1.75} /> {reports.length} result(s)
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {reports.length === 0 ? (
          <p className="text-muted-foreground text-sm">No reports match these filters.</p>
        ) : reports.map((r) => (
          <div key={r.id} className="bl-card p-5">
            <div className="flex justify-between items-start gap-3 mb-2 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to="/reports/$id" params={{ id: r.id }} className="font-bold hover:underline">{r.subject_name}</Link>
                  {r.ticket_number && <span className="text-[0.65rem] text-muted-foreground font-mono">#{r.ticket_number}</span>}
                  <span className={`text-[0.6rem] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    r.status === "approved" ? "bg-green-500/15 text-green-300" :
                    r.status === "rejected" ? "bg-red-500/15 text-red-300" :
                    r.status === "resolved" ? "bg-blue-500/15 text-blue-300" :
                    "bg-yellow-500/15 text-yellow-300"
                  }`}>{r.status}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {r.category} · {r.transaction_type} · {r.country ?? "—"} · {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
              <select value={r.risk} onChange={(e) => updateRisk(r, e.target.value as RiskLevel)}
                className="bl-input text-xs py-1 px-2 h-8 w-auto">
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </div>
            <p className="text-sm text-[#bbb] line-clamp-3 mb-3">{r.description}</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setEditing(r)} className="bl-btn bl-btn-outline text-xs flex items-center gap-1.5">
                <Edit3 className="h-3.5 w-3.5" strokeWidth={1.75} /> Edit
              </button>
              {r.status === "pending" && (
                <>
                  <button disabled={busy} onClick={() => updateStatus(r, "approved")} className="bl-btn bl-btn-primary text-xs flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" strokeWidth={1.75} /> Approve
                  </button>
                  <button disabled={busy} onClick={() => updateStatus(r, "rejected")} className="bl-btn bl-btn-outline text-xs flex items-center gap-1.5">
                    <X className="h-3.5 w-3.5" strokeWidth={1.75} /> Reject
                  </button>
                </>
              )}
              {r.status === "approved" && (
                <button disabled={busy} onClick={() => updateStatus(r, "resolved")} className="bl-btn bl-btn-outline text-xs">Mark resolved</button>
              )}
              {(r.status === "rejected" || r.status === "resolved") && (
                <button disabled={busy} onClick={() => updateStatus(r, "approved")} className="bl-btn bl-btn-outline text-xs flex items-center gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} /> Restore
                </button>
              )}
              <button disabled={busy} onClick={() => remove(r)} className="bl-btn bl-btn-outline text-xs text-[var(--accent)] flex items-center gap-1.5">
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && <EditReportModal report={editing} onClose={() => setEditing(null)} onSaved={(r) => {
        setReports((rs) => rs.map((x) => (x.id === r.id ? r : x)));
        setEditing(null);
      }} />}
    </div>
  );
}

/* -------------------- Edit Modal -------------------- */

function EditReportModal({ report, onClose, onSaved }: {
  report: AdminReport; onClose: () => void; onSaved: (r: AdminReport) => void;
}) {
  const [form, setForm] = useState(report);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof AdminReport>(k: K, v: AdminReport[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true); setErr(null);
    const { error } = await supabase.from("reports").update({
      subject_name: form.subject_name,
      alias: form.alias,
      category: form.category,
      transaction_type: form.transaction_type,
      industry: form.industry,
      country: form.country,
      city: form.city,
      email: form.email,
      phone: form.phone,
      website: form.website,
      amount_usd: form.amount_usd,
      description: form.description,
      admin_notes: form.admin_notes,
      risk: form.risk,
      status: form.status,
    }).eq("id", form.id);
    if (error) { setErr(error.message); setBusy(false); return; }
    await logAction("report.edit", "report", form.id, `edited "${form.subject_name}"`, { ticket: form.ticket_number });
    setBusy(false);
    onSaved(form);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bl-card max-w-3xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Edit3 className="h-4 w-4" strokeWidth={1.75} /> Edit Report
            {form.ticket_number && <span className="text-xs text-muted-foreground font-mono">#{form.ticket_number}</span>}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        {err && <p className="text-xs text-destructive mb-3">{err}</p>}
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Subject name"><input className="bl-input w-full" value={form.subject_name} onChange={(e) => set("subject_name", e.target.value)} /></Field>
          <Field label="Alias"><input className="bl-input w-full" value={form.alias ?? ""} onChange={(e) => set("alias", e.target.value || null)} /></Field>
          <Field label="Category"><input className="bl-input w-full" value={form.category} onChange={(e) => set("category", e.target.value)} /></Field>
          <Field label="Transaction type"><input className="bl-input w-full" value={form.transaction_type} onChange={(e) => set("transaction_type", e.target.value)} /></Field>
          <Field label="Industry"><input className="bl-input w-full" value={form.industry ?? ""} onChange={(e) => set("industry", e.target.value || null)} /></Field>
          <Field label="Country"><input className="bl-input w-full" value={form.country ?? ""} onChange={(e) => set("country", e.target.value || null)} /></Field>
          <Field label="City"><input className="bl-input w-full" value={form.city ?? ""} onChange={(e) => set("city", e.target.value || null)} /></Field>
          <Field label="Email"><input className="bl-input w-full" value={form.email ?? ""} onChange={(e) => set("email", e.target.value || null)} /></Field>
          <Field label="Phone"><input className="bl-input w-full" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value || null)} /></Field>
          <Field label="Website"><input className="bl-input w-full" value={form.website ?? ""} onChange={(e) => set("website", e.target.value || null)} /></Field>
          <Field label="Amount (USD)">
            <input type="number" step="0.01" className="bl-input w-full" value={form.amount_usd ?? ""}
              onChange={(e) => set("amount_usd", e.target.value === "" ? null : Number(e.target.value))} />
          </Field>
          <Field label="Risk">
            <select className="bl-input w-full" value={form.risk} onChange={(e) => set("risk", e.target.value as RiskLevel)}>
              <option value="low">low</option><option value="medium">medium</option><option value="high">high</option>
            </select>
          </Field>
          <Field label="Status">
            <select className="bl-input w-full" value={form.status} onChange={(e) => set("status", e.target.value as ReportStatus)}>
              <option value="pending">pending</option><option value="approved">approved</option>
              <option value="rejected">rejected</option><option value="resolved">resolved</option>
            </select>
          </Field>
        </div>
        <Field label="Description"><textarea rows={5} className="bl-input w-full" value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
        <Field label="Admin notes (internal)"><textarea rows={3} className="bl-input w-full" value={form.admin_notes ?? ""} onChange={(e) => set("admin_notes", e.target.value || null)} /></Field>
        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="bl-btn bl-btn-outline text-xs">Cancel</button>
          <button disabled={busy} onClick={save} className="bl-btn bl-btn-primary text-xs">{busy ? "Saving…" : "Save changes"}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mt-2">
      <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground block mb-1">{label}</span>
      {children}
    </label>
  );
}

/* -------------------- Reporters Panel -------------------- */

type Reporter = {
  id: string;
  display_name: string | null;
  username: string | null;
  country: string | null;
  is_verified: boolean;
  blocked_until: string | null;
  created_at: string;
  report_count: number;
  approved_count: number;
};

function ReportersPanel() {
  const [reporters, setReporters] = useState<Reporter[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,display_name,username,country,is_verified,blocked_until,created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    const { data: reports } = await supabase.from("reports").select("submitter_id,status");
    const counts = new Map<string, { total: number; approved: number }>();
    (reports ?? []).forEach((r) => {
      if (!r.submitter_id) return;
      const c = counts.get(r.submitter_id) ?? { total: 0, approved: 0 };
      c.total++;
      if (r.status === "approved" || r.status === "resolved") c.approved++;
      counts.set(r.submitter_id, c);
    });
    setReporters((profiles ?? []).map((p) => ({
      ...p,
      report_count: counts.get(p.id)?.total ?? 0,
      approved_count: counts.get(p.id)?.approved ?? 0,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleVerified = async (r: Reporter) => {
    await supabase.from("profiles").update({ is_verified: !r.is_verified }).eq("id", r.id);
    await logAction(r.is_verified ? "user.unverify" : "user.verify", "user", r.id,
      `${r.is_verified ? "unverified" : "verified"} ${r.display_name ?? r.id.slice(0, 8)}`);
    setReporters((rs) => rs.map((x) => (x.id === r.id ? { ...x, is_verified: !r.is_verified } : x)));
  };

  const toggleBlock = async (r: Reporter) => {
    const isBlocked = r.blocked_until && new Date(r.blocked_until) > new Date();
    if (isBlocked) {
      await supabase.from("profiles").update({ blocked_until: null, block_reason: null, blocked_at: null }).eq("id", r.id);
      await logAction("user.unblock", "user", r.id, `unblocked ${r.display_name ?? r.id.slice(0, 8)}`);
    } else {
      const reason = prompt("Block reason?");
      if (!reason) return;
      const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await supabase.from("profiles").update({ blocked_until: until, block_reason: reason, blocked_at: new Date().toISOString() }).eq("id", r.id);
      await logAction("user.block", "user", r.id, `blocked ${r.display_name ?? r.id.slice(0, 8)} (24h)`, { reason });
    }
    load();
  };

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return reporters;
    return reporters.filter((r) =>
      (r.display_name?.toLowerCase().includes(s)) ||
      (r.username?.toLowerCase().includes(s)) ||
      (r.country?.toLowerCase().includes(s))
    );
  }, [reporters, search]);

  return (
    <div>
      <div className="bl-card p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reporters by name, username, country…" className="bl-input pl-10 w-full" />
        </div>
      </div>

      <div className="bl-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left p-3">Reporter</th>
              <th className="text-left p-3">Country</th>
              <th className="text-left p-3">Reports</th>
              <th className="text-left p-3">Approved</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Joined</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No reporters found.</td></tr>
            ) : filtered.map((r) => {
              const isBlocked = r.blocked_until && new Date(r.blocked_until) > new Date();
              return (
                <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                  <td className="p-3">
                    <div className="font-medium">{r.display_name ?? "—"}</div>
                    {r.username && <div className="text-xs text-muted-foreground">@{r.username}</div>}
                  </td>
                  <td className="p-3 text-muted-foreground">{r.country ?? "—"}</td>
                  <td className="p-3">{r.report_count}</td>
                  <td className="p-3 text-green-300">{r.approved_count}</td>
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      {r.is_verified && <span className="text-[0.6rem] uppercase bg-blue-500/15 text-blue-300 px-1.5 py-0.5 rounded">Verified</span>}
                      {isBlocked && <span className="text-[0.6rem] uppercase bg-red-500/15 text-red-300 px-1.5 py-0.5 rounded">Blocked</span>}
                      {!r.is_verified && !isBlocked && <span className="text-[0.6rem] text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => toggleVerified(r)} className="bl-btn bl-btn-outline text-xs mr-1 inline-flex items-center gap-1">
                      {r.is_verified ? <UserX className="h-3 w-3" strokeWidth={1.75} /> : <UserCheck className="h-3 w-3" strokeWidth={1.75} />}
                      {r.is_verified ? "Unverify" : "Verify"}
                    </button>
                    <button onClick={() => toggleBlock(r)} className="bl-btn bl-btn-outline text-xs inline-flex items-center gap-1">
                      {isBlocked ? <ShieldCheck className="h-3 w-3" strokeWidth={1.75} /> : <ShieldOff className="h-3 w-3" strokeWidth={1.75} />}
                      {isBlocked ? "Unblock" : "Block 24h"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------- Flags Panel -------------------- */

type Flag = { id: string; report_id: string; reason: string; details: string | null; resolved: boolean; created_at: string };
function FlagsPanel({ onChange }: { onChange: () => void }) {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [showResolved, setShowResolved] = useState(false);

  const load = useCallback(async () => {
    let q = supabase.from("report_flags").select("*").order("created_at", { ascending: false }).limit(200);
    if (!showResolved) q = q.eq("resolved", false);
    const { data } = await q;
    setFlags((data as Flag[] | null) ?? []);
  }, [showResolved]);

  useEffect(() => { load(); }, [load]);

  const resolve = async (f: Flag) => {
    await supabase.from("report_flags").update({ resolved: true }).eq("id", f.id);
    await logAction("flag.resolve", "flag", f.id, `resolved flag: ${f.reason}`);
    setFlags((fs) => fs.map((x) => (x.id === f.id ? { ...x, resolved: true } : x)));
    onChange();
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <label className="text-xs flex items-center gap-2">
          <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
          Show resolved
        </label>
      </div>
      <div className="space-y-3">
        {flags.length === 0 ? <p className="text-muted-foreground text-sm">No flags.</p> : flags.map((f) => (
          <div key={f.id} className="bl-card p-4">
            <div className="flex justify-between items-start gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <Link to="/reports/$id" params={{ id: f.report_id }} className="text-sm font-bold hover:underline flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" strokeWidth={1.75} /> View report
                </Link>
                <p className="text-sm text-[#bbb] mt-1">{f.reason}</p>
                {f.details && <p className="text-xs text-muted-foreground mt-1 italic">{f.details}</p>}
                <p className="text-xs text-muted-foreground mt-1">{new Date(f.created_at).toLocaleString()}</p>
              </div>
              {!f.resolved ? (
                <button onClick={() => resolve(f)} className="bl-btn bl-btn-outline text-xs flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" strokeWidth={1.75} /> Mark resolved
                </button>
              ) : <span className="text-xs text-green-300 flex items-center gap-1"><Check className="h-3 w-3" /> Resolved</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------- Admins (Users with admin role) Panel -------------------- */

type UserRow = { id: string; display_name: string | null; country: string | null; is_verified: boolean; created_at: string; roles: string[] };
function UsersPanel() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(500);
    const { data: roles } = await supabase.from("user_roles").select("user_id,role");
    const rolesByUser = new Map<string, string[]>();
    (roles ?? []).forEach((r) => {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    });
    setUsers((profiles ?? []).map((p) => ({
      id: p.id, display_name: p.display_name, country: p.country,
      is_verified: p.is_verified, created_at: p.created_at,
      roles: rolesByUser.get(p.id) ?? [],
    })));
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggleAdmin = async (u: UserRow) => {
    if (u.id === me?.id && u.roles.includes("admin")) {
      if (!confirm("Remove YOUR OWN admin role? You'll be locked out of the CMS.")) return;
    }
    setBusy(true);
    if (u.roles.includes("admin")) {
      await supabase.from("user_roles").delete().eq("user_id", u.id).eq("role", "admin");
      await logAction("role.revoke_admin", "user", u.id, `revoked admin from ${u.display_name ?? u.id.slice(0, 8)}`);
    } else {
      await supabase.from("user_roles").insert({ user_id: u.id, role: "admin" });
      await logAction("role.grant_admin", "user", u.id, `granted admin to ${u.display_name ?? u.id.slice(0, 8)}`);
    }
    await load();
    setBusy(false);
  };

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) =>
      (u.display_name?.toLowerCase().includes(s)) ||
      u.id.toLowerCase().includes(s)
    );
  }, [users, search]);

  return (
    <div>
      <div className="bl-card p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or ID…" className="bl-input pl-10 w-full" />
        </div>
      </div>
      <div className="bl-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Country</th>
              <th className="text-left p-3">Roles</th>
              <th className="text-left p-3">Joined</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="p-3">
                  {u.display_name ?? u.id.slice(0, 8)}
                  {u.id === me?.id && <span className="ml-2 text-[0.6rem] text-[var(--accent)]">(you)</span>}
                </td>
                <td className="p-3 text-muted-foreground">{u.country ?? "—"}</td>
                <td className="p-3">
                  {u.roles.length === 0 ? <span className="text-muted-foreground">user</span> :
                    u.roles.map((r) => (
                      <span key={r} className="text-[0.6rem] uppercase bg-[var(--accent)]/15 text-[var(--accent)] px-1.5 py-0.5 rounded mr-1">{r}</span>
                    ))}
                </td>
                <td className="p-3 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="p-3 text-right">
                  <button disabled={busy} onClick={() => toggleAdmin(u)} className="bl-btn bl-btn-outline text-xs inline-flex items-center gap-1">
                    {u.roles.includes("admin") ?
                      <><ShieldOff className="h-3 w-3" strokeWidth={1.75} /> Remove admin</> :
                      <><ShieldCheck className="h-3 w-3" strokeWidth={1.75} /> Make admin</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------- Audit Log Panel -------------------- */

type AuditEntry = {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  summary: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

function AuditPanel() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [actorNames, setActorNames] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      const rows = (data as AuditEntry[] | null) ?? [];
      setEntries(rows);
      const ids = Array.from(new Set(rows.map((e) => e.actor_id).filter(Boolean) as string[]));
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id,display_name").in("id", ids);
        const map: Record<string, string> = {};
        (profs ?? []).forEach((p) => { map[p.id] = p.display_name ?? p.id.slice(0, 8); });
        setActorNames(map);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return entries;
    return entries.filter((e) =>
      e.action.toLowerCase().includes(s) ||
      (e.summary?.toLowerCase().includes(s)) ||
      (e.target_type?.toLowerCase().includes(s))
    );
  }, [entries, search]);

  return (
    <div>
      <div className="bl-card p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, summary, target…" className="bl-input pl-10 w-full" />
        </div>
      </div>
      <div className="bl-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left p-3">When</th>
              <th className="text-left p-3">Admin</th>
              <th className="text-left p-3">Action</th>
              <th className="text-left p-3">Summary</th>
              <th className="text-left p-3">Target</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No audit entries yet.</td></tr>
            ) : filtered.map((e) => (
              <tr key={e.id} className="border-t border-border align-top">
                <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</td>
                <td className="p-3 text-xs">{e.actor_id ? (actorNames[e.actor_id] ?? e.actor_id.slice(0, 8)) : "—"}</td>
                <td className="p-3"><span className="text-[0.65rem] uppercase font-mono bg-muted/40 px-1.5 py-0.5 rounded">{e.action}</span></td>
                <td className="p-3 text-xs">{e.summary ?? "—"}</td>
                <td className="p-3 text-xs text-muted-foreground">
                  {e.target_type && e.target_id ? (
                    e.target_type === "report" ? (
                      <Link to="/reports/$id" params={{ id: e.target_id }} className="hover:underline">{e.target_type} · {e.target_id.slice(0, 8)}</Link>
                    ) : <span>{e.target_type} · {e.target_id.slice(0, 8)}</span>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
