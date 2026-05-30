import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const markIntroSeen = () => {
  try {
    localStorage.setItem("bl-intro-seen", "1");
  } catch {
    // Ignore storage failures; skipping the intro should still work immediately.
  }
};

const hasIntroBeenSeen = () => {
  try {
    return localStorage.getItem("bl-intro-seen") === "1";
  } catch {
    return false;
  }
};

export function IntroLogo() {
  const { user } = useAuth();
  const [stage, setStage] = useState<"in" | "out" | "done">("in");

  const skip = useCallback(
    (event?: { preventDefault?: () => void; stopPropagation?: () => void }) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      markIntroSeen();
      setStage("done");
    },
    [],
  );

  useEffect(() => {
    // Skip if already seen, or user is logged in
    if (hasIntroBeenSeen() || user) {
      setStage("done");
      markIntroSeen();
      return;
    }
    const tOut = setTimeout(() => setStage("out"), 4400);
    const tDone = setTimeout(() => {
      setStage("done");
      markIntroSeen();
    }, 5000);
    return () => {
      clearTimeout(tOut);
      clearTimeout(tDone);
    };
  }, [user]);

  if (stage === "done") return null;

  return (
    <div
      className={`bl-intro ${stage === "out" ? "bl-intro-out" : ""}`}
      onPointerDown={skip}
      onClick={skip}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") skip();
      }}
      tabIndex={0}
    >
      <div
        className="bl-intro-logo"
        onPointerDown={skip}
        onClick={skip}
        role="button"
        aria-label="Skip intro"
      >
        <span className="bl-intro-black">BLACK</span>
        <span className="bl-intro-listed">LISTED</span>
        <span className="bl-intro-sweep" aria-hidden />
      </div>
      <button
        type="button"
        onPointerDown={skip}
        onClick={skip}
        className="bl-intro-skip"
        aria-label="Skip intro"
      >
        Skip Intro →
      </button>
    </div>
  );
}
