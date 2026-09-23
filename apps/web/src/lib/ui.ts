// One vocabulary of classes so every page looks like the same product.

export const card =
  "rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900";

export const input =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 disabled:cursor-not-allowed disabled:opacity-50";

export const button = {
  primary: `${buttonBase} bg-orange-500 text-zinc-950 hover:bg-orange-400`,
  secondary: `${buttonBase} border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800`,
  danger: `${buttonBase} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900`,
  ghost: `${buttonBase} text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100`,
};

export const muted = "text-zinc-500 dark:text-zinc-400";

export const difficulty: Record<string, string> = {
  easy: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
  medium:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  hard: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900",
};

export const badge = (tone: string | undefined) =>
  `inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
    tone ?? "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
  }`;
