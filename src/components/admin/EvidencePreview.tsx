import { useEffect, useState } from "react";
import { X, Download, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Evidence = {
  id: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

export function EvidenceList({ reportId }: { reportId: string }) {
  const [items, setItems] = useState<Evidence[]>([]);
  const [open, setOpen] = useState<{ url: string; item: Evidence } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("report_evidence")
        .select("id,file_name,file_path,mime_type,size_bytes,created_at")
        .eq("report_id", reportId)
        .order("created_at", { ascending: false });
      setItems((data as Evidence[] | null) ?? []);
      setLoading(false);
    })();
  }, [reportId]);

  const view = async (e: Evidence) => {
    const { data } = await supabase.storage.from("evidence").createSignedUrl(e.file_path, 300);
    if (data?.signedUrl) setOpen({ url: data.signedUrl, item: e });
  };

  if (loading) return <p className="text-xs text-muted-foreground">Loading evidence…</p>;
  if (items.length === 0) return <p className="text-xs text-muted-foreground">No evidence attached.</p>;

  return (
    <div className="space-y-1.5">
      {items.map((e) => (
        <button
          key={e.id}
          onClick={() => view(e)}
          className="flex items-center justify-between w-full bl-card p-2.5 hover:border-[var(--accent)]/40 text-left"
        >
          <span className="flex items-center gap-2 min-w-0">
            <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" strokeWidth={1.75} />
            <span className="truncate text-xs">{e.file_name}</span>
          </span>
          <span className="text-[0.65rem] text-muted-foreground ml-2 flex-shrink-0">
            {e.size_bytes ? `${(e.size_bytes / 1024).toFixed(1)} KB` : ""}
          </span>
        </button>
      ))}

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] bg-background border border-border rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <span className="text-sm truncate">{open.item.file_name}</span>
              <div className="flex items-center gap-2">
                <a href={open.url} download={open.item.file_name} className="bl-btn bl-btn-outline text-xs flex items-center gap-1.5">
                  <Download className="h-3.5 w-3.5" strokeWidth={1.75} /> Download
                </a>
                <button onClick={() => setOpen(null)} className="text-muted-foreground hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-2 bg-black/40 flex items-center justify-center" style={{ minHeight: 400 }}>
              {open.item.mime_type?.startsWith("image/") ? (
                <img src={open.url} alt={open.item.file_name} className="max-h-[75vh] object-contain" />
              ) : open.item.mime_type === "application/pdf" ? (
                <iframe src={open.url} title={open.item.file_name} className="w-full" style={{ height: "75vh" }} />
              ) : (
                <p className="text-muted-foreground text-sm p-10">Preview not available. Use Download.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
