import { useEffect, useState } from "react";

export function IntroLogo() {
  const [stage, setStage] = useState<"in" | "out" | "done">("in");

  useEffect(() => {
    const tOut = setTimeout(() => setStage("out"), 4400);
    const tDone = setTimeout(() => setStage("done"), 5000);
    return () => {
      clearTimeout(tOut);
      clearTimeout(tDone);
    };
  }, []);

  if (stage === "done") return null;

  const skip = () => {
    setStage("out");
    setTimeout(() => setStage("done"), 500);
  };

  return (
    <div
      className={`bl-intro ${stage === "out" ? "bl-intro-out" : ""}`}
      onClick={skip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") skip();
      }}
    >
      <div className="bl-intro-logo">
        <span className="bl-intro-black">BLACK</span>
        <span className="bl-intro-listed">LISTED</span>
        <span className="bl-intro-sweep" aria-hidden />
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          skip();
        }}
        className="bl-intro-skip"
        aria-label="Skip intro"
      >
        Skip Intro →
      </button>
    </div>
  );
}
