import { useEffect, useState } from "react";

export function IntroLogo() {
  const [stage, setStage] = useState<"in" | "out" | "done">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setStage("out"), 2400);
    const t2 = setTimeout(() => setStage("done"), 3100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (stage === "done") return null;

  return (
    <div className={`bl-intro ${stage === "out" ? "bl-intro-out" : ""}`}>
      <div className="bl-intro-logo">
        <span className="bl-intro-black">BLACK</span>
        <span className="bl-intro-listed">LISTED</span>
        <span className="bl-intro-sweep" aria-hidden />
      </div>
    </div>
  );
}
