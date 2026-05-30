import { useEffect, useState } from "react";

type Props = {
  blockedAt: string | null;
  blockedUntil: string | null;
  reason: string | null;
  recentEvents?: Array<{ type: string; at: string }>;
};

const EVENT_LABELS: Record<string, string> = {
  captcha_fail: "Failed CAPTCHA",
  otp_fail: "Failed SMS code",
  login_fail: "Failed sign-in",
  signup_attempt: "Signup attempt",
};

function formatDuration(ms: number) {
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec.toString().padStart(2, "0")}s`;
  if (m > 0) return `${m}m ${sec.toString().padStart(2, "0")}s`;
  return `${sec}s`;
}

function formatAbsolute(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function BlockedNotice({ blockedAt, blockedUntil, reason, recentEvents = [] }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const untilMs = blockedUntil ? new Date(blockedUntil).getTime() : 0;
  const startMs = blockedAt ? new Date(blockedAt).getTime() : 0;
  const totalMs = startMs && untilMs ? untilMs - startMs : 0;
  const remainingMs = Math.max(0, untilMs - now);
  const elapsedMs = totalMs ? Math.min(totalMs, totalMs - remainingMs) : 0;
  const pct = totalMs > 0 ? Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-12">
      <div className="bl-card max-w-lg w-full p-7 border border-[var(--accent)]/40">
        <div className="flex items-center gap-3 mb-4">
          <div
            aria-hidden
            className="w-10 h-10 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center text-xl font-bold"
          >
            !
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--accent)] leading-tight">
              Account temporarily blocked
            </h1>
            <p className="text-xs text-muted-foreground">
              Automated anti-abuse protection
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-5">
          Your account has been automatically suspended after detecting
          suspicious activity. Submissions and verification are paused until
          the cooldown ends.
        </p>

        {/* Live countdown */}
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 mb-4">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Time remaining
            </span>
            <span className="text-2xl font-mono font-bold text-white tabular-nums">
              {formatDuration(remainingMs)}
            </span>
          </div>
          <div
            className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-[var(--accent)] transition-[width] duration-1000 ease-linear"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Block details grid */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-5">
          <dt className="text-muted-foreground">Blocked at</dt>
          <dd className="text-white text-right tabular-nums">{formatAbsolute(blockedAt)}</dd>
          <dt className="text-muted-foreground">Unblocks at</dt>
          <dd className="text-white text-right tabular-nums">{formatAbsolute(blockedUntil)}</dd>
          {totalMs > 0 && (
            <>
              <dt className="text-muted-foreground">Cooldown length</dt>
              <dd className="text-white text-right">{formatDuration(totalMs)}</dd>
            </>
          )}
        </dl>

        {/* Reason */}
        {reason && (
          <div className="rounded-md bg-[var(--accent)]/10 border border-[var(--accent)]/30 p-3 mb-5">
            <p className="text-xs uppercase tracking-wider text-[var(--accent)] mb-1 font-semibold">
              Reason
            </p>
            <p className="text-sm text-white">{reason}</p>
          </div>
        )}

        {/* Recent events */}
        {recentEvents.length > 0 && (
          <details className="mb-5">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-white">
              Show recent security events ({recentEvents.length})
            </summary>
            <ul className="mt-2 space-y-1 text-xs">
              {recentEvents.map((e, i) => (
                <li
                  key={i}
                  className="flex justify-between gap-3 border-b border-white/5 pb-1"
                >
                  <span className="text-muted-foreground">
                    {EVENT_LABELS[e.type] ?? e.type}
                  </span>
                  <span className="text-white/80 tabular-nums">
                    {new Date(e.at).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}

        <div className="border-t border-white/5 pt-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            If you believe this is a mistake, please contact support with the
            timestamps above. Continued failed attempts may extend the block.
          </p>
        </div>
      </div>
    </div>
  );
}
