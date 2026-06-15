import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X, User, Info, Phone, FileWarning, LogIn, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const close = () => setOpen(false);

  const handleReport = () => {
    close();
    navigate({ to: user ? "/submit" : "/auth" });
  };

  return (
    <>
      <button
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center h-10 w-10 rounded-md border border-white/15 hover:bg-white/5 text-white"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <button
            aria-label="Close menu backdrop"
            onClick={close}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />
          <aside
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md max-h-[90vh] rounded-2xl bg-[#0a0a0a] border border-white/15 shadow-[0_20px_80px_-10px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            <button
              aria-label="Close menu"
              onClick={close}
              className="absolute top-3 right-3 z-10 inline-flex items-center justify-center h-10 w-10 rounded-full bg-white text-black hover:bg-white/80 shadow-lg transition-colors"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>

            <div className="flex items-center px-5 py-4 border-b border-white/10 pr-16">
              <span className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Menu</span>
            </div>

            {/* User block */}
            <div className="px-5 py-5 border-b border-border">
              {user ? (
                <Link
                  to="/profile"
                  onClick={close}
                  className="flex items-center gap-3 group"
                >
                  <div className="h-11 w-11 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent-glow)] font-bold">
                    {user.email?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{user.email}</div>
                    <div className="text-xs text-[var(--accent-glow)] group-hover:underline">View & edit profile →</div>
                  </div>
                </Link>
              ) : (
                <Link
                  to="/auth"
                  onClick={close}
                  className="bl-btn bl-btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  <LogIn className="h-4 w-4" /> Sign in / Sign up
                </Link>
              )}
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-3">
              <MenuLink to="/profile" icon={User} label="My Profile" onClick={close} disabled={!user} />
              <MenuLink to="/about" icon={Info} label="About Us" onClick={close} />
              <MenuLink to="/contact" icon={Phone} label="Contact" onClick={close} />
              <MenuLink to="/reports" icon={ShieldCheck} label="Browse Reports" onClick={close} />
              <MenuLink to="/pre-assessment" icon={ShieldCheck} label="Pre-Assessment Request" onClick={close} disabled={!user} />
              {isAdmin
                ? <MenuLink to="/admin" icon={ShieldCheck} label="Admin Dashboard" onClick={close} />
                : <MenuLink to="/admin/login" icon={ShieldCheck} label="Admin CMS Login" onClick={close} />}
            </nav>

            <div className="px-5 py-4 border-t border-border space-y-2">
              <button
                onClick={handleReport}
                className="bl-btn bl-btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                <FileWarning className="h-4 w-4" /> Submit a Report
              </button>
              {user && (
                <button
                  onClick={async () => { close(); await signOut(); }}
                  className="w-full py-2.5 rounded-md border border-white/15 hover:bg-white/5 text-sm flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function MenuLink({
  to, icon: Icon, label, onClick, disabled,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground/50 cursor-not-allowed">
        <Icon className="h-4 w-4" /> <span className="text-sm">{label}</span>
      </div>
    );
  }
  return (
    <Link
      to={to}
      onClick={onClick}
      activeProps={{ className: "bg-white/5 text-white" }}
      className="flex items-center gap-3 px-3 py-3 rounded-lg text-[#ccc] hover:bg-white/5 hover:text-white transition-colors"
    >
      <Icon className="h-4 w-4" /> <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
