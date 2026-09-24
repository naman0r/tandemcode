import { useEffect, useState } from "react";

export type Who = "a" | "b";

export const PEOPLE: Record<Who, { name: string; color: string; soft: string }> = {
  a: { name: "maya", color: "#f97316", soft: "#fdba74" },
  b: { name: "theo", color: "#0ea5e9", soft: "#7dd3fc" },
};

export const CODE = [
  "def two_sum(nums, target):",
  "    seen = {}",
  "    for i, n in enumerate(nums):",
  "        if target - n in seen:",
  "            return [seen[target - n], i]",
  "        seen[n] = i",
];

const TURNS: { who: Who; line: number }[] = [
  { who: "a", line: 0 },
  { who: "a", line: 1 },
  { who: "b", line: 2 },
  { who: "b", line: 3 },
  { who: "a", line: 4 },
  { who: "b", line: 5 },
];

const TICK_MS = 45;
const TYPED = TURNS.reduce((n, t) => n + CODE[t.line].length, 0);
const RUNNING = 30;
const SHOWN = 110;

export type Phase = "typing" | "running" | "accepted";
export type Cursor = { line: number; col: number };

export type Demo = {
  lines: string[];
  cursors: Partial<Record<Who, Cursor>>;
  typing: Who | null;
  phase: Phase;
  // 0..1 through the typing, for progress bars and chat timing.
  progress: number;
};

const at = (step: number): Demo => {
  const lines = CODE.map(() => "");
  const cursors: Demo["cursors"] = {};
  let left = step;
  let typing: Who | null = null;
  for (const { who, line } of TURNS) {
    if (left <= 0) break;
    const n = Math.min(left, CODE[line].length);
    lines[line] = CODE[line].slice(0, n);
    cursors[who] = { line, col: n };
    typing = n < CODE[line].length ? who : null;
    left -= n;
  }
  const phase: Phase = step < TYPED ? "typing" : step < TYPED + RUNNING ? "running" : "accepted";
  return { lines, cursors, typing: phase === "typing" ? typing : null, phase, progress: Math.min(1, step / TYPED) };
};

export const useDemo = (): Demo => {
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [step, setStep] = useState(still ? TYPED + RUNNING : 0);

  useEffect(() => {
    if (still) return;
    const id = setInterval(() => setStep((s) => (s + 1) % (TYPED + RUNNING + SHOWN)), TICK_MS);
    return () => clearInterval(id);
  }, [still]);

  return at(step);
};

const KEYWORDS = new Set(["def", "for", "in", "if", "return"]);
const BUILTINS = new Set(["enumerate"]);

export type Token = { text: string; kind: "kw" | "fn" | "name" | "plain" };

export const tokens = (line: string): Token[] =>
  (line.match(/\w+|\s+|[^\w\s]/g) ?? []).map((text) => ({
    text,
    kind: KEYWORDS.has(text) ? "kw" : BUILTINS.has(text) || text === "two_sum" ? "fn" : /^\w+$/.test(text) ? "name" : "plain",
  }));
