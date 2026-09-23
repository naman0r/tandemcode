import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Code2, History, Users, Zap } from "lucide-react";
import { button, muted } from "../lib/ui";

const FEATURES = [
  { icon: Users, text: "Live cursors and chat" },
  { icon: Code2, text: "One shared editor" },
  { icon: CheckCircle2, text: "Hidden test verdicts" },
  { icon: History, text: "Session replay" },
];

const primary =
  "group inline-flex items-center gap-2 rounded-xl bg-orange-500 px-7 py-3.5 text-base font-semibold text-zinc-950 shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-400 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5";

const Arrow = () => (
  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
);

const HeroSection = () => (
  <div className="relative">
    {/* Soft colour behind everything, so the page is not a flat sheet. Radial
        gradients that reach transparent at their own edge: nothing here is
        clipped, so there are no hard edges in either theme. */}
    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
      <div className="absolute top-0 left-0 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(closest-side,rgba(249,115,22,0.16),transparent)] dark:bg-[radial-gradient(closest-side,rgba(249,115,22,0.28),transparent)]" />
      <div className="absolute right-0 bottom-0 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(closest-side,rgba(30,58,138,0.25),transparent)] dark:bg-[radial-gradient(closest-side,rgba(37,99,235,0.3),transparent)]" />
    </div>

    <div className="grid items-center gap-16 py-16 lg:grid-cols-2 lg:py-28">
      <div className="max-w-2xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700 dark:bg-orange-950 dark:text-orange-300">
          <Zap className="h-4 w-4" />
          Real-time collaboration
        </div>

        <h1 className="text-4xl font-bold leading-tight tracking-tight lg:text-6xl">
          Code together,{" "}
          <span className="text-orange-500 dark:text-orange-400">
            learn faster
          </span>
        </h1>

        <p className={`${muted} mt-6 text-xl leading-relaxed`}>
          Open a room, invite a partner, and solve a problem in one shared editor.
          Run against hidden tests, see the verdict together, and replay the whole
          session afterwards.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 font-medium">
              <Icon className="h-5 w-5 text-orange-500 dark:text-orange-400" />
              {text}
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <SignedOut>
            <SignInButton mode="modal">
              <button type="button" className={primary}>
                Start coding together
                <Arrow />
              </button>
            </SignInButton>
            <Link to="/problems" className={`${button.secondary} rounded-xl px-7 py-3.5 text-base`}>
              Browse problems
            </Link>
          </SignedOut>
          <SignedIn>
            <Link to="/rooms/create" className={primary}>
              Create a room
              <Arrow />
            </Link>
            <Link to="/dashboard" className={`${button.secondary} rounded-xl px-7 py-3.5 text-base`}>
              Go to dashboard
            </Link>
          </SignedIn>
        </div>

        <div className="mt-12 flex items-center gap-8 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <div>
            <div className="text-2xl font-bold">Beta</div>
            <div className={`${muted} text-sm`}>You are testing an early build</div>
          </div>
          <div>
            <div className="text-2xl font-bold">15</div>
            <div className={`${muted} text-sm`}>Problems with hidden tests</div>
          </div>
          <div>
            <div className="text-2xl font-bold">Python</div>
            <div className={`${muted} text-sm`}>3.11, more languages later</div>
          </div>
        </div>
      </div>

      <div className="relative mx-6 lg:mr-8 lg:ml-8">
        <div className="overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl shadow-black/30 transition-transform duration-500 rotate-2 hover:rotate-0">
          <div className="flex items-center justify-between bg-zinc-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              <span className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="h-3 w-3 rounded-full bg-green-500" />
            </div>
            <span className="font-mono text-sm text-zinc-400">two_sum.py</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
              <span className="text-orange-300">Alice</span>
              <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400" />
              <span className="text-sky-300">Bob</span>
            </div>
          </div>

          <pre className="p-6 font-mono text-sm leading-6 text-zinc-300">
            <span className="text-zinc-500"># Two Sum</span>
            {"\n"}
            <span className="text-purple-400">for</span> <span className="text-orange-300">i</span>,{" "}
            <span className="text-orange-300">n</span> <span className="text-purple-400">in</span>{" "}
            <span className="text-blue-400">enumerate</span>(nums):
            {"\n"}
            {"    "}<span className="text-purple-400">if</span> target - n{" "}
            <span className="text-purple-400">in</span> seen:
            {"\n"}
            {"        "}<span className="text-blue-400">print</span>(seen[target - n], i)
            {"\n"}
            {"        "}<span className="text-purple-400">break</span>
            {"\n"}
            {"    "}seen[n] = i
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-orange-400 align-middle" />
          </pre>

          <div className="flex items-center gap-4 border-t border-zinc-700 bg-zinc-800 px-6 py-3 text-sm">
            <span className="flex items-center gap-1.5 text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              5/5 tests passed
            </span>
            <span className="text-zinc-400">14 ms</span>
          </div>
        </div>

        <div className="absolute -top-6 -right-6 rotate-12 rounded-lg bg-white p-3 shadow-lg transition-transform hover:rotate-6 dark:bg-zinc-800">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4 text-orange-500 dark:text-orange-400" />
            Live cursors
          </div>
        </div>
        <div className="absolute -bottom-14 -left-6 -rotate-12 rounded-lg bg-white p-3 shadow-lg transition-transform hover:-rotate-6 dark:bg-zinc-800">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Verdicts for everyone
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default HeroSection;
