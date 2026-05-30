import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — BlackListed" }] }),
  component: AdminPage,
});

type AdminReport = {
  id: string;
  subject_name: string;
  category: string;
  transaction_type: string;
  country: string | null;
  status: "pending" | "approved" | "rejected" | "resolved";
  risk: "low" | "medium" | "high";
  amount_usd: number | null;
  description: string;
  created_at: string;
  submitter_id: string | null;
};

type Tab = "pending" | "approved" | "rejected" | "flags" | "users";

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("pending");
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<{ pending: number; approved: number; rejected: number; flags: number }>({
    pending: 0, approved: 0, rejected: 0, flags: 0,
  });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate({ to: "/" });
  }, [user, isAdmin, loading, navigate]);

  const loadStats = useCallback(async () => {
    const [p, a, r, f] = await Promise.all([
      supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "rejected"),
      supabase.from("report_flags").select("*", { count: "exact", head: true }).eq("resolved", false),
    ]);
    setStats({ pending: p.count ?? 0, approved: a.count ?? 0, rejected: r.count ?? 0, flags: f.count ?? 0 });
  }, []);

  const loadReports = useCallback(async (status: "pending" | "approved" | "rejected") => {
    const { data } = await supabase
      .from("reports")
      .select("id,subject_name,category,transaction_type,country,status,risk,amount_usd,description,created_at,submitter_id")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(200);
    setReports((data as AdminReport[] | null) ?? []);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    loadStats();
    if (tab === "pending" || tab === "approved" || tab === "rejected") loadReports(tab);
  }, [isAdmin, tab, loadStats, loadReports]);

  const setStatus = async (id: string, status: "approved" | "rejected" | "resolved") => {
    setBusy(true);
    await supabase
      .from("reports")
      .update({ status, reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    setReports((rs) => rs.filter((r) => r.id !== id));
    loadStats();
    setBusy(false);
  };

  const setRisk = async (id: string, risk: "low" | "medium" | "high") => {
    await supabase.from("reports").update({ risk }).eq("id", id);
    setReports((rs) => rs.map((r) => (r.id === id ? { ...r, risk } : r)));
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this report permanently?")) return;
    await supabase.from("reports").delete().eq("id", id);
    setReports((rs) => rs.filter((r) => r.id !== id));
    loadStats();
  };

  if (loading || !user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link to="/" className="text-xs text-muted-foreground hover:text-white">← Site</Link>
            <h1 className="text-2xl font-bold mt-1">Admin Dashboard</h1>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { k: "pending" as Tab, label: "Pending", n: stats.pending, cls: "bl-badge-medium" },
            { k: "approved" as Tab, label: "Approved", n: stats.approved, cls: "bl-badge-verified" },
            { k: "rejected" as Tab, label: "Rejected", n: stats.rejected, cls: "bl-badge-high" },
            { k: "flags" as Tab, label: "Open Flags", n: stats.flags, cls: "bl-badge-review" },
          ].map((s) => (
            <button
              key={s.k}
              onClick={() => setTab(s.k)}
              className={`bl-card p-4 text-left ${tab === s.k ? "border-[var(--accent)]" : ""}`}
            >
              <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mb-1">{s.label}</div>
              <div className="text-2xl font-bold">{s.n}</div>
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {(["pending", "approved", "rejected", "flags", "users"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`bl-btn ${tab === t ? "bl-btn-primary" : "bl-btn-outline"} text-xs capitalize`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "flags" ? <FlagsPanel /> : tab === "users" ? <UsersPanel /> : (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <p className="text-muted-foreground">No {tab} reports.</p>
            ) : reports.map((r) => (
              <div key={r.id} className="bl-card p-5">
                <div className="flex justify-between items-start gap-3 mb-2 flex-wrap">
                  <div>
                    <Link to="/reports/$id" params={{ id: r.id }} className="font-bold hover:underline">{r.subject_name}</Link>
                    <div className="text-xs text-muted-foreground mt-1">
                      {r.category} · {r.transaction_type} · {r.country ?? "—"} · {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={r.risk}
                      onChange={(e) => setRisk(r.id, e.target.value as "low" | "medium" | "high")}
                      className="bl-input text-xs py-1 px-2 h-8 w-auto"
                    >
                      <option value="low">low</option>
                      <option value="medium">medium</option>
                      <option value="high">high</option>
                    </select>
                  </div>
                </div>
                <p className="text-sm text-[#bbb] line-clamp-3 mb-3">{r.description}</p>
                <div className="flex gap-2 flex-wrap">
                  {tab === "pending" && (
                    <>
                      <button disabled={busy} onClick={() => setStatus(r.id, "approved")} className="bl-btn bl-btn-primary text-xs">✓ Approve</button>
                      <button disabled={busy} onClick={() => setStatus(r.id, "rejected")} className="bl-btn bl-btn-outline text-xs">✗ Reject</button>
                    </>
                  )}
                  {tab === "approved" && (
                    <>
                      <button disabled={busy} onClick={() => setStatus(r.id, "resolved")} className="bl-btn bl-btn-outline text-xs">Mark resolved</button>
                      <button disabled={busy} onClick={() => setStatus(r.id, "rejected")} className="bl-btn bl-btn-outline text-xs">Unpublish</button>
                    </>
                  )}
                  {tab === "rejected" && (
                    <button disabled={busy} onClick={() => setStatus(r.id, "approved")} className="bl-btn bl-btn-primary text-xs">Restore</button>
                  )}
                  <button disabled={busy} onClick={() => remove(r.id)} className="bl-btn bl-btn-outline text-xs text-[var(--accent)]">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type Flag = { id: string; report_id: string; reason: string; details: string | null; resolved: boolean; created_at: string };
function FlagsPanel() {
  const [flags, setFlags] = useState<Flag[]>([]);
  useEffect(() => {
    supabase.from("report_flags").select("*").order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => setFlags((data as Flag[] | null) ?? []));
  }, []);
  const resolve = async (id: string) => {
    await supabase.from("report_flags").update({ resolved: true }).eq("id", id);
    setFlags((fs) => fs.map((f) => (f.id === id ? { ...f, resolved: true } : f)));
  };
  return (
    <div className="space-y-3">
      {flags.length === 0 ? <p className="text-muted-foreground">No flags.</p> : flags.map((f) => (
        <div key={f.id} className="bl-card p-4">
          <div className="flex justify-between items-start gap-3 flex-wrap">
            <div>
              <Link to="/reports/$id" params={{ id: f.report_id }} className="text-sm font-bold hover:underline">View report →</Link>
              <p className="text-sm text-[#bbb] mt-1">{f.reason}</p>
              <p className="text-xs text-muted-foreground mt-1">{new Date(f.created_at).toLocaleString()}</p>
            </div>
            {!f.resolved ? (
              <button onClick={() => resolve(f.id)} className="bl-btn bl-btn-outline text-xs">Mark resolved</button>
            ) : <span className="text-xs text-[#a5d6a7]">Resolved</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

type UserRow = { id: string; display_name: string | null; country: string | null; is_verified: boolean; created_at: string; roles: string[] };
function UsersPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(200);
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
    setBusy(true);
    if (u.roles.includes("admin")) {
      await supabase.from("user_roles").delete().eq("user_id", u.id).eq("role", "admin");
    } else {
      await supabase.from("user_roles").insert({ user_id: u.id, role: "admin" });
    }
    await load();
    setBusy(false);
  };
  const toggleVerified = async (u: UserRow) => {
    await supabase.from("profiles").update({ is_verified: !u.is_verified }).eq("id", u.id);
    setUsers((us) => us.map((x) => (x.id === u.id ? { ...x, is_verified: !u.is_verified } : x)));
  };

  return (
    <div className="bl-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs uppercase tracking-wider text-muted-foreground">
          <tr><th className="text-left p-3">User</th><th className="text-left p-3">Country</th><th className="text-left p-3">Roles</th><th className="text-left p-3">Verified</th><th className="text-left p-3">Joined</th><th className="text-right p-3">Actions</th></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-border">
              <td className="p-3">{u.display_name ?? u.id.slice(0, 8)}</td>
              <td className="p-3 text-muted-foreground">{u.country ?? "—"}</td>
              <td className="p-3">{u.roles.join(", ") || "user"}</td>
              <td className="p-3">{u.is_verified ? "✓" : "—"}</td>
              <td className="p-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
              <td className="p-3 text-right">
                <button disabled={busy} onClick={() => toggleVerified(u)} className="bl-btn bl-btn-outline text-xs mr-2">
                  {u.is_verified ? "Unverify" : "Verify"}
                </button>
                <button disabled={busy} onClick={() => toggleAdmin(u)} className="bl-btn bl-btn-outline text-xs">
                  {u.roles.includes("admin") ? "Remove admin" : "Make admin"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
