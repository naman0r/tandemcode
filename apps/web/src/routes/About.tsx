import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { ArrowRight, FileText, Plus, Terminal, Video } from "lucide-react";
import Layout from "../components/Layout";
import { muted } from "../lib/ui";

const PHASES = [
  {
    label: "Set up",
    steps: [
      ["Sign in", "Rooms, runs and replays are tied to your account."],
      [
        "Open a room",
        "Public rooms are listed for anyone to join. Unlisted rooms are reachable only through their link. A public room can ask for a partner, which puts it at the top of the list until someone joins.",
      ],
      ["Invite someone", "Copy the invite link from the room and send it. Anyone signed in can join from it."],
    ],
  },
  {
    label: "Solve",
    steps: [
      ["Pick a problem", "Whoever opened the room chooses. Everyone sees the statement, examples and starter code."],
      ["Write it together", "One editor, both cursors, chat alongside."],
      ["Run the tests", "Your code runs against the examples and a set of hidden tests. The verdict shows up for everyone."],
    ],
  },
  {
    label: "Review",
    steps: [
      [
        "Replay the session",
        "Once the room closes, anyone who was in it can replay it from Past sessions on the dashboard: the code as it was typed, the chat, and every run.",
      ],
    ],
  },
];

// Steps are numbered straight through, across the phases.
const firstStep = (phaseIndex: number) =>
  PHASES.slice(0, phaseIndex).reduce((count, phase) => count + phase.steps.length, 1);

const CONTRIBUTING_URL = "https://github.com/naman0r/tandemcode/blob/main/CONTRIBUTING.md#adding-a-problem";

const FAQ: [string, ReactNode][] = [
  ["Which languages can I use?", "Python 3.11 for now. Other languages need their own sandbox and will come later."],
  [
    "How many people can be in a room?",
    "There is no limit, but rooms are built for pairs. Asking for a partner stops once two people are in the room.",
  ],
  [
    "Who can see my code?",
    "Anyone in the room. Public rooms are listed, so any signed-in user can join them. An unlisted room is only reachable through its invite link, so keep the link to the people you want there.",
  ],
  [
    "What are hidden tests, and why can't I see why one failed?",
    "Each problem has a few example tests you can see and more you can't. If a hidden test fails you learn that it failed, but not its input or your output, so the only way to pass is to solve the problem.",
  ],
  [
    "Where does my code run?",
    "Each run gets its own throwaway container with no network access, a read-only file system, and time and memory limits. It is deleted when the run ends.",
  ],
  [
    "Why can't I start another run?",
    "Each person gets one run at a time, so a loop of submissions cannot hold up everyone else's. Wait for your verdict and try again.",
  ],
  [
    "What happens if I refresh or lose my connection?",
    "You rejoin when the page reconnects, and the chat history comes back. A dropped connection never closes the room; only pressing Leave does.",
  ],
  [
    "When does a room close?",
    "When the person who opened it leaves and nobody else is still in it. After that it can be replayed, not joined.",
  ],
  [
    "Can I add a problem?",
    <>
      Yes. A problem is a pull request with its statement, tests and a solution that proves the tests are
      right.{" "}
      <a
        href={CONTRIBUTING_URL}
        className="font-medium text-zinc-900 underline decoration-orange-500 decoration-2 underline-offset-4 hover:text-orange-600 dark:text-zinc-100 dark:hover:text-orange-400"
      >
        The guide
      </a>{" "}
      walks through every step.
    </>,
  ],
  ["Is TandemCode open source?", "Yes, under the Apache 2.0 licence. The source is on GitHub, linked at the bottom of every page."],
];

// One staggered entrance for the page; skipped when reduced motion is asked for.
const Rise = ({ delay, className = "", children }: { delay: number; className?: string; children: ReactNode }) => (
  <div className={`motion-safe:animate-rise ${className}`} style={{ animationDelay: `${delay}ms` }}>
    {children}
  </div>
);

const eyebrow = "font-mono text-xs uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400";

// Three things that do not know about each other, pinned at odd angles.
const Scattered = () => (
  <div className="relative h-64">
    <div className="absolute top-2 left-2 w-56 -rotate-6 rounded-lg border border-dashed border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className={`${muted} flex items-center gap-2 text-xs`}>
        <Video className="h-4 w-4" /> Video call · 00:42:13
      </div>
      <div className="mt-3 h-16 rounded bg-zinc-100 dark:bg-zinc-800" />
    </div>
    <div className="absolute top-16 right-4 w-52 rotate-3 rounded-lg border border-dashed border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className={`${muted} flex items-center gap-2 text-xs`}>
        <FileText className="h-4 w-4" /> Untitled document
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="h-2 w-5/6 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-2 w-2/3 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-2 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>
    </div>
    <div className="absolute bottom-2 left-12 w-60 -rotate-2 rounded-lg border border-dashed border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className={`${muted} flex items-center gap-2 text-xs`}>
        <Terminal className="h-4 w-4" /> judge · tab 3 of 11
      </div>
      <div className="mt-3 font-mono text-xs text-zinc-400">paste code here, run, switch back...</div>
    </div>
  </div>
);

// The same three jobs in one window, like the one on the landing page.
const OneRoom = () => (
  <div className="overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl shadow-black/20 ring-1 ring-zinc-800">
    <div className="flex items-center justify-between bg-zinc-800 px-4 py-2.5 text-xs">
      <span className="font-mono text-zinc-400">valid_parentheses.py</span>
      <span className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-orange-300">
          <span className="h-2 w-2 rounded-full bg-orange-400" /> Alice
        </span>
        <span className="flex items-center gap-1.5 text-sky-300">
          <span className="h-2 w-2 rounded-full bg-sky-400" /> Bob
        </span>
      </span>
    </div>
    <div className="grid grid-cols-[1fr_9rem]">
      <pre className="p-4 font-mono text-xs leading-6 text-zinc-300">
        <span className="text-purple-400">for</span> ch <span className="text-purple-400">in</span> s:{"\n"}
        {"  "}
        <span className="text-purple-400">if</span> ch <span className="text-purple-400">in</span> pairs:{"\n"}
        {"    "}stack.append(ch)
        <span className="ml-0.5 inline-block h-3.5 w-0.5 bg-sky-400 align-middle" />
        {"\n"}
        {"  "}
        <span className="text-purple-400">elif</span> <span className="text-purple-400">not</span> stack
        <span className="ml-0.5 inline-block h-3.5 w-0.5 bg-orange-400 align-middle" />
      </pre>
      <div className="space-y-2 border-l border-zinc-800 p-3 text-[11px] leading-4">
        <p className="rounded-md bg-zinc-800 px-2 py-1.5 text-zinc-300">
          <span className="text-orange-300">Alice</span> empty string?
        </p>
        <p className="rounded-md bg-zinc-800 px-2 py-1.5 text-zinc-300">
          <span className="text-sky-300">Bob</span> returns True
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2 border-t border-zinc-800 bg-zinc-800/60 px-4 py-2.5 text-xs text-green-400">
      <span className="h-2 w-2 rounded-full bg-green-500" /> 6/6 tests passed, seen by both
    </div>
  </div>
);

const About = () => (
  <Layout wide>
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem]" aria-hidden>
        <div className="absolute -top-24 left-1/4 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(closest-side,rgba(249,115,22,0.14),transparent)] dark:bg-[radial-gradient(closest-side,rgba(249,115,22,0.24),transparent)]" />
        <div className="absolute top-20 right-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(closest-side,rgba(30,58,138,0.18),transparent)] dark:bg-[radial-gradient(closest-side,rgba(37,99,235,0.24),transparent)]" />
      </div>

      <section className="max-w-4xl pt-10 pb-20 lg:pt-20 lg:pb-28">
        <Rise delay={0}>
          <p className={eyebrow}>About</p>
        </Rise>
        <Rise delay={80}>
          <h1 className="mt-5 text-5xl leading-[1.05] font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Interviews happen out loud.
            <br />
            <span className="text-orange-500 dark:text-orange-400">Practice should too.</span>
          </h1>
        </Rise>
        <Rise delay={160}>
          <p className={`${muted} mt-8 max-w-2xl text-xl leading-relaxed`}>
            In a coding interview you think aloud while someone watches your code take shape. Most
            practice happens alone and in silence. TandemCode is a place to practise the way the real
            thing works: with another person, on one problem, in one editor.
          </p>
        </Rise>
      </section>

      <Rise delay={240}>
        <section className="grid items-start gap-12 border-y border-zinc-200 py-16 lg:grid-cols-2 lg:gap-20 dark:border-zinc-800">
          <div>
            <p className={eyebrow}>Without it</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Three tabs that don't talk to each other</h2>
            <p className={`${muted} mt-3 max-w-md leading-relaxed`}>
              A call to talk, a document to type in that cannot run anything, and a judge in another
              tab that only one of you can see.
            </p>
            <div className="mt-8">
              <Scattered />
            </div>
          </div>
          <div>
            <p className={eyebrow}>With TandemCode</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">One room</h2>
            <p className={`${muted} mt-3 max-w-md leading-relaxed`}>
              A shared editor with both cursors, chat beside it, and tests that pass or fail in front
              of both of you. When you are done, replay the session to see how you got there.
            </p>
            <div className="mt-8">
              <OneRoom />
            </div>
          </div>
        </section>
      </Rise>

      <section className="py-20 lg:py-28">
        <p className={eyebrow}>How to use it</p>
        <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
          From an empty room to a replay in seven steps
        </h2>
        <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
          {PHASES.map((phase, phaseIndex) => (
            <div key={phase.label}>
              <div className="flex items-baseline gap-3 border-t-2 border-orange-500 pt-4">
                <span className="font-mono text-sm text-orange-600 dark:text-orange-400">0{phaseIndex + 1}</span>
                <h3 className="text-lg font-semibold">{phase.label}</h3>
              </div>
              <ol className="mt-6 space-y-7 border-l border-zinc-200 pl-6 dark:border-zinc-800">
                {phase.steps.map(([title, text], stepIndex) => (
                  <li key={title} className="relative">
                    <span className="absolute top-0.5 -left-[2.1rem] flex h-5 w-5 items-center justify-center rounded-full bg-zinc-50 font-mono text-[10px] font-semibold text-zinc-500 ring-1 ring-zinc-300 dark:bg-zinc-950 dark:text-zinc-400 dark:ring-zinc-700">
                      {firstStep(phaseIndex) + stepIndex}
                    </span>
                    <h4 className="font-medium">{title}</h4>
                    <p className={`${muted} mt-1 text-sm leading-relaxed`}>{text}</p>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-10 border-t border-zinc-200 py-20 lg:grid-cols-[1fr_2fr] lg:gap-16 lg:py-28 dark:border-zinc-800">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className={eyebrow}>FAQ</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Questions, answered</h2>
          <p className={`${muted} mt-4 leading-relaxed`}>
            Something missing?{" "}
            <a
              href="https://github.com/naman0r/tandemcode/issues"
              className="font-medium text-zinc-900 underline decoration-orange-500 decoration-2 underline-offset-4 hover:text-orange-600 dark:text-zinc-100 dark:hover:text-orange-400"
            >
              Open an issue
            </a>
            .
          </p>
          <a
            href={CONTRIBUTING_URL}
            className="group mt-8 block rounded-xl border border-orange-200 bg-orange-50 p-5 transition-colors hover:border-orange-400 dark:border-orange-900 dark:bg-orange-950/40 dark:hover:border-orange-600"
          >
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400">
              Contribute
            </p>
            <p className="mt-2 font-semibold">Add a problem to TandemCode</p>
            <p className={`${muted} mt-1 text-sm leading-relaxed`}>
              Write the statement, tests and a solution, and open a pull request. CI checks that your
              solution passes every test.
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 dark:text-orange-400">
              Read the guide
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </a>
        </div>
        <div className="border-t border-zinc-200 dark:border-zinc-800">
          {FAQ.map(([question, answer], index) => (
            <details key={question} className="group border-b border-zinc-200 dark:border-zinc-800">
              <summary className="flex cursor-pointer list-none items-center gap-5 py-5 [&::-webkit-details-marker]:hidden">
                <span className="font-mono text-xs text-zinc-400 group-open:text-orange-500">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 font-medium group-hover:text-orange-600 dark:group-hover:text-orange-400">
                  {question}
                </span>
                <Plus className="h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-45 group-open:text-orange-500" />
              </summary>
              <p className={`${muted} max-w-2xl pb-6 pl-10 leading-relaxed`}>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="relative mb-8 overflow-hidden rounded-3xl bg-zinc-900 px-8 py-14 text-white sm:px-14">
        <div
          className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-[radial-gradient(closest-side,rgba(249,115,22,0.35),transparent)]"
          aria-hidden
        />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <h2 className="max-w-lg text-3xl font-bold tracking-tight">
            Find a partner. <span className="text-orange-400">Open a room.</span>
          </h2>
          <div className="flex flex-wrap gap-3">
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="group inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-zinc-950 transition-colors hover:bg-orange-400"
                >
                  Sign in to start
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                to="/rooms/create"
                className="group inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-zinc-950 transition-colors hover:bg-orange-400"
              >
                Create a room
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </SignedIn>
            <Link
              to="/rooms"
              className="inline-flex items-center rounded-xl px-6 py-3 font-semibold text-zinc-200 ring-1 ring-zinc-700 transition-colors hover:bg-zinc-800"
            >
              Browse rooms
            </Link>
          </div>
        </div>
      </section>
    </div>
  </Layout>
);

export default About;
