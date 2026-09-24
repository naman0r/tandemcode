// One vocabulary of classes so every page looks like the same product.

export const card = "px-box bg-zinc-900 [--px:#27272a]";

export const input =
  "w-full border-2 border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none disabled:opacity-60";

const buttonBase =
  "px-box inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap px-4 py-1.5 font-pixel text-xl leading-none transition-transform focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-6 focus-visible:outline-orange-400 enabled:active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50";

export const button = {
  primary: `${buttonBase} bg-orange-500 text-zinc-950 [--px-shade:rgba(0,0,0,0.25)] [--px:#0a0a0b] hover:bg-orange-400`,
  secondary: `${buttonBase} bg-zinc-900 text-zinc-100 [--px:#3f3f46] hover:bg-zinc-800`,
  danger: `${buttonBase} bg-red-950 text-red-300 [--px:#7f1d1d] hover:bg-red-900`,
  // A toggle that is on.
  active: `${buttonBase} bg-orange-950 text-orange-300 [--px:#c2410c] hover:bg-orange-900`,
  ghost:
    "inline-flex shrink-0 items-center justify-center gap-2 px-3 py-1.5 font-pixel text-xl leading-none text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus-visible:outline-2 focus-visible:outline-orange-400",
};

export const muted = "text-zinc-400";

// Page and section headings, in the pixel face.
export const title = "font-pixel text-5xl leading-none text-zinc-50";
export const heading = "font-pixel text-3xl leading-none";

// Small caps label above a heading.
export const eyebrow = "font-silk text-xs tracking-[0.2em] text-zinc-500";

export const difficulty: Record<string, string> = {
  easy: "border-emerald-800 bg-emerald-950 text-emerald-300",
  medium: "border-amber-800 bg-amber-950 text-amber-300",
  hard: "border-red-800 bg-red-950 text-red-300",
};

export const badge = (tone: string | undefined) =>
  `inline-flex items-center border-2 px-1.5 pt-px font-pixel text-lg leading-tight capitalize ${
    tone ?? "border-zinc-700 bg-zinc-800 text-zinc-300"
  }`;

// You are orange. Everyone else takes the next colour in the order they
// joined, so a pair is always orange and blue on both screens.
const YOU = "#f97316";
const OTHERS = ["#0ea5e9", "#a855f7", "#22c55e", "#eab308", "#ec4899", "#14b8a6"];

export const personColor = (userId: string, selfId: string | undefined, roster: string[]): string => {
  if (userId === selfId) return YOU;
  const index = roster.filter((id) => id !== selfId).indexOf(userId);
  return OTHERS[Math.max(0, index) % OTHERS.length];
};
