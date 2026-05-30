import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Check } from "lucide-react";


export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — BlackListed" },
      { name: "description", content: "Manage your account, verification status and tickets." },
    ],
  }),
  component: ProfilePage,
});

type Profile = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  country: string | null;
  phone: string | null;
  is_verified: boolean;
  phone_verified_at: string | null;
};

type Ticket = {
  kind: "Report" | "Pre-Assessment";
  id: string;
  ticket_number: string | null;
  subject_name: string;
  status: string;
  created_at: string;
};

function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setErr(error.message);
        else
          setProfile(
            (data as Profile) ?? {
              id: user.id,
              display_name: "",
              username: "",
              avatar_url: "",
              bio: "",
              country: "",
              phone: "",
              is_verified: false,
              phone_verified_at: null,
            },
          );
      });

    (async () => {
      const [r, p] = await Promise.all([
        supabase
          .from("reports")
          .select("id, ticket_number, subject_name, status, created_at")
          .eq("submitter_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("pre_assessments")
          .select("id, ticket_number, subject_name, status, created_at")
          .eq("submitter_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      const all: Ticket[] = [
        ...(r.data ?? []).map((x) => ({ ...x, kind: "Report" as const })),
        ...(p.data ?? []).map((x) => ({ ...x, kind: "Pre-Assessment" as const })),
      ].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      setTickets(all);
    })();
  }, [user]);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name,
        bio: profile.bio,
        country: profile.country,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
      })
      .eq("id", user.id);
    setBusy(false);
    if (error) setErr(error.message);
    else setMsg("Saved.");
  };

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setErr(null);
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (upErr) {
      setErr(upErr.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setProfile((p) => (p ? { ...p, avatar_url: data.publicUrl } : p));
    await supabase
      .from("profiles")
      .update({ avatar_url: data.publicUrl })
      .eq("id", user.id);
    setUploading(false);
    setMsg("Avatar updated.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        Loading…
      </div>
    );
  }

  const emailConfirmed = !!user?.email_confirmed_at;
  const phoneConfirmed = !!profile.phone_verified_at;

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="text-xs text-muted-foreground hover:text-white">← Back</Link>

        <div className="bl-card p-8 mt-3">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Your profile</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {profile.username && (
                <p className="text-xs text-muted-foreground">@{profile.username}</p>
              )}
            </div>
            <button
              onClick={signOut}
              className="bl-btn px-4 py-2 border border-white/15 rounded-md text-sm hover:bg-white/5"
            >
              Sign out
            </button>
          </div>

          {/* Verification status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <VerificationCard
              label="Email"
              ok={emailConfirmed}
              okText="Verified"
              action={
                emailConfirmed ? null : (
                  <button
                    onClick={async () => {
                      if (!user?.email) return;
                      const { error } = await supabase.auth.resend({
                        type: "signup",
                        email: user.email,
                        options: { emailRedirectTo: `${window.location.origin}/` },
                      });
                      if (error) setErr(error.message);
                      else setMsg("Verification email re-sent.");
                    }}
                    className="text-xs text-[var(--accent-glow)] hover:underline"
                  >
                    Resend email
                  </button>
                )
              }
            />
            <VerificationCard
              label="Mobile phone"
              ok={phoneConfirmed}
              okText="Verified"
              action={
                phoneConfirmed ? null : (
                  <Link to="/verify-phone" className="text-xs text-[var(--accent-glow)] hover:underline">
                    Verify now
                  </Link>
                )
              }
            />
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-20 w-20 rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl text-muted-foreground">
                  {(profile.display_name || user?.email || "?")[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <label className="bl-btn px-3 py-2 border border-white/15 rounded-md text-sm cursor-pointer hover:bg-white/5 inline-block">
                {uploading ? "Uploading…" : "Change avatar"}
                <input type="file" accept="image/*" className="hidden" onChange={onAvatar} disabled={uploading} />
              </label>
              <p className="text-xs text-muted-foreground mt-1">PNG / JPG up to ~2MB</p>
            </div>
          </div>

          <form onSubmit={onSave} className="space-y-4">
            <Field label="Display name">
              <input
                className="bl-input"
                value={profile.display_name ?? ""}
                onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                maxLength={80}
              />
            </Field>
            <Field label="Bio">
              <textarea
                className="bl-input min-h-24"
                value={profile.bio ?? ""}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                maxLength={500}
                placeholder="A short bio about you."
              />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Country">
                <input
                  className="bl-input"
                  value={profile.country ?? ""}
                  onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                  maxLength={80}
                />
              </Field>
              <Field label="Phone (display)">
                <input
                  className="bl-input"
                  value={profile.phone ?? ""}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  maxLength={40}
                />
              </Field>
            </div>

            {err && <p className="text-sm text-[var(--accent)]">{err}</p>}
            {msg && <p className="text-sm text-emerald-400">{msg}</p>}
            <button type="submit" disabled={busy} className="bl-btn bl-btn-primary px-6 py-3">
              {busy ? "Saving…" : "Save changes"}
            </button>
          </form>
        </div>

        {/* Tickets */}
        <div className="bl-card p-8 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Your tickets</h2>
            <div className="flex gap-2">
              <Link to="/submit" className="bl-btn bl-btn-outline text-xs px-3 py-2">+ Report</Link>
              <Link to="/pre-assessment" className="bl-btn bl-btn-outline text-xs px-3 py-2">+ Pre-Assessment</Link>
            </div>
          </div>
          {tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tickets yet.</p>
          ) : (
            <div className="divide-y divide-white/10">
              {tickets.map((t) => (
                <div key={`${t.kind}-${t.id}`} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-mono text-sm tracking-wider">{t.ticket_number ?? "—"}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {t.kind} · {t.subject_name}
                    </div>
                  </div>
                  <div className="text-xs">
                    <span className="px-2 py-1 rounded bg-white/5 border border-white/10">{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VerificationCard({
  label,
  ok,
  okText,
  action,
}: {
  label: string;
  ok: boolean;
  okText: string;
  action: React.ReactNode;
}) {
  return (
    <div className={`p-4 rounded-lg border ${ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/10 bg-white/5"}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className={`text-sm font-semibold ${ok ? "text-emerald-400" : "text-foreground"}`}>
            {ok ? `✓ ${okText}` : "Not verified"}
          </div>
        </div>
        {action}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-semibold text-[#ccc] block mb-1">{label}</label>
      {children}
    </div>
  );
}
