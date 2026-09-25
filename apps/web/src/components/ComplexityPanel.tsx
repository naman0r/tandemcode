import { useState } from "react";
import type { Submission } from "../hooks/UseWebSocket";
import { submissionApi } from "../lib/api";
import { button, muted } from "../lib/ui";

// Growth classes from the runner, slowest-growing first. n log n measures
// too close to n to tell apart, so the two share a class.
const CLASSES = ["constant", "linear", "quadratic", "cubic", "worse"];
const LABEL: Record<string, string> = {
  constant: "O(1) or O(log n)",
  linear: "O(n) or O(n log n)",
  quadratic: "O(n²)",
  cubic: "O(n³)",
  worse: "Worse than O(n³)",
};

// The pixel face has no superscript digits, so exponents are drawn raised.
const Label = ({ name }: { name: string }) => (
  <>
    {LABEL[name].split(/([²³])/).map((part, i) =>
      part === "²" || part === "³" ? <sup key={i}>{part === "²" ? 2 : 3}</sup> : part,
    )}
  </>
);

const compact = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`);

const Chart = ({ points }: { points: { n: number; ms: number }[] }) => {
  const top = Math.max(...points.map((point) => point.ms));
  return (
    <div className="flex h-28 items-end gap-2" aria-hidden>
      {points.map((point) => (
        <div key={point.n} className="flex flex-1 flex-col items-center gap-1">
          <span className="font-pixel text-base leading-none text-zinc-400">{Math.round(point.ms)} ms</span>
          <div className="w-full bg-orange-500" style={{ height: `${Math.max(4, (point.ms / top) * 72)}px` }} />
          <span className="font-pixel text-base leading-none text-zinc-500">n={compact(point.n)}</span>
        </div>
      ))}
    </div>
  );
};

const ComplexityPanel = ({ submission, expected }: { submission: Submission; expected: string | null }) => {
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { analysisStatus: state, analysis } = submission;

  const ask = async () => {
    setAsking(true);
    setError(null);
    try {
      await submissionApi.requestAnalysis(submission.id);
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
      setError(typeof detail === "string" ? detail : "The analysis could not be started.");
    } finally {
      setAsking(false);
    }
  };

  if (state === "pending" || state === "running") {
    return (
      <div className="flex items-center gap-3 border-t-2 border-zinc-800 px-4 py-3 font-pixel text-xl">
        <span className="text-zinc-300">Measuring on bigger inputs</span>
        <span className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className="h-3 w-3 bg-orange-400 motion-safe:animate-pulse" style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </span>
      </div>
    );
  }

  if (state === "done" && analysis?.complexity) {
    const measured = CLASSES.indexOf(analysis.complexity);
    const target = expected ? CLASSES.indexOf(expected) : -1;
    const slower = target >= 0 && measured > target;
    return (
      <div className="space-y-3 border-t-2 border-zinc-800 px-4 py-3 text-sm">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className={`font-pixel text-3xl leading-none ${slower ? "text-amber-300" : "text-emerald-400"}`}>
            <Label name={analysis.complexity} />
          </span>
          {expected && (
            <span className={muted}>
              {slower ? "Slower than" : "Matches"} the expected {LABEL[expected]}
            </span>
          )}
        </div>
        {analysis.points.length > 0 && <Chart points={analysis.points} />}
        {analysis.note && <p className={muted}>{analysis.note}</p>}
        <p className={`${muted} text-xs`}>
          Estimated from CPU time on inputs of growing size. A guide, not a proof.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-t-2 border-zinc-800 px-4 py-3 text-sm">
      <button type="button" onClick={ask} disabled={asking} className={button.secondary}>
        {state === "failed" ? "Try the analysis again" : "Analyze complexity"}
      </button>
      <span className={muted}>
        {state === "failed" && analysis?.note ? analysis.note : "Reruns this solution on bigger inputs to see how its time grows."}
      </span>
      {error && <span className="text-red-300">{error}</span>}
    </div>
  );
};

export default ComplexityPanel;
