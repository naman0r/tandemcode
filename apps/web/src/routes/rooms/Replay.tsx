import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Pause, Play } from "lucide-react";
import Editor from "@monaco-editor/react";
import type { OnMount } from "@monaco-editor/react";
import * as Y from "yjs";
import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";
import { readSyncMessage } from "y-protocols/sync";
import Layout from "../../components/Layout";
import RequireSignIn from "../../components/RequireSignIn";
import { roomApi } from "../../lib/api";
import { useTheme } from "../../lib/theme";
import { badge, button, card, difficulty, muted } from "../../lib/ui";

type Replay = {
  room: { id: string; name: string; description: string | null; createdByName: string | null; createdAt: string };
  updates: { ts: string; data: string }[];
  events: { ts: string; type: string; payload: { username?: string; text?: string } }[];
  submissions: { id: string; userName: string | null; status: string; createdAt: string; result: { passed: number; total: number } | null }[];
};

type Moment = { ts: number; text: string; tone?: string };

const TICK_MS = 40;

const decode = (base64: string): Uint8Array =>
  Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));

// The relay stored the framed sync messages it forwarded. Feeding them to a
// fresh document in order rebuilds the text as it was after each keystroke.
// Frames are whatever a client sent, so one that does not parse is skipped
// rather than allowed to blank the whole replay.
const applyFramed = (doc: Y.Doc, framed: Uint8Array) => {
  try {
    const decoder = decoding.createDecoder(framed);
    decoding.readVarUint(decoder);
    readSyncMessage(decoder, encoding.createEncoder(), doc, null);
  } catch (err) {
    console.warn("Skipped a replay frame that did not parse:", err);
  }
};

const clock = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const Timeline = ({ replay }: { replay: Replay }) => {
  const { theme } = useTheme();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const docRef = useRef(new Y.Doc());
  const appliedRef = useRef(0);
  const [position, setPosition] = useState(replay.updates.length);
  const [playing, setPlaying] = useState(false);

  const frames = useMemo(() => replay.updates.map((update) => decode(update.data)), [replay.updates]);
  const startedAt = new Date(replay.room.createdAt).getTime();

  const moments = useMemo<Moment[]>(() => {
    const chats = replay.events
      .filter((event) => event.type === "chat")
      .map((event) => ({ ts: new Date(event.ts).getTime(), text: `${event.payload.username}: ${event.payload.text}` }));
    const runs = replay.submissions.map((submission) => ({
      ts: new Date(submission.createdAt).getTime(),
      text: `${submission.userName ?? "Someone"} ran the tests: ${submission.status.replace(/_/g, " ")}${
        submission.result ? ` (${submission.result.passed}/${submission.result.total})` : ""
      }`,
      tone: submission.status === "accepted" ? difficulty.easy : difficulty.hard,
    }));
    return [...chats, ...runs].sort((a, b) => a.ts - b.ts);
  }, [replay]);

  // Forward is incremental. Backward starts over: Yjs updates only add.
  useEffect(() => {
    if (position < appliedRef.current) {
      docRef.current = new Y.Doc();
      appliedRef.current = 0;
    }
    while (appliedRef.current < position) {
      applyFramed(docRef.current, frames[appliedRef.current]);
      appliedRef.current += 1;
    }
    editorRef.current?.setValue(docRef.current.getText("code").toString());
  }, [position, frames]);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setPosition((current) => {
        if (current >= frames.length) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [playing, frames.length]);

  const now = position === 0 ? startedAt : new Date(replay.updates[position - 1].ts).getTime();

  const togglePlay = () => {
    if (!playing && position >= frames.length) setPosition(0);
    setPlaying((current) => !current);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className={`${card} overflow-hidden lg:col-span-2`}>
        <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
          <button type="button" onClick={togglePlay} className={`${button.secondary} px-2`} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={frames.length}
            value={position}
            onChange={(event) => {
              setPlaying(false);
              setPosition(Number(event.target.value));
            }}
            className="flex-1 accent-orange-500"
            aria-label="Position in session"
          />
          <span className={`${muted} w-24 text-right font-mono text-xs`}>
            {clock(now - startedAt)} · {position}/{frames.length}
          </span>
        </div>
        <Editor
          height="480px"
          defaultLanguage="python"
          theme={theme === "dark" ? "vs-dark" : "light"}
          onMount={(editor) => {
            editorRef.current = editor;
            editor.setValue(docRef.current.getText("code").toString());
          }}
          options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false, automaticLayout: true, padding: { top: 12, bottom: 12 }, wordWrap: "on" }}
        />
      </section>

      <section className={`${card} p-4`}>
        <h2 className="mb-3 font-semibold">What happened</h2>
        {moments.length === 0 ? (
          <p className={`${muted} text-sm`}>No chat or runs in this session.</p>
        ) : (
          <ol className="max-h-[480px] space-y-2 overflow-y-auto text-sm">
            {moments.map((moment, index) => {
              const happened = moment.ts <= now;
              return (
                <li key={index} className={`flex gap-2 ${happened ? "" : "opacity-40"}`}>
                  <span className={`${muted} w-10 shrink-0 font-mono text-xs`}>{clock(moment.ts - startedAt)}</span>
                  <span className={moment.tone ? badge(moment.tone) : ""}>{moment.text}</span>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
};

const ReplayPage = ({ roomId }: { roomId: string }) => {
  const [replay, setReplay] = useState<Replay | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    roomApi
      .getReplay(roomId)
      .then(setReplay)
      .catch((err) => {
        setError(err?.response?.status === 403 ? "You were not in this room." : "This session could not be loaded.");
      });
  }, [roomId]);

  if (error) {
    return (
      <div className={`${card} mx-auto max-w-md p-8 text-center`}>
        <h1 className="text-lg font-semibold">Replay unavailable</h1>
        <p className={`${muted} mt-1 mb-6 text-sm`}>{error}</p>
        <Link to="/dashboard" className={button.primary}>
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!replay) return <p className={`${muted} text-sm`}>Loading session...</p>;

  return (
    <>
      <div className="mb-6">
        <p className={`${muted} text-xs uppercase tracking-wide`}>Replay</p>
        <h1 className="text-2xl font-semibold">{replay.room.name}</h1>
        <p className={`${muted} mt-1 text-sm`}>
          {replay.room.description ? `${replay.room.description} · ` : ""}
          opened by {replay.room.createdByName ?? "someone"} on {new Date(replay.room.createdAt).toLocaleString()}
        </p>
      </div>
      <Timeline replay={replay} />
    </>
  );
};

const Replay = () => {
  const { roomId } = useParams();
  return (
    <Layout wide>
      <RequireSignIn>{roomId && <ReplayPage roomId={roomId} />}</RequireSignIn>
    </Layout>
  );
};

export default Replay;
