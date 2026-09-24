import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../../components/Layout";
import InviteButton from "../../components/InviteButton";
import RequireSignIn from "../../components/RequireSignIn";
import { problemApi, roomApi } from "../../lib/api";
import type { RoomVisibility } from "../../lib/api";
import { inviteLink } from "../../lib/format";
import { badge, button, card, difficulty, input, muted, title } from "../../lib/ui";

type Problem = { id: string; title: string; difficulty: string };

const VISIBILITY_OPTIONS: { value: RoomVisibility; label: string; hint: string }[] = [
  { value: "public", label: "Public", hint: "Listed on the rooms page. You can still send the link." },
  { value: "unlisted", label: "Unlisted", hint: "Not listed. Only people with the link can join." },
];

// An unlisted room is only reachable through its link, so the link is the
// next thing to show, before the room itself.
const InviteStep = ({ roomId }: { roomId: string }) => {
  const link = inviteLink(roomId);
  return (
    <div className={`${card} mx-auto max-w-md space-y-5 p-6`}>
      <div>
        <h1 className={`${title} text-4xl`}>Your room is ready</h1>
        <p className={`${muted} mt-2 text-sm`}>
          It is unlisted, so this link is the only way in. Send it to your partner.
        </p>
      </div>
      <div className="flex gap-3">
        <input className={input} value={link} readOnly onFocus={(event) => event.target.select()} />
        <InviteButton roomId={roomId} label="Copy" />
      </div>
      <div className="flex justify-end">
        <Link to={`/rooms/${roomId}`} className={button.primary}>
          Enter the room
        </Link>
      </div>
    </div>
  );
};

const CreateRoomForm = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const problemId = params.get("problem");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<RoomVisibility>("public");
  const [advertised, setAdvertised] = useState(false);
  const [unlistedRoomId, setUnlistedRoomId] = useState<string | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Arriving from the problems page: the room opens with that problem set.
  useEffect(() => {
    if (!problemId) return;
    problemApi
      .getProblem(problemId)
      .then((loaded: Problem) => {
        setProblem(loaded);
        setName((current) => current || loaded.title);
      })
      .catch(() => setProblem(null));
  }, [problemId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const room = await roomApi.createRoom({
        name: name.trim(),
        description: description.trim(),
        visibility,
        advertised: visibility === "public" && advertised,
      });
      // The room exists either way; a problem can still be picked inside it.
      if (problem) {
        await roomApi
          .setRoomProblem(room.id, problem.id)
          .catch((err) => console.error("Failed to set the problem:", err));
      }
      if (visibility === "unlisted") setUnlistedRoomId(room.id);
      else navigate(`/rooms/${room.id}`);
    } catch (err) {
      console.error("Failed to create room:", err);
      setError("Could not create the room. Try again.");
      setCreating(false);
    }
  };

  if (unlistedRoomId) return <InviteStep roomId={unlistedRoomId} />;

  return (
    <form onSubmit={submit} className={`${card} mx-auto max-w-md space-y-5 p-6`}>
      <div>
        <h1 className={`${title} text-4xl`}>Create a room</h1>
        <p className={`${muted} mt-2 text-sm`}>Every room has an invite link, public or not.</p>
      </div>

      {problem && (
        <div className="flex items-center justify-between border-2 border-orange-800 bg-orange-950 px-3 py-2 text-sm">
          <span>
            Problem: <span className="font-medium">{problem.title}</span>
          </span>
          <span className={badge(difficulty[problem.difficulty])}>{problem.difficulty}</span>
        </div>
      )}

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Name</span>
        <input
          className={input}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Tuesday practice"
          required
          autoFocus
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">
          Description <span className={muted}>(optional)</span>
        </span>
        <textarea
          className={`${input} resize-none`}
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What you want to work on"
        />
      </label>

      <fieldset className="space-y-2 text-sm">
        <legend className="mb-1 font-medium">Who can find it</legend>
        {VISIBILITY_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer gap-3 border-2 px-3 py-2 ${
              visibility === option.value
                ? "border-orange-500 bg-orange-950"
                : "border-zinc-700 hover:border-zinc-500"
            }`}
          >
            <input
              type="radio"
              name="visibility"
              value={option.value}
              checked={visibility === option.value}
              onChange={() => setVisibility(option.value)}
              className="mt-1 accent-orange-500"
            />
            <span>
              <span className="block font-medium">{option.label}</span>
              <span className={muted}>{option.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {visibility === "public" && (
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={advertised}
            onChange={(event) => setAdvertised(event.target.checked)}
            className="mt-1 accent-orange-500"
          />
          <span>
            <span className="block font-medium">Ask for a partner</span>
            <span className={muted}>
              Highlight the room on the rooms page until someone joins you.
            </span>
          </span>
        </label>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center justify-between">
        <Link to="/rooms" className={`${muted} text-sm hover:text-zinc-100`}>
          Back to rooms
        </Link>
        <button type="submit" disabled={creating || !name.trim()} className={button.primary}>
          {creating ? "Creating..." : "Create room"}
        </button>
      </div>
    </form>
  );
};

const CreateRoom = () => (
  <Layout>
    <RequireSignIn>
      <CreateRoomForm />
    </RequireSignIn>
  </Layout>
);

export default CreateRoom;
