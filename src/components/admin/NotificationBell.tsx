import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Notif = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  target_type: string | null;
  target_id: string | null;
  read_by: string[];
  created_at: string;
};

export function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(40);
    setItems((data as Notif[] | null) ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = supabase
      .channel("admin_notifications_feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload) => setItems((cur) => [payload.new as Notif, ...cur].slice(0, 40)),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const unread = user ? items.filter((n) => !n.read_by.includes(user.id)) : [];

  const markAllRead = async () => {
    if (!user) return;
    const ids = unread.map((n) => n.id);
    if (ids.length === 0) return;
    await Promise.all(
      unread.map((n) =>
        supabase
          .from("admin_notifications")
          .update({ read_by: [...n.read_by, user.id] })
          .eq("id", n.id),
      ),
    );
    setItems((cur) => cur.map((n) => (ids.includes(n.id) ? { ...n, read_by: [...n.read_by, user.id] } : n)));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex items-center justify-center h-9 w-9 rounded-md border border-border hover:bg-muted/30"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} />
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--accent)] text-[0.6rem] flex items-center justify-center text-white">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto bl-card p-0 z-50 shadow-xl">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Notifications</span>
            {unread.length > 0 && (
              <button onClick={markAllRead} className="text-[0.65rem] text-[var(--accent-glow)] hover:underline flex items-center gap-1">
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground p-4">No notifications yet.</p>
          ) : (
            <ul>
              {items.map((n) => {
                const isUnread = user && !n.read_by.includes(user.id);
                const inner = (
                  <div className={`px-3 py-2.5 border-b border-border/60 hover:bg-muted/20 ${isUnread ? "bg-[var(--accent)]/5" : ""}`}>
                    <div className="text-xs font-medium flex items-center gap-2">
                      {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />}
                      {n.title}
                    </div>
                    {n.body && <div className="text-[0.7rem] text-muted-foreground mt-0.5">{n.body}</div>}
                    <div className="text-[0.6rem] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.target_type === "report" && n.target_id ? (
                      <Link to="/reports/$id" params={{ id: n.target_id }} onClick={() => setOpen(false)}>{inner}</Link>
                    ) : inner}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
