import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { ArrowRight, FileText, Plus, Terminal, Video } from "lucide-react";
import Layout from "../components/Layout";
import { Mascot, Sprite } from "../components/Pixel";
import { button, eyebrow, heading, muted, title } from "../lib/ui";

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
        className="font-medium text-zinc-100 underline decoration-orange-500 decoration-2 underline-offset-4 hover:text-orange-400"
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

// Three things that do not know about each other, pinned at odd angles.
const Scattered = () => (
  <div className="relative h-64">
    <div className="absolute top-2 left-2 w-56 -rotate-6 border-2 border-dashed border-zinc-700 bg-zinc-900 p-4">
      <div className={`${muted} flex items-center gap-2 text-xs`}>
        <Video className="h-4 w-4" /> Video call · 00:42:13
      </div>
      <div className="mt-3 h-16 bg-zinc-800" />
    </div>
    <div className="absolute top-16 right-4 w-52 rotate-3 border-2 border-dashed border-zinc-700 bg-zinc-900 p-4">
      <div className={`${muted} flex items-center gap-2 text-xs`}>
        <FileText className="h-4 w-4" /> Untitled document
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="h-2 w-5/6 bg-zinc-700" />
        <div className="h-2 w-2/3 bg-zinc-700" />
        <div className="h-2 w-3/4 bg-zinc-700" />
      </div>
    </div>
    <div className="absolute bottom-2 left-12 w-60 -rotate-2 border-2 border-dashed border-zinc-700 bg-zinc-900 p-4">
      <div className={`${muted} flex items-center gap-2 text-xs`}>
        <Terminal className="h-4 w-4" /> judge · tab 3 of 11
      </div>
      <div className="mt-3 font-mono text-xs text-zinc-500">paste code here, run, switch back...</div>
    </div>
  </div>
);

// The same three jobs in one window, like the one on the landing page.
const OneRoom = () => (
  <div className="px-box overflow-hidden bg-zinc-900 [--px:#3f3f46]">
    <div className="flex items-center justify-between border-b-4 border-zinc-800 px-4 py-2.5">
      <span className="font-pixel text-lg text-zinc-300">valid_parentheses.py</span>
      <span className="flex items-center gap-3 font-pixel text-lg">
        <span className="flex items-center gap-1.5 text-orange-300">
          <Sprite name="maya" size={16} /> maya
        </span>
        <span className="flex items-center gap-1.5 text-sky-300">
          <Sprite name="theo" size={16} /> theo
        </span>
      </span>
    </div>
    <div className="grid grid-cols-[1fr_9rem]">
      <pre className="bg-zinc-950/60 p-4 font-mono text-xs leading-6 text-zinc-300">
        <span className="text-violet-300">for</span> ch <span className="text-violet-300">in</span> s:{"\n"}
        {"  "}
        <span className="text-violet-300">if</span> ch <span className="text-violet-300">in</span> pairs:{"\n"}
        {"    "}stack.append(ch)
        <span className="ml-0.5 inline-block h-3.5 w-0.5 bg-sky-400 align-middle" />
        {"\n"}
        {"  "}
        <span className="text-violet-300">elif</span> <span className="text-violet-300">not</span> stack
        <span className="ml-0.5 inline-block h-3.5 w-0.5 bg-orange-400 align-middle" />
      </pre>
      <div className="space-y-2 border-l-4 border-zinc-800 p-3 text-[11px] leading-4">
        <p className="border-l-4 border-orange-500 bg-zinc-800 px-2 py-1.5 text-zinc-300">
          <span className="text-orange-300">maya</span> empty string?
        </p>
        <p className="border-l-4 border-sky-500 bg-zinc-800 px-2 py-1.5 text-zinc-300">
          <span className="text-sky-300">theo</span> returns True
        </p>
      </div>
    </div>
    <div className="flex items-center gap-3 border-t-4 border-zinc-800 px-4 py-2.5 font-pixel text-xl">
      <span className="text-2xl text-emerald-400">ACCEPTED</span>
      <span className="text-zinc-400">6/6 tests, seen by both</span>
    </div>
  </div>
);

const About = () => (
  <Layout wide>
    <div>

      <section className="max-w-4xl pt-10 pb-20 lg:pt-20 lg:pb-28">
        <Rise delay={0}>
          <p className={eyebrow}>ABOUT</p>
        </Rise>
        <Rise delay={80}>
          <h1 className="mt-5 font-pixel text-6xl leading-[0.9] sm:text-7xl lg:text-8xl">
            Interviews happen out loud.
            <br />
            <span className="text-orange-500">Practice should too.</span>
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
        <section className="grid items-start gap-12 border-y-4 border-zinc-900 py-16 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className={eyebrow}>WITHOUT IT</p>
            <h2 className={`${heading} mt-3 text-4xl!`}>Three tabs that don't talk to each other</h2>
            <p className={`${muted} mt-3 max-w-md leading-relaxed`}>
              A call to talk, a document to type in that cannot run anything, and a judge in another
              tab that only one of you can see.
            </p>
            <div className="mt-8">
              <Scattered />
            </div>
          </div>
          <div>
            <p className={eyebrow}>WITH TANDEMCODE</p>
            <h2 className={`${heading} mt-3 text-4xl!`}>One room</h2>
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
        <p className={eyebrow}>HOW TO USE IT</p>
        <h2 className={`${title} mt-3 max-w-2xl`}>
          From an empty room to a replay in seven steps
        </h2>
        <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
          {PHASES.map((phase, phaseIndex) => (
            <div key={phase.label}>
              <div className="flex items-baseline gap-3 border-t-4 border-orange-500 pt-4">
                <span className="font-silk text-xs text-orange-400">0{phaseIndex + 1}</span>
                <h3 className={heading}>{phase.label}</h3>
              </div>
              <ol className="mt-6 space-y-7 border-l-4 border-zinc-900 pl-6">
                {phase.steps.map(([title, text], stepIndex) => (
                  <li key={title} className="relative">
                    <span className="absolute top-0 -left-[2.4rem] flex h-6 w-6 items-center justify-center border-2 border-zinc-700 bg-[#0c0c0e] font-pixel text-base text-zinc-400">
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

      <section className="grid gap-10 border-t-4 border-zinc-900 py-20 lg:grid-cols-[1fr_2fr] lg:gap-16 lg:py-28">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className={eyebrow}>FAQ</p>
          <h2 className={`${title} mt-3`}>Questions, answered</h2>
          <p className={`${muted} mt-4 leading-relaxed`}>
            Something missing?{" "}
            <a
              href="https://github.com/naman0r/tandemcode/issues"
              className="font-medium text-zinc-100 underline decoration-orange-500 decoration-2 underline-offset-4 hover:text-orange-400"
            >
              Open an issue
            </a>
            .
          </p>
          <a
            href={CONTRIBUTING_URL}
            className="px-box group mt-10 block bg-orange-950/50 p-5 [--px:#9a3412] hover:[--px:#f97316]"
          >
            <p className="font-silk text-xs tracking-[0.2em] text-orange-400">CONTRIBUTE</p>
            <p className={`${heading} mt-2`}>Add a problem to TandemCode</p>
            <p className={`${muted} mt-1 text-sm leading-relaxed`}>
              Write the statement, tests and a solution, and open a pull request. CI checks that your
              solution passes every test.
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 font-pixel text-xl text-orange-400">
              Read the guide
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </a>
        </div>
        <div className="border-t-2 border-zinc-800">
          {FAQ.map(([question, answer], index) => (
            <details key={question} className="group border-b-2 border-zinc-800">
              <summary className="flex cursor-pointer list-none items-center gap-5 py-5 [&::-webkit-details-marker]:hidden">
                <span className="font-silk text-xs text-zinc-500 group-open:text-orange-400">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 font-medium group-hover:text-orange-400">
                  {question}
                </span>
                <Plus className="h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-45 group-open:text-orange-500" />
              </summary>
              <p className={`${muted} max-w-2xl pb-6 pl-10 leading-relaxed`}>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="px-box mb-8 bg-zinc-900 px-8 py-12 [--px:#3f3f46] sm:px-14">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-6">
            <Mascot className="hidden h-24 w-24 sm:block" />
            <h2 className={`${title} max-w-lg`}>
              Find a partner. <span className="text-orange-500">Open a room.</span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-5">
            <SignedOut>
              <SignInButton mode="modal">
                <button type="button" className={`${button.primary} group px-5! py-2.5! text-2xl!`}>
                  Sign in to start
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link to="/rooms/create" className={`${button.primary} group px-5! py-2.5! text-2xl!`}>
                Create a room
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </SignedIn>
            <Link to="/rooms" className={`${button.secondary} px-5! py-2.5! text-2xl!`}>
              Browse rooms
            </Link>
          </div>
        </div>
      </section>
    </div>
  </Layout>
);

export default About;
