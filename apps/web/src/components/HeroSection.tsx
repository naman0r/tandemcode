import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { button, card, muted } from "../lib/ui";

const HeroSection = () => (
  <div className="grid items-center gap-12 py-12 lg:grid-cols-2 lg:py-24">
    <div className="max-w-xl">
      <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
        Solve problems together, in one editor.
      </h1>
      <p className={`${muted} mt-4 text-lg`}>
        Open a room, invite a partner, pick a problem, and write the solution
        side by side. Run it against hidden tests and see the verdict without
        leaving the room.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <SignedOut>
          <SignInButton mode="modal">
            <button type="button" className={`${button.primary} px-5 py-2.5`}>
              Get started
              <ArrowRight className="h-4 w-4" />
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link to="/rooms/create" className={`${button.primary} px-5 py-2.5`}>
            Create a room
            <ArrowRight className="h-4 w-4" />
          </Link>
        </SignedIn>
        <Link to="/problems" className={`${button.secondary} px-5 py-2.5`}>
          Browse problems
        </Link>
      </div>
      <p className={`${muted} mt-6 text-xs`}>
        Early build. Python only for now.
      </p>
    </div>

    <div className={`${card} overflow-hidden font-mono text-sm shadow-sm`}>
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900">
        <span className={muted}>two_sum.py</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Alice
          </span>
          <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            Bob
          </span>
        </span>
      </div>
      <pre className="bg-zinc-950 p-5 leading-6 text-zinc-100">
        <code>{`nums = list(map(int, input().split()))
target = int(input())
seen = {}
for i, n in enumerate(nums):
    if target - n in seen:
        print(seen[target - n], i)
        break
    seen[n] = i`}</code>
      </pre>
      <div className="flex items-center gap-4 border-t border-zinc-200 px-4 py-2 text-xs dark:border-zinc-800">
        <span className="text-emerald-600 dark:text-emerald-400">5/5 tests passed</span>
        <span className={muted}>14 ms</span>
      </div>
    </div>
  </div>
);

export default HeroSection;
