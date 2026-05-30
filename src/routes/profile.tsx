import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — BlackListed" },
      { name: "description", content: "Manage your account, avatar and contact details." },
    ],
  }),
  component: ProfilePage,
});

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  country: string | null;
  phone: string | null;
  is_verified: boolean;
};

function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
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
        else setProfile((data as Profile) ?? { id: user.id, display_name: "", avatar_url: "", bio: "", country: "", phone: "", is_verified: false });
      });
  }, [user]);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setBusy(true); setErr(null); setMsg(null);
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
    setUploading(true); setErr(null);
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { setErr(upErr.message); setUploading(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setProfile((p) => p ? { ...p, avatar_url: data.publicUrl } : p);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
    setUploading(false);
    setMsg("Avatar updated.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (loading || !profile) {
    return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="text-xs text-muted-foreground hover:text-white">← Back</Link>
        <div className="bl-card p-8 mt-3">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Your profile</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <button onClick={signOut} className="bl-btn px-4 py-2 border border-white/15 rounded-md text-sm hover:bg-white/5">
              Sign out
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-20 w-20 rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                : <span className="text-2xl text-muted-foreground">{(profile.display_name || user?.email || "?")[0]?.toUpperCase()}</span>}
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
              <Field label="Phone">
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
