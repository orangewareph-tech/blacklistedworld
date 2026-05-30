import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function IntroLogo() {
  const { user } = useAuth();
  const [stage, setStage] = useState<"in" | "out" | "done">("in");

  useEffect(() => {
    // Skip if already seen, or user is logged in
    if (localStorage.getItem("bl-intro-seen") || user) {
      setStage("done");
      localStorage.setItem("bl-intro-seen", "1");
      return;
    }
    const tOut = setTimeout(() => setStage("out"), 4400);
    const tDone = setTimeout(() => {
      setStage("done");
      localStorage.setItem("bl-intro-seen", "1");
    }, 5000);
    return () => {
      clearTimeout(tOut);
      clearTimeout(tDone);
    };
  }, [user]);

  if (stage === "done") return null;

  const skip = () => {
    localStorage.setItem("bl-intro-seen", "1");
    setStage("out");
    setTimeout(() => setStage("done"), 500);
  };

  return (
    <div
      className={`bl-intro ${stage === "out" ? "bl-intro-out" : ""}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") skip();
      }}
      tabIndex={0}
    >
      <div
        className="bl-intro-logo"
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
        onClick={skip}
        className="bl-intro-skip"
        aria-label="Skip intro"
      >
        Skip Intro →
      </button>
    </div>
  );
}
