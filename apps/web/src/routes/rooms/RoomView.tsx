import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { UserPlus } from "lucide-react";
import Layout from "../../components/Layout";
import RequireSignIn from "../../components/RequireSignIn";
import RoomChatComponent from "../../components/RoomChatComponent";
import RoomMembersPanel from "../../components/RoomMembersPanel";
import CollaborativeEditor from "../../components/CollaborativeEditor";
import InviteButton from "../../components/InviteButton";
import { useUser } from "../../hooks/useUser";
import useWebSocket from "../../hooks/UseWebSocket";
import type { Submission } from "../../hooks/UseWebSocket";
import { problemApi, roomApi, submissionApi } from "../../lib/api";
import type { RoomVisibility } from "../../lib/api";
import { timeAgo } from "../../lib/format";
import { badge, button, card, difficulty, heading, muted, personColor, title } from "../../lib/ui";

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

type Room = {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdByName: string | null;
  currentProblemId: string | null;
  visibility: RoomVisibility;
  advertised: boolean;
};

const PENDING_STATUSES = new Set(["pending", "running"]);

const STATUS_TONE: Record<string, string> = {
  pending: "border-amber-800 bg-amber-950 text-amber-300",
  running: "border-orange-800 bg-orange-950 text-orange-300",
  accepted: difficulty.easy,
  wrong_answer: difficulty.hard,
  runtime_error: difficulty.hard,
  time_limit_exceeded: difficulty.hard,
};

const pre = "whitespace-pre-wrap border-2 border-zinc-800 bg-zinc-950 p-2 font-mono text-xs";

// The verdict is the moment the room waits for, so it gets the big type.
const VERDICT_TEXT: Record<string, string> = {
  pending: "text-amber-300",
  running: "text-orange-300",
  accepted: "text-emerald-400",
};

const VerdictPanel = ({ submission, color }: { submission: Submission; color: string }) => {
  const { result } = submission;
  const failed = result?.tests.find((test) => !test.passed);
  return (
    <div className="space-y-2 border-t-4 border-zinc-800 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={`font-pixel text-3xl leading-none uppercase ${VERDICT_TEXT[submission.status] ?? "text-red-400"}`}>
          {submission.status.replace(/_/g, " ")}
        </span>
        <span className="font-medium" style={{ color }}>
          {submission.userName ?? "Someone"}
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
          <p className="text-red-300">
            Test {failed.index + 1}
            {failed.hidden ? " (hidden)" : ""} failed
          </p>
          {failed.stdout && <pre className={pre}>{failed.stdout}</pre>}
          {failed.stderr && <pre className={`${pre} text-red-300`}>{failed.stderr}</pre>}
        </div>
      )}
    </div>
  );
};

const RunHistory = ({
  submissions,
  selectedId,
  onSelect,
  colorOf,
}: {
  submissions: Submission[];
  selectedId: string | null;
  onSelect: (submission: Submission) => void;
  colorOf: (userId: string) => string;
}) => (
  <section className={`${card} p-4`}>
    <h2 className={`${heading} mb-3`}>Runs</h2>
    {submissions.length === 0 ? (
      <p className={`${muted} text-sm`}>No runs yet.</p>
    ) : (
      <ul className="max-h-64 space-y-1 overflow-y-auto">
        {submissions.map((submission) => (
          <li key={submission.id}>
            <button
              type="button"
              onClick={() => onSelect(submission)}
              className={`flex w-full items-center justify-between gap-2 border-l-4 px-2 py-1.5 text-left text-sm hover:bg-zinc-800 ${
                submission.id === selectedId ? "bg-zinc-800" : ""
              }`}
              style={{ borderColor: colorOf(submission.userId) }}
            >
              <span className="truncate">
                {submission.userName ?? "Someone"}
                <span className={`${muted} ml-2 text-xs`}>{timeAgo(submission.createdAt)}</span>
              </span>
              <span className={badge(STATUS_TONE[submission.status])}>
                {submission.result
                  ? `${submission.result.passed}/${submission.result.total}`
                  : submission.status.replace(/_/g, " ")}
              </span>
            </button>
          </li>
        ))}
      </ul>
    )}
  </section>
);

// Asking for a partner only means something while you are alone, so the
// button is not offered once someone has joined.
const VISIBILITIES: RoomVisibility[] = ["public", "unlisted"];

const ListingControls = ({
  room,
  alone,
  onChange,
}: {
  room: Room;
  alone: boolean;
  onChange: (room: Room) => void;
}) => {
  const [saving, setSaving] = useState(false);
  const save = async (visibility: RoomVisibility, advertised: boolean) => {
    setSaving(true);
    try {
      onChange(await roomApi.setListing(room.id, { visibility, advertised: visibility === "public" && advertised }));
    } catch (err) {
      console.error("Failed to update the room listing:", err);
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <div
        role="radiogroup"
        aria-label="Who can find this room"
        className="px-box inline-flex shrink-0 bg-zinc-900 [--px:#3f3f46]"
      >
        {VISIBILITIES.map((visibility) => (
          <button
            key={visibility}
            type="button"
            role="radio"
            aria-checked={room.visibility === visibility}
            disabled={saving}
            onClick={() => visibility !== room.visibility && save(visibility, room.advertised)}
            className={`px-3 py-1.5 font-pixel text-xl leading-none capitalize transition-colors disabled:cursor-not-allowed ${
              room.visibility === visibility ? "bg-orange-500 text-zinc-950" : "text-zinc-400 hover:text-zinc-100"
            }`}
          >
            {visibility}
          </button>
        ))}
      </div>
      {room.visibility === "public" && alone && (
        <button
          type="button"
          aria-pressed={room.advertised}
          disabled={saving}
          onClick={() => save("public", !room.advertised)}
          title={room.advertised ? "Stop asking" : "Highlight this room on the rooms page"}
          className={room.advertised ? button.active : button.secondary}
        >
          {room.advertised ? (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping bg-orange-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 bg-orange-500" />
            </span>
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {room.advertised ? "Looking for a partner" : "Ask for a partner"}
        </button>
      )}
    </>
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
        className={`${card} flex max-h-[70vh] w-full max-w-lg flex-col`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-zinc-800 px-5 py-3">
          <div>
            <h2 className={heading}>Choose a problem</h2>
            <p className={`${muted} text-xs`}>The editor switches to the new problem's starter code.</p>
          </div>
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
              className="flex w-full items-center justify-between border-b-2 border-zinc-800 px-5 py-3 text-left text-sm hover:bg-zinc-800"
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const { isConnected, connectionState, messages, members, submissions, problemChange, seedSubmissions, sendMessage } =
    useWebSocket(room?.id ?? "");
  const isOwner = room?.createdBy === user?.id;
  // One writer per room for the starter code: the owner, or with the owner
  // away, the lowest user id, so every client agrees without talking.
  const starterWriter = members.some((member) => member.userId === room?.createdBy)
    ? room?.createdBy
    : members.map((member) => member.userId).sort()[0];
  const rosterKey = members.map((member) => member.userId).join(" ");
  const colorOf = useCallback(
    (userId: string) => personColor(userId, user?.id, rosterKey.split(" ")),
    [user?.id, rosterKey],
  );
  // Explicit selection wins; otherwise the newest run is what the room is looking at.
  const shown = submissions.find((item) => item.id === selectedId) ?? submissions[0] ?? null;
  const running =
    submitting || submissions.some((item) => item.userId === user?.id && PENDING_STATUSES.has(item.status));

  useEffect(() => {
    setLoading(true);
    roomApi
      .getRoom(roomId)
      .then(setRoom)
      .catch(() => setRoom(null))
      .finally(() => setLoading(false));
  }, [roomId]);

  useEffect(() => {
    if (problemChange) setRoom((prev) => prev && { ...prev, currentProblemId: problemChange.problemId });
  }, [problemChange]);

  // A change made while the socket was down never arrives on it.
  useEffect(() => {
    if (!isConnected) return;
    roomApi.getRoom(roomId).then(setRoom).catch(() => {});
  }, [roomId, isConnected]);

  useEffect(() => {
    if (!room?.currentProblemId) {
      setProblem(null);
      return;
    }
    problemApi.getProblem(room.currentProblemId).then(setProblem).catch(() => setProblem(null));
  }, [room?.currentProblemId]);

  // Verdicts arrive over the socket. History, and anything missed while
  // disconnected, comes from the API each time the socket is (re)established.
  useEffect(() => {
    if (!room?.id || !isConnected) return;
    submissionApi
      .getSubmissionsForRoom(room.id)
      .then(seedSubmissions)
      .catch((err) => console.error("Failed to load runs:", err));
    // seedSubmissions is a stable setter wrapper; re-running on it would refetch every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id, isConnected]);

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
    setSelectedId(null);
    setRunError(null);
    try {
      await submissionApi.submit({ roomId, problemId: problem.id, language: "python", code });
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
      setRunError(typeof detail === "string" ? detail : "The run could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className={`${muted} text-sm`}>Loading room...</p>;

  if (!room) {
    return (
      <div className={`${card} mx-auto max-w-md p-8 text-center`}>
        <h1 className={heading}>Room unavailable</h1>
        <p className={`${muted} mt-1 mb-6 text-sm`}>
          It may have closed, or the link is wrong. If you were in it, the session can be replayed.
        </p>
        <div className="flex justify-center gap-2">
          <Link to={`/rooms/${roomId}/replay`} className={button.secondary}>
            Replay
          </Link>
          <Link to="/rooms" className={button.primary}>
            Back to rooms
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={`${title} flex flex-wrap items-center gap-3 text-4xl!`}>
            {room.name}
            {room.visibility === "unlisted" && <span className={badge(undefined)}>Unlisted</span>}
          </h1>
          <p className={`${muted} mt-2 text-sm`}>
            {room.description ? `${room.description} · ` : ""}
            opened by {room.createdByName ?? "someone"}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <span className={`${muted} mr-2 flex items-center gap-1.5 font-pixel text-lg`}>
            <span className={`h-2 w-2 ${isConnected ? "bg-emerald-500" : "animate-pulse bg-amber-500"}`} />
            {isConnected ? "Live" : "Connecting"}
          </span>
          {isOwner && <ListingControls room={room} alone={members.length < 2} onChange={setRoom} />}
          <InviteButton roomId={roomId} />
          <LeaveRoomButton roomId={roomId} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className={`${card} overflow-hidden`}>
            <div className="flex items-center justify-between border-b-4 border-zinc-800 px-4 py-2">
              <span className={`${muted} font-pixel text-lg`}>Python 3.11</span>
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
            {user && (
              <CollaborativeEditor
                roomId={roomId}
                user={{ id: user.id, name: user.name || "Someone" }}
                problemId={problem?.id}
                starterCode={problem?.starterCode}
                replacesOnProblemChange={isOwner}
                writesStarter={isOwner || starterWriter === user.id}
                onCodeChange={setCode}
                colorOf={colorOf}
              />
            )}
            {runError && (
              <p className="border-t-2 border-zinc-800 px-4 py-2 text-sm text-red-300">
                {runError}
              </p>
            )}
            {shown && <VerdictPanel submission={shown} color={colorOf(shown.userId)} />}
          </section>

          <section className={`${card} p-5`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className={`${heading} flex flex-wrap items-center gap-2`}>
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
          <RoomMembersPanel members={members} connectionState={connectionState} colorOf={colorOf} />
          <RunHistory
            submissions={submissions}
            selectedId={shown?.id ?? null}
            onSelect={(submission) => setSelectedId(submission.id)}
            colorOf={colorOf}
          />
          <RoomChatComponent isConnected={isConnected} messages={messages} sendMessage={sendMessage} colorOf={colorOf} />
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
