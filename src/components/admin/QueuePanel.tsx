import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, X, Flag, ChevronUp, ChevronDown, Inbox } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useHotkeys } from "@/hooks/useHotkeys";
import { EvidenceList } from "./EvidencePreview";

type QueueReport = {
  id: string; ticket_number: string | null; subject_name: string; category: string;
  risk: "low" | "medium" | "high"; country: string | null; description: string;
  created_at: string; admin_notes: string | null;
};
type Template = { id: string; label: string; body: string; kind: "approve" | "reject" | "note" };

async function logAction(action: string, target_id: string, summary: string, metadata: Record<string, unknown> = {}) {
  await supabase.rpc("log_admin_action", {
    _action: action, _target_type: "report", _target_id: target_id,
    _summary: summary, _metadata: metadata as never,
  });
}

export function QueuePanel({ onChange }: { onChange: () => void }) {
  const [items, setItems] = useState<QueueReport[]>([]);
  const [idx, setIdx] = useState(0);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [{ data: r }, { data: t }] = await Promise.all([
      supabase.from("reports")
        .select("id,ticket_number,subject_name,category,risk,country,description,created_at,admin_notes")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(100),
      supabase.from("moderation_templates").select("*").order("kind"),
    ]);
    setItems((r as QueueReport[] | null) ?? []);
    setTemplates((t as Template[] | null) ?? []);
    setIdx(0); setNote("");
  }, []);

  useEffect(() => { load(); }, [load]);

  const cur = items[idx];

  const decide = useCallback(async (status: "approved" | "rejected") => {
    if (!cur) return;
    setBusy(true);
    await supabase.from("reports").update({
      status, reviewed_at: new Date().toISOString(), admin_notes: note || cur.admin_notes,
    }).eq("id", cur.id);
    await logAction(`report.${status}`, cur.id, `${status} "${cur.subject_name}"`, { ticket: cur.ticket_number });
    setItems((xs) => xs.filter((x) => x.id !== cur.id));
    setIdx((i) => Math.max(0, Math.min(i, items.length - 2)));
    setNote("");
    onChange();
    setBusy(false);
  }, [cur, note, items.length, onChange]);

  const move = useCallback((delta: number) => {
    setIdx((i) => Math.max(0, Math.min(items.length - 1, i + delta)));
    setNote("");
  }, [items.length]);

  useHotkeys({
    j: () => move(1),
    k: () => move(-1),
    a: () => decide("approved"),
    r: () => decide("rejected"),
  }, !!cur && !busy);

  const usable = useMemo(() => templates.filter((t) => t.kind === "approve" || t.kind === "reject"), [templates]);

  if (items.length === 0) {
    return (
      <div className="bl-card p-10 text-center">
        <Inbox className="h-10 w-10 mx-auto text-muted-foreground mb-3" strokeWidth={1.25} />
        <p className="text-sm">Inbox zero — no pending reports.</p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4">
      <div className="bl-card p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground">Report {idx + 1} of {items.length}</span>
          <div className="flex gap-1">
            <button onClick={() => move(-1)} className="bl-btn bl-btn-outline text-xs px-2"><ChevronUp className="h-3.5 w-3.5" strokeWidth={1.75} /></button>
            <button onClick={() => move(1)} className="bl-btn bl-btn-outline text-xs px-2"><ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} /></button>
          </div>
        </div>
        {cur && (
          <>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-xl font-bold">{cur.subject_name}</h3>
              {cur.ticket_number && <span className="text-[0.65rem] text-muted-foreground font-mono">#{cur.ticket_number}</span>}
              <span className={`text-[0.6rem] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                cur.risk === "high" ? "bg-red-500/15 text-red-300" :
                cur.risk === "medium" ? "bg-yellow-500/15 text-yellow-300" : "bg-green-500/15 text-green-300"
              }`}>{cur.risk}</span>
            </div>
            <div className="text-xs text-muted-foreground mb-3">
              {cur.category} · {cur.country ?? "—"} · {new Date(cur.created_at).toLocaleString()}
            </div>
            <p className="text-sm text-[#bbb] whitespace-pre-wrap leading-relaxed mb-5">{cur.description}</p>

            <div className="mb-3">
              <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mb-1">Evidence</div>
              <EvidenceList reportId={cur.id} />
            </div>

            <div className="mb-3">
              <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground block mb-1">Admin note (saved with decision)</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="bl-input w-full" placeholder="Reason / context…" />
            </div>

            <div className="flex gap-2 flex-wrap">
              <button disabled={busy} onClick={() => decide("approved")} className="bl-btn bl-btn-primary text-sm flex items-center gap-1.5">
                <Check className="h-4 w-4" strokeWidth={1.75} /> Approve <kbd className="ml-1 text-[0.6rem] opacity-70">A</kbd>
              </button>
              <button disabled={busy} onClick={() => decide("rejected")} className="bl-btn bl-btn-outline text-sm flex items-center gap-1.5">
                <X className="h-4 w-4" strokeWidth={1.75} /> Reject <kbd className="ml-1 text-[0.6rem] opacity-70">R</kbd>
              </button>
              <Link to="/reports/$id" params={{ id: cur.id }} className="bl-btn bl-btn-outline text-sm flex items-center gap-1.5" target="_blank">
                <Flag className="h-4 w-4" strokeWidth={1.75} /> Open page
              </Link>
            </div>
          </>
        )}
      </div>

      <aside className="space-y-3">
        <div className="bl-card p-4">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Shortcuts</h4>
          <ul className="text-xs text-[#bbb] space-y-1">
            <li><kbd className="text-[0.65rem] bg-muted/30 px-1.5 py-0.5 rounded">J</kbd> next  ·  <kbd className="text-[0.65rem] bg-muted/30 px-1.5 py-0.5 rounded">K</kbd> previous</li>
            <li><kbd className="text-[0.65rem] bg-muted/30 px-1.5 py-0.5 rounded">A</kbd> approve  ·  <kbd className="text-[0.65rem] bg-muted/30 px-1.5 py-0.5 rounded">R</kbd> reject</li>
          </ul>
        </div>
        <div className="bl-card p-4">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Templates</h4>
          <div className="space-y-1.5">
            {usable.length === 0 ? <p className="text-xs text-muted-foreground">No templates.</p> :
              usable.map((t) => (
                <button key={t.id} onClick={() => setNote(t.body)} className="w-full text-left bl-card p-2 hover:border-[var(--accent)]/40">
                  <div className="text-xs font-medium">{t.label}</div>
                  <div className={`text-[0.6rem] uppercase mt-0.5 ${t.kind === "approve" ? "text-green-300" : "text-red-300"}`}>{t.kind}</div>
                </button>
              ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
