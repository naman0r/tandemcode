import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { PEOPLE, tokens, useDemo, type Demo, type Who } from "./heroDemo";
import { Mascot, Sprite } from "./Pixel";
import { button, eyebrow, heading, muted } from "../lib/ui";

const big = "px-6! py-3! text-2xl!";

const STEPS = [
  { sprite: "door", title: "Open a room", text: "Public for anyone to find, or unlisted and shared by link." },
  { sprite: "link", title: "Bring a partner", text: "Send the invite. Ask for a partner and the room goes to the top of the list." },
  { sprite: "check", title: "Run it together", text: "Your code runs against examples and hidden tests. You both see the verdict." },
  { sprite: "replay", title: "Watch it back", text: "Every keystroke, message and run, replayed in order." },
];

const KIND: Record<string, string> = {
  kw: "text-violet-300",
  fn: "text-amber-200",
  name: "text-zinc-200",
  plain: "text-zinc-400",
};

const Caret = ({ who, blink }: { who: Who; blink: boolean }) => (
  <span
    className={`relative inline-block h-[1.15em] w-[2px] align-text-bottom ${blink ? "animate-pulse" : ""}`}
    style={{ background: PEOPLE[who].color }}
  >
    <span
      className="absolute -top-[1.1em] left-0 px-1 font-silk text-[9px] leading-[1.4] text-zinc-950"
      style={{ background: PEOPLE[who].color }}
    >
      {PEOPLE[who].name}
    </span>
  </span>
);

const DemoCode = ({ demo }: { demo: Demo }) => (
  <pre className="min-h-[15rem] overflow-hidden bg-zinc-950/60 px-4 pt-6 pb-4 font-mono text-[13px] leading-7">
    {demo.lines.map((line, i) => {
      const here = (Object.keys(demo.cursors) as Who[]).find((w) => demo.cursors[w]?.line === i);
      return (
        <div key={i} className="flex">
          <span className="w-8 shrink-0 pr-4 text-right text-zinc-600 select-none">{i + 1}</span>
          <span className="whitespace-pre">
            {tokens(line).map((t, j) => (
              <span key={j} className={KIND[t.kind]}>
                {t.text}
              </span>
            ))}
            {here && <Caret who={here} blink={demo.typing !== here} />}
          </span>
        </div>
      );
    })}
  </pre>
);

// A scripted session: two people type a solution, run it, and both see the verdict.
const Workspace = () => {
  const demo = useDemo();
  return (
    <div className="relative mx-auto mt-36 max-w-4xl text-left" aria-hidden>
      <Mascot className="absolute -top-[8rem] left-10 h-40 w-40" />
      <div className="px-box overflow-hidden bg-zinc-900 [--px:#3f3f46]">
        <div className="flex items-center justify-between border-b-4 border-zinc-800 px-4 py-2.5">
          <div className="flex items-center gap-3 font-pixel text-lg text-zinc-400">
            <span className="text-zinc-100">two_sum.py</span>
            <span className="hidden sm:inline">Python 3.11</span>
          </div>
          <div className="flex items-center gap-3 font-pixel text-lg">
            <span className="flex items-center gap-1.5 text-orange-300">
              <Sprite name="maya" size={18} /> maya
            </span>
            <span className="flex items-center gap-1.5 text-sky-300">
              <Sprite name="theo" size={18} /> theo
            </span>
            <span className={`ml-2 px-3 py-0.5 text-zinc-950 ${demo.phase === "running" ? "bg-orange-300" : "bg-orange-500"}`}>
              {demo.phase === "running" ? "Running" : "Run"}
            </span>
          </div>
        </div>
        <DemoCode demo={demo} />
        <div className="flex h-14 items-center gap-4 border-t-4 border-zinc-800 px-4 font-pixel text-xl">
          {demo.phase === "typing" && <span className="text-zinc-500">Ready when you both are.</span>}
          {demo.phase === "running" && (
            <>
              <span className="text-zinc-300">Judging</span>
              <span className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className="h-3 w-3 animate-pulse bg-orange-400" style={{ animationDelay: `${i * 120}ms` }} />
                ))}
              </span>
            </>
          )}
          {demo.phase === "accepted" && (
            <>
              <span className="text-4xl tracking-wide text-emerald-400">ACCEPTED</span>
              <span className="text-zinc-400">5/5 tests, 14 ms</span>
              <span className="ml-auto hidden items-center gap-2 text-lg text-zinc-500 sm:flex">
                seen by <Sprite name="maya" size={18} /> <Sprite name="theo" size={18} />
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const HeroSection = () => (
  <>
    <section className="pt-12 pb-24 text-center sm:pt-20">
      <p className={eyebrow}>2 PLAYERS. 1 EDITOR.</p>
      <h1 className="mt-5 font-pixel text-7xl leading-none sm:text-9xl">
        Code it <span className="text-orange-500">together.</span>
      </h1>
      <p className={`${muted} mx-auto mt-6 max-w-xl text-lg`}>
        A serious place to practice coding problems, made warmer by doing it with someone. One shared editor, one
        judge, and a replay of the whole session.
      </p>
      <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row">
        <SignedOut>
          <SignInButton mode="modal">
            <button type="button" className={`${button.primary} ${big}`}>
              Start a room
            </button>
          </SignInButton>
          <Link to="/problems" className={`${button.secondary} ${big}`}>
            Browse problems
          </Link>
        </SignedOut>
        <SignedIn>
          <Link to="/rooms/create" className={`${button.primary} ${big}`}>
            Start a room
          </Link>
          <Link to="/dashboard" className={`${button.secondary} ${big}`}>
            Go to dashboard
          </Link>
        </SignedIn>
      </div>

      <Workspace />
    </section>

    <section className="pb-20">
      <h2 className={`${heading} text-center text-5xl`}>How a session goes</h2>
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <div key={step.title} className="px-box bg-zinc-900 p-5 [--px:#27272a]">
            <div className="flex items-center justify-between">
              <Sprite name={step.sprite} size={40} />
              <span className="font-silk text-xs text-zinc-600">0{i + 1}</span>
            </div>
            <h3 className={`${heading} mt-4`}>{step.title}</h3>
            <p className={`${muted} mt-2 text-sm leading-relaxed`}>{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  </>
);

export default HeroSection;
