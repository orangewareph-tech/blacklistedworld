import { useCallback, useEffect, useState } from "react";
import { Shield, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type SecEvent = {
  id: string;
  event_type: string;
  email: string | null;
  ip_address: string | null;
  user_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};
type Blocked = {
  id: string;
  display_name: string | null;
  blocked_until: string | null;
  block_reason: string | null;
  blocked_at: string | null;
};

export function AbusePanel() {
  const [events, setEvents] = useState<SecEvent[]>([]);
  const [blocked, setBlocked] = useState<Blocked[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [{ data: ev }, { data: bl }] = await Promise.all([
      supabase
        .from("security_events")
        .select("id,event_type,email,ip_address,user_id,metadata,created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("profiles")
        .select("id,display_name,blocked_until,block_reason,blocked_at")
        .not("blocked_until", "is", null)
        .order("blocked_at", { ascending: false })
        .limit(100),
    ]);
    setEvents((ev as SecEvent[] | null) ?? []);
    setBlocked(((bl ?? []) as Blocked[]).filter((b) => b.blocked_until && new Date(b.blocked_until) > new Date()));
  }, []);

  useEffect(() => { load(); }, [load]);

  const unblock = async (id: string) => {
    setBusy(true);
    await supabase.rpc("admin_unblock_user", { _user_id: id });
    await load();
    setBusy(false);
  };

  return (
    <div className="space-y-5">
      <div className="bl-card p-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Shield className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.75} /> Currently blocked accounts ({blocked.length})</h3>
        {blocked.length === 0 ? (
          <p className="text-xs text-muted-foreground">No accounts blocked.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Reason</th>
                  <th className="text-left p-2">Until</th>
                  <th className="text-right p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {blocked.map((b) => (
                  <tr key={b.id} className="border-t border-border">
                    <td className="p-2">{b.display_name ?? b.id.slice(0, 8)}</td>
                    <td className="p-2 text-muted-foreground text-xs">{b.block_reason ?? "—"}</td>
                    <td className="p-2 text-xs">{b.blocked_until ? new Date(b.blocked_until).toLocaleString() : "—"}</td>
                    <td className="p-2 text-right">
                      <button disabled={busy} onClick={() => unblock(b.id)} className="bl-btn bl-btn-outline text-xs inline-flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" strokeWidth={1.75} /> Unblock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bl-card p-4">
        <h3 className="text-sm font-bold mb-3">Recent security events ({events.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-2">When</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">IP</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="p-2 text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</td>
                  <td className="p-2">
                    <span className={`text-[0.6rem] uppercase px-1.5 py-0.5 rounded ${
                      e.event_type === "blocked" ? "bg-red-500/15 text-red-300" :
                      e.event_type.includes("fail") ? "bg-yellow-500/15 text-yellow-300" :
                      "bg-blue-500/15 text-blue-300"
                    }`}>{e.event_type}</span>
                  </td>
                  <td className="p-2 text-xs">{e.email ?? "—"}</td>
                  <td className="p-2 text-xs font-mono">{e.ip_address ?? "—"}</td>
                </tr>
              ))}
              {events.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground text-xs">No events recorded.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
