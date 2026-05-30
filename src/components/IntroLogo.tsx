import { useEffect, useState } from "react";

export function IntroLogo() {
  const [stage, setStage] = useState<"in" | "out" | "done">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setStage("out"), 4300);
    const t2 = setTimeout(() => setStage("done"), 5000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const skip = () => setStage("done");

  if (stage === "done") return null;

  return (
    <div className={`bl-intro ${stage === "out" ? "bl-intro-out" : ""}`}>
      <div className="bl-intro-logo">
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
