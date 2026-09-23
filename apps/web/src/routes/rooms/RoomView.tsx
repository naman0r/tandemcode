import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check, Link2 } from "lucide-react";
import Layout from "../../components/Layout";
import RequireSignIn from "../../components/RequireSignIn";
import RoomChatComponent from "../../components/RoomChatComponent";
import RoomMembersPanel from "../../components/RoomMembersPanel";
import CollaborativeEditor from "../../components/CollaborativeEditor";
import { useUser } from "../../hooks/useUser";
import useWebSocket from "../../hooks/UseWebSocket";
import { problemApi, roomApi, submissionApi } from "../../lib/api";
import { badge, button, card, difficulty, muted } from "../../lib/ui";

type Problem = {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  timeLimitMs: number;
  memLimitMb: number;
  statement: string | null;
  starterCode: string | null;
  samples: { input: string; expected: string }[];
};

type TestOutcome = {
  index: number;
  hidden: boolean;
  passed: boolean;
  timeMs: number;
  stdout: string;
  stderr: string;
};

type Submission = {
  id: string;
  status: string;
  createdAt: string;
  result: { passed: number; total: number; timeMs: number; tests: TestOutcome[] } | null;
};

type Room = {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdByName: string | null;
  currentProblemId: string | null;
};

const PENDING_STATUSES = new Set(["pending", "running"]);
const POLL_MS = 1000;

const STATUS_TONE: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  running: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  accepted: difficulty.easy,
  wrong_answer: difficulty.hard,
  runtime_error: difficulty.hard,
  time_limit_exceeded: difficulty.hard,
};

const pre = "whitespace-pre-wrap rounded-md border border-zinc-200 bg-zinc-50 p-2 font-mono text-xs dark:border-zinc-800 dark:bg-zinc-950";

const VerdictPanel = ({ submission }: { submission: Submission }) => {
  const { result } = submission;
  const failed = result?.tests.find((test) => !test.passed);
  return (
    <div className="space-y-2 border-t border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800">
      <div className="flex flex-wrap items-center gap-2">
        <span className={badge(STATUS_TONE[submission.status])}>
          {submission.status.replace(/_/g, " ")}
        </span>
        {result && (
          <span className={muted}>
            {result.passed}/{result.total} tests passed in {result.timeMs} ms
          </span>
        )}
        <span className={`${muted} text-xs`}>
          {new Date(submission.createdAt).toLocaleTimeString()}
        </span>
      </div>
      {failed && (
        <div className="space-y-2">
          <p className="text-red-700 dark:text-red-300">
            Test {failed.index + 1}
            {failed.hidden ? " (hidden)" : ""} failed
          </p>
          {failed.stdout && <pre className={pre}>{failed.stdout}</pre>}
          {failed.stderr && <pre className={`${pre} text-red-700 dark:text-red-300`}>{failed.stderr}</pre>}
        </div>
      )}
    </div>
  );
};

const InviteButton = ({ roomId }: { roomId: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/rooms/${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button type="button" onClick={copy} className={button.secondary}>
      {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      {copied ? "Copied" : "Copy invite link"}
    </button>
  );
};

const LeaveRoomButton = ({ roomId }: { roomId: string }) => {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  const leave = async () => {
    setLeaving(true);
    try {
      await roomApi.leaveRoom(roomId);
    } catch (err) {
      // Staying put matters: navigating anyway would close the socket while the
      // room is still marked active and nobody is in it.
      console.error("Failed to leave room:", err);
      setLeaving(false);
      return;
    }
    // Navigating unmounts the hook, which closes the socket and lets the server
    // tell everyone still here that we have gone.
    navigate("/rooms");
  };

  return (
    <button type="button" onClick={leave} disabled={leaving} className={button.danger}>
      {leaving ? "Leaving..." : "Leave"}
    </button>
  );
};

const ProblemPicker = ({
  onPick,
  onClose,
}: {
  onPick: (problem: Problem) => void;
  onClose: () => void;
}) => {
  const [problems, setProblems] = useState<Problem[] | null>(null);
  useEffect(() => {
    problemApi.getAllProblems().then(setProblems).catch(() => setProblems([]));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className={`${card} flex max-h-[70vh] w-full max-w-lg flex-col shadow-xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <h2 className="font-semibold">Choose a problem</h2>
          <button type="button" onClick={onClose} className={button.ghost}>
            Close
          </button>
        </div>
        <div className="overflow-y-auto">
          {problems === null && <p className={`${muted} p-5 text-sm`}>Loading...</p>}
          {problems?.map((problem) => (
            <button
              key={problem.id}
              type="button"
              onClick={() => onPick(problem)}
              className="flex w-full items-center justify-between border-b border-zinc-100 px-5 py-3 text-left text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
            >
              <span>
                {problem.title}
                {!problem.statement && <span className={`${muted} ml-2 text-xs`}>no tests yet</span>}
              </span>
              <span className={badge(difficulty[problem.difficulty])}>{problem.difficulty}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const Room = ({ roomId }: { roomId: string }) => {
  const user = useUser();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState("");
  const [lastSubmission, setLastSubmission] = useState<Submission | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [picking, setPicking] = useState(false);

  const { isConnected, connectionState, messages, members, sendMessage } = useWebSocket(
    room?.id ?? ""
  );
  const isOwner = room?.createdBy === user?.id;
  const running = submitting || (lastSubmission !== null && PENDING_STATUSES.has(lastSubmission.status));

  useEffect(() => {
    setLoading(true);
    roomApi
      .getRoom(roomId)
      .then(setRoom)
      .catch(() => setRoom(null))
      .finally(() => setLoading(false));
  }, [roomId]);

  useEffect(() => {
    if (!room?.currentProblemId) {
      setProblem(null);
      return;
    }
    problemApi.getProblem(room.currentProblemId).then(setProblem).catch(() => setProblem(null));
  }, [room?.currentProblemId]);

  // The runner writes the verdict to the row; the room finds out by asking.
  useEffect(() => {
    if (!lastSubmission || !PENDING_STATUSES.has(lastSubmission.status)) return;
    const timer = setInterval(async () => {
      try {
        setLastSubmission(await submissionApi.getSubmission(lastSubmission.id));
      } catch (err) {
        console.error("Failed to poll submission:", err);
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [lastSubmission]);

  const pickProblem = async (chosen: Problem) => {
    try {
      setRoom(await roomApi.setRoomProblem(roomId, chosen.id));
      setPicking(false);
    } catch (err) {
      console.error("Failed to assign problem:", err);
    }
  };

  const run = async () => {
    if (!problem) return;
    setSubmitting(true);
    try {
      setLastSubmission(
        await submissionApi.submit({ roomId, problemId: problem.id, language: "python", code })
      );
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className={`${muted} text-sm`}>Loading room...</p>;

  if (!room) {
    return (
      <div className={`${card} mx-auto max-w-md p-8 text-center`}>
        <h1 className="text-lg font-semibold">Room unavailable</h1>
        <p className={`${muted} mt-1 mb-6 text-sm`}>It may have closed, or the link is wrong.</p>
        <Link to="/rooms" className={button.primary}>
          Back to rooms
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{room.name}</h1>
          <p className={`${muted} mt-1 text-sm`}>
            {room.description ? `${room.description} · ` : ""}
            opened by {room.createdByName ?? "someone"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`${muted} mr-2 flex items-center gap-1.5 text-xs`}>
            <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
            {isConnected ? "Live" : "Connecting"}
          </span>
          <InviteButton roomId={roomId} />
          <LeaveRoomButton roomId={roomId} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className={`${card} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
              <span className={`${muted} text-xs`}>Python 3.11</span>
              <button
                type="button"
                onClick={run}
                disabled={running || !problem}
                title={problem ? "" : "Choose a problem first"}
                className={button.primary}
              >
                {running ? "Running..." : "Run tests"}
              </button>
            </div>
            <CollaborativeEditor
              roomId={roomId}
              starterCode={problem?.starterCode}
              onCodeChange={setCode}
            />
            {lastSubmission && <VerdictPanel submission={lastSubmission} />}
          </section>

          <section className={`${card} p-5`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                {problem ? problem.title : "No problem chosen"}
                {problem && <span className={badge(difficulty[problem.difficulty])}>{problem.difficulty}</span>}
              </h2>
              {isOwner && (
                <button type="button" onClick={() => setPicking(true)} className={button.secondary}>
                  {problem ? "Change" : "Choose a problem"}
                </button>
              )}
            </div>

            {!problem && (
              <p className={`${muted} text-sm`}>
                {isOwner ? "Choose a problem to get started." : "Waiting for the room owner to choose a problem."}
              </p>
            )}

            {problem && (
              <div className="space-y-4 text-sm">
                <p className="whitespace-pre-line">
                  {problem.statement ?? "This problem has no statement or tests yet."}
                </p>
                {problem.samples.map((sample, index) => (
                  <div key={index} className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className={`${muted} mb-1 text-xs`}>Sample input {index + 1}</p>
                      <pre className={pre}>{sample.input}</pre>
                    </div>
                    <div>
                      <p className={`${muted} mb-1 text-xs`}>Expected output</p>
                      <pre className={pre}>{sample.expected}</pre>
                    </div>
                  </div>
                ))}
                <p className={`${muted} text-xs`}>
                  Time limit {problem.timeLimitMs} ms · memory {problem.memLimitMb} MB
                </p>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <RoomMembersPanel members={members} connectionState={connectionState} />
          <RoomChatComponent isConnected={isConnected} messages={messages} sendMessage={sendMessage} />
        </div>
      </div>

      {picking && <ProblemPicker onPick={pickProblem} onClose={() => setPicking(false)} />}
    </>
  );
};

const RoomView = () => {
  const { roomId } = useParams();
  return (
    <Layout wide>
      <RequireSignIn>{roomId && <Room roomId={roomId} />}</RequireSignIn>
    </Layout>
  );
};

export default RoomView;
